import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';
import { Item, Settings, addMin, toMin } from './data';

// iOS keeps at most 64 pending local notifications per app. Stay under it with a little headroom.
export const IOS_LIMIT = 60;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type PermissionState = 'granted' | 'denied' | 'undetermined';

export async function permissionState(): Promise<PermissionState> {
  const s = await Notifications.getPermissionsAsync();
  return s.granted ? 'granted' : s.canAskAgain ? 'undetermined' : 'denied';
}

export async function askPermission(): Promise<PermissionState> {
  const s = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return s.granted ? 'granted' : s.canAskAgain ? 'undetermined' : 'denied';
}

type Req = { content: Notifications.NotificationContentInput; trigger: Notifications.SchedulableNotificationTriggerInput };

const WEEKDAYS = [2, 3, 4, 5, 6]; // expo: 1 = Sunday ... 7 = Saturday
const WEEKENDS = [1, 7];

function triggersFor(time: string, days: Item['days']): Notifications.SchedulableNotificationTriggerInput[] {
  const [hour, minute] = [Math.floor(toMin(time) / 60), toMin(time) % 60];
  const channelId = Platform.OS === 'android' ? 'routine' : undefined;
  if (days === 'all') return [{ type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId }];
  const list = days === 'weekdays' ? WEEKDAYS : WEEKENDS;
  return list.map(weekday => ({ type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday, hour, minute, channelId }));
}

function bodyFor(item: Item, settings: Settings): string {
  switch (item.cat) {
    case 'run': return "Open Steady to see today's workout.";
    case 'vitamin': return settings.vitamins.join(', ') || 'Take your vitamins.';
    case 'food': return item.note || "Open Steady for today's menu. Protein first.";
    default: return item.note || 'Tap to open Steady and tick it off.';
  }
}

/** Builds every notification request in priority order: routine items first, then water nudges. */
export function plan(settings: Settings): { reqs: Req[]; total: number } {
  const reqs: Req[] = [];
  for (const item of settings.schedule) {
    if (!item.notify) continue;
    for (const trigger of triggersFor(item.time, item.days))
      reqs.push({ content: { title: item.title, body: bodyFor(item, settings), data: { id: item.id } }, trigger });
  }
  const s = settings.setup;
  if (settings.waterNudge !== 'off' && s.workDays !== 'none') {
    const step = settings.waterNudge === '1h' ? 60 : 120;
    const taken = new Set(settings.schedule.filter(i => i.notify).map(i => i.time));
    const end = (toMin(s.logoff) - toMin(s.login) + 1440) % 1440;
    for (let m = step; m < end; m += step) {
      const t = addMin(s.login, m);
      if (taken.has(t)) continue;
      for (const trigger of triggersFor(t, s.workDays === 'all' ? 'all' : 'weekdays'))
        reqs.push({ content: { title: 'Drink a glass of water', body: `Goal today: ${(settings.waterGoalMl / 1000).toFixed(1)} L. Log it in Steady.`, data: { id: 'water' } }, trigger });
    }
  }
  return { reqs: reqs.slice(0, IOS_LIMIT), total: reqs.length };
}

/** Replaces all scheduled notifications with the ones the current settings call for. */
export async function reschedule(settings: Settings): Promise<{ scheduled: number; skipped: number }> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!settings.notificationsOn) return { scheduled: 0, skipped: 0 };
  if ((await permissionState()) !== 'granted') return { scheduled: 0, skipped: 0 };
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('routine', {
      name: 'Routine reminders',
      importance: AndroidImportance.HIGH,
    });
  }
  const { reqs, total } = plan(settings);
  for (const r of reqs) await Notifications.scheduleNotificationAsync(r);
  return { scheduled: reqs.length, skipped: total - reqs.length };
}
