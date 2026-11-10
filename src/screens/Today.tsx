import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { DAY_NAMES, Item, addDays, keyOf, completion, dayMinFor, fmt12, itemsFor, noteFor, nowMin, toMin, waterPace, workoutFor, CATS } from '../data';
import { useStore } from '../store';
import { Btn, Card, H, Header, Label, T, catColor, useTheme } from '../ui';

export default function Today({ go }: { go: (tab: string) => void }) {
  const t = useTheme();
  const { settings, days, today, updateDay, notif, enableNotifications } = useStore();
  const date = new Date(today + 'T12:00:00');
  const now = new Date();
  const log = days[today];
  const items = itemsFor(settings, date);
  const n = nowMin();
  const done = (id: string) => !!log?.done[id];
  const pending = items.filter(i => !done(i.id));
  const due = pending.filter(i => toMin(i.time) <= n).pop();
  const focus = due || pending.find(i => toMin(i.time) > n);
  const pct = completion(settings, log, date);

  const toggle = (id: string) =>
    updateDay(today, d => {
      const doneMap = { ...d.done };
      if (doneMap[id]) delete doneMap[id]; else doneMap[id] = true;
      return { ...d, done: doneMap, waterMl: id === 'wake' && doneMap[id] && d.waterMl < 500 ? 500 : d.waterMl };
    });

  const expect = settings.waterGoalMl * waterPace(settings, date);
  const behind = expect - (log?.waterMl || 0) >= settings.glassMl * 2;

  const su = settings.setup;
  const dm = dayMinFor(su.wake);
  const isWork = items.some(i => i.id === 'login');
  const ws = isWork ? dm(su.login) : 720, we = isWork ? dm(su.logoff) : 1260;
  const segs: [string, number, number][] = isWork
    ? [['Morning', 0, ws], ['Work hours', ws, we], ['Evening', we, 3000]]
    : [['Morning', 0, 720], ['Afternoon', 720, 1080], ['Evening', 1080, 3000]];

  let when = '';
  if (focus) {
    const diff = toMin(focus.time) - n;
    when = diff <= 0
      ? diff > -15 ? 'Due now' : 'Overdue since ' + fmt12(focus.time)
      : 'In ' + (diff >= 60 ? `${Math.floor(diff / 60)} h ${diff % 60} min` : `${diff} min`) + ' · ' + fmt12(focus.time);
  }

  return (
    <View style={{ gap: 16 }}>
      <Header
        eyebrow={now.toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}
        title={DAY_NAMES[date.getDay()]}
        right={
          <View accessibilityLabel={`${Math.round(pct * 100)}% of today's routine done`}
            style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 6, borderColor: pct >= 0.7 ? t.accent : t.surface2, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: t.ink, fontWeight: '800', fontSize: 15 }}>{Math.round(pct * 100)}%</Text>
          </View>
        }
      />

      {!settings.setupDone && (
        <Card>
          <Label>Make it yours</Label>
          <H>Set up your routine in 1 minute</H>
          <T muted>Enter your wake, sleep, office and run times, and the app builds your day and reminders around them.</T>
          <Btn title="Start setup" kind="primary" onPress={() => go('setup')} />
        </Card>
      )}

      {notif.perm !== 'granted' && (
        <Card tone="warn">
          <T weight="700" color={t.warnInk}>
            {notif.perm === 'denied'
              ? 'Reminders are off. Turn on notifications for Expo Go (or Steady) in iPhone Settings → Notifications.'
              : 'Turn on reminders so your phone tells you when each habit is due.'}
          </T>
          {notif.perm !== 'denied' && <Btn title="Turn on reminders" kind="primary" onPress={enableNotifications} />}
        </Card>
      )}

      {focus ? (
        <Card tone="accent">
          <Label color={t.accentInk}>{when}</Label>
          <H size={24} color={t.accentInk}>{focus.title}</H>
          {!!noteFor(settings, log, focus, date) && <T color={t.accentInk}>{noteFor(settings, log, focus, date)}</T>}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <T color={t.accentInk} weight="600">{CATS[focus.cat]}</T>
            <Btn title="Mark done" kind="inverse" onPress={() => toggle(focus.id)} />
          </View>
        </Card>
      ) : (
        <Card tone="accent">
          <Label color={t.accentInk}>All done</Label>
          <H size={24} color={t.accentInk}>Routine complete for today</H>
          <T color={t.accentInk}>Rest well. Tomorrow: {workoutFor(settings, days[keyOf(addDays(date, 1))], addDays(date, 1)).title}.</T>
        </Card>
      )}

      {behind && (
        <Card tone="warn" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <T color={t.warnInk} weight="600" style={{ flex: 1 }}>
            Water is behind pace: {((log?.waterMl || 0) / 1000).toFixed(2)} L of {(expect / 1000).toFixed(1)} L expected by now.
          </T>
          <Btn title="+1 glass" small onPress={() => updateDay(today, d => ({ ...d, waterMl: d.waterMl + settings.glassMl }))} />
        </Card>
      )}

      {segs.map(([name, a, b]) => {
        const list = items.filter(i => { const m = dm(i.time); return m >= a && m < b; });
        if (!list.length) return null;
        return (
          <View key={name} style={{ gap: 6 }}>
            <Label style={{ paddingHorizontal: 4, paddingTop: 4 }}>{name}</Label>
            {list.map(i => <Row key={i.id} item={i} done={done(i.id)} now={focus?.id === i.id} note={noteFor(settings, log, i, date)} onToggle={() => toggle(i.id)} />)}
          </View>
        );
      })}
    </View>
  );
}

function Row({ item, done, now, note, onToggle }: { item: Item; done: boolean; now: boolean; note: string; onToggle: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onToggle} accessibilityRole="checkbox" accessibilityState={{ checked: done }} accessibilityLabel={item.title}
      style={{ flexDirection: 'row', gap: 10, padding: 12, borderRadius: 12, backgroundColor: t.surface, borderWidth: now ? 2 : 1, borderColor: now ? t.accent : t.line, alignItems: 'flex-start' }}>
      <Text style={{ width: 64, color: t.muted, fontSize: 13, fontVariant: ['tabular-nums'], paddingTop: 2 }}>{fmt12(item.time)}</Text>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: catColor(t, item.cat) }} />
          <Text style={{ flex: 1, color: done ? t.muted : t.ink, fontWeight: '700', fontSize: 15, textDecorationLine: done ? 'line-through' : 'none' }}>{item.title}</Text>
        </View>
        {!!note && <Text style={{ color: t.muted, fontSize: 13, lineHeight: 18 }}>{note}</Text>}
      </View>
      <View style={{ width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: done ? t.accent : t.line, backgroundColor: done ? t.accent : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
        {done && <Text style={{ color: t.accentInk, fontWeight: '900', fontSize: 15 }}>✓</Text>}
      </View>
    </Pressable>
  );
}
