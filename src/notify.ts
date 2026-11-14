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


const WEEKLY: Record<'weekdays' | 'weekends', number[]> = { weekdays: [1, 2, 3, 4, 5], weekends: [0, 6] }; // JS 0 = Sunday

/** Triggers for one task. `before` minutes earlier may cross midnight into the previous day. */
export function triggersFor(item: Item, now = new Date()): Notifications.SchedulableNotificationTriggerInput[] {
  const channelId = Platform.OS === 'android' ? 'routine' : undefined;
  const before = item.remindBefore || 0;
  let at = toMin(item.time) - before;
  const shift = at < 0 ? -1 : 0; // fires the day before
  at = (at + 1440) % 1440;
  const hour = Math.floor(at / 60), minute = at % 60;

  if (item.days === 'once') {
    if (!item.date) return [];
    const d = new Date(item.date + 'T00:00:00');
    d.setMinutes(toMin(item.time) - before);
    return d.getTime() > now.getTime() ? [{ type: Notifications.SchedulableTriggerInputTypes.DATE, date: d, channelId }] : [];
  }
  if (item.days === 'all') return [{ type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId }];
  const days = item.days === 'custom' ? (item.weekdays || []) : WEEKLY[item.days];
  // expo weekday: 1 = Sunday ... 7 = Saturday
  return days.map(d => ({ type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: ((d + shift + 7) % 7) + 1, hour, minute, channelId }));
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
    if (!item.notify || item.paused) continue;
    const title = item.remindBefore ? `In ${item.remindBefore} min: ${item.title}` : item.title;
    for (const trigger of triggersFor(item))
      reqs.push({ content: { title, body: bodyFor(item, settings), data: { id: item.id } }, trigger });
  }
  const s = settings.setup;
  if (settings.waterNudge !== 'off' && s.workDays !== 'none') {
    const step = settings.waterNudge === '1h' ? 60 : 120;
    const taken = new Set(settings.schedule.filter(i => i.notify && !i.paused).map(i => i.time));
    const end = (toMin(s.logoff) - toMin(s.login) + 1440) % 1440;
    for (let m = step; m < end; m += step) {
      const t = addMin(s.login, m);
      if (taken.has(t)) continue;
      const nudge: Item = { id: 'water', time: t, title: '', cat: 'water', days: s.workDays === 'all' ? 'all' : 'weekdays', note: '', notify: true };
      for (const trigger of triggersFor(nudge))
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
