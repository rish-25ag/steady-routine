import React, { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import {
  CATS, Cat, DayLog, Days, Item, REMIND_OPTIONS, SHORT_DAYS, addDays, dayMinFor, fmt12, isPastOnce, keyOf, occursOn, repeatLabel, uid,
} from '../data';
import { Btn, Choice, Divider, Field, Label, Row, T, TimeField, catColor, useTheme } from '../ui';

type Props = {
  items: Item[];
  wake: string;
  today: string;
  todayLog?: DayLog;
  onChange: (fn: (items: Item[]) => Item[]) => void;
  onSkipToday: (id: string, skip: boolean) => void;
};

const REPEATS: [Days, string][] = [['all', 'Every day'], ['weekdays', 'Weekdays'], ['weekends', 'Weekends'], ['custom', 'Chosen days'], ['once', 'One time']];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
/** Full-width field in a column: take the content's height instead of sharing space. */
const NATURAL = { flexGrow: 0, flexShrink: 0, flexBasis: 'auto' } as const;

export default function TaskList({ items, wake, today, todayLog, onChange, onSkipToday }: Props) {
  const t = useTheme();
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const dm = dayMinFor(wake);
  const byTime = (a: Item, b: Item) => dm(a.time) - dm(b.time);
  const set = (id: string, patch: Partial<Item>) => onChange(list => list.map(i => (i.id === id ? { ...i, ...patch } : i)));
  const remove = (id: string) => { onChange(list => list.filter(i => i.id !== id)); setOpen(null); };

  const add = (kind: 'today' | 'date' | 'repeat') => {
    const id = 'c' + uid();
    const tomorrow = keyOf(addDays(new Date(today + 'T12:00:00'), 1));
    const base: Item = { id, time: '18:00', title: 'New task', cat: 'rest', days: 'all', note: '', notify: true, remindBefore: 0 };
    const item: Item = kind === 'repeat' ? base : { ...base, days: 'once', date: kind === 'today' ? today : tomorrow };
    onChange(list => [...list, item]);
    setAdding(false);
    setOpen(id);
  };

  const repeating = items.filter(i => i.days !== 'once').sort(byTime);
  const upcoming = items.filter(i => i.days === 'once' && !isPastOnce(i, today))
    .sort((a, b) => (a.date || '').localeCompare(b.date || '') || byTime(a, b));
  const past = items.filter(i => isPastOnce(i, today));

  const section = (title: string, list: Item[]) => list.length ? (
    <View style={{ gap: 6 }}>
      <Label style={{ paddingTop: 4 }}>{title}</Label>
      {list.map(i => (
        <View key={i.id} style={{ borderWidth: 1, borderColor: open === i.id ? t.accent : t.line, borderRadius: 12, overflow: 'hidden' }}>
          <Summary item={i} skipped={!!todayLog?.skipped?.[i.id]} open={open === i.id} onPress={() => setOpen(open === i.id ? null : i.id)} />
          {open === i.id && (
            <Editor item={i} today={today} skipped={!!todayLog?.skipped?.[i.id]}
              onSet={patch => set(i.id, patch)} onDelete={() => remove(i.id)} onSkipToday={skip => onSkipToday(i.id, skip)} />
          )}
        </View>
      ))}
    </View>
  ) : null;

  return (
    <View style={{ gap: 12 }}>
      {adding ? (
        <View style={{ gap: 8, padding: 12, borderRadius: 12, backgroundColor: t.surface2 }}>
          <T weight="700">When is this task?</T>
          <Row>
            <Btn title="Today only" kind="primary" small onPress={() => add('today')} />
            <Btn title="On a date" small onPress={() => add('date')} />
            <Btn title="Repeating" small onPress={() => add('repeat')} />
            <Btn title="Cancel" kind="ghost" small onPress={() => setAdding(false)} />
          </Row>
        </View>
      ) : (
        <Btn title="+ Add task" kind="primary" onPress={() => setAdding(true)} />
      )}
      {section('Repeating', repeating)}
      {section('One-time', upcoming)}
      {past.length > 0 && (
        <View style={{ gap: 6 }}>
          {section('Past one-time', past)}
          <Btn title={`Clear ${past.length} past task${past.length > 1 ? 's' : ''}`} small kind="ghost"
            onPress={() => onChange(list => list.filter(i => !isPastOnce(i, today)))} />
        </View>
      )}
    </View>
  );
}

function Summary({ item, skipped, open, onPress }: { item: Item; skipped: boolean; open: boolean; onPress: () => void }) {
  const t = useTheme();
  const tags = [
    repeatLabel(item),
    item.duration ? `${item.duration} min` : '',
    item.notify ? (item.remindBefore ? `alert ${item.remindBefore} min before` : 'alert') : 'no alert',
  ].filter(Boolean).join(' · ');
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={`Edit ${item.title}`}
      style={{ flexDirection: 'row', gap: 10, padding: 12, backgroundColor: t.surface, alignItems: 'center', opacity: item.paused ? 0.55 : 1 }}>
      <Text style={{ width: 70, color: t.muted, fontSize: 13, fontVariant: ['tabular-nums'] }}>{fmt12(item.time)}</Text>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: catColor(t, item.cat) }} />
          <Text style={{ flex: 1, color: t.ink, fontWeight: '700', fontSize: 15 }} numberOfLines={1}>{item.title}</Text>
        </View>
        <Text style={{ color: t.muted, fontSize: 12 }} numberOfLines={1}>
          {item.paused ? 'Paused · ' : ''}{skipped ? 'Skipped today · ' : ''}{tags}
        </Text>
      </View>
      <Text style={{ color: t.muted, fontSize: 16 }}>{open ? '▴' : '▾'}</Text>
    </Pressable>
  );
}

function Editor({ item: i, today, skipped, onSet, onDelete, onSkipToday }:
  { item: Item; today: string; skipped: boolean; onSet: (p: Partial<Item>) => void; onDelete: () => void; onSkipToday: (skip: boolean) => void }) {
  const t = useTheme();
  const [armed, setArmed] = useState(false);
  const todayDate = new Date(today + 'T12:00:00');
  const tomorrow = keyOf(addDays(todayDate, 1));
  const onToday = occursOn(i, todayDate) && !i.paused;
  const toggleDay = (d: number) => {
    const w = new Set(i.weekdays || []);
    if (w.has(d)) w.delete(d); else w.add(d);
    onSet({ weekdays: [...w] });
  };

  return (
    <View style={{ padding: 12, gap: 12, backgroundColor: t.surface }}>
      <Divider />
      <Field label="Title" value={i.title} onChangeText={v => onSet({ title: v.slice(0, 80) })} style={NATURAL} />
      <Row style={{ alignItems: 'flex-start' }}>
        <TimeField label="Time" value={i.time} onChange={v => onSet({ time: v })} />
        <Field label="Duration (min, optional)" keyboardType="number-pad" value={i.duration ? String(i.duration) : ''} placeholder="—"
          onChangeText={v => { const n = parseInt(v.replace(/[^0-9]/g, '')); onSet({ duration: n > 0 ? Math.min(n, 600) : undefined }); }} />
      </Row>

      <Choice<Cat> label="Category" value={i.cat} options={Object.entries(CATS) as [Cat, string][]} onChange={v => onSet({ cat: v })} />

      <Choice<Days> label="Repeat" value={i.days} options={REPEATS} onChange={v => onSet({
        days: v,
        weekdays: v === 'custom' && !(i.weekdays || []).length ? [todayDate.getDay()] : i.weekdays,
        date: v === 'once' && !i.date ? today : i.date,
      })} />
      {i.days === 'custom' && (
        <Row>
          {WEEK_ORDER.map(d => {
            const on = (i.weekdays || []).includes(d);
            return (
              <Pressable key={d} onPress={() => toggleDay(d)} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={SHORT_DAYS[d]}
                style={{ width: 44, paddingVertical: 8, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: on ? t.accent : t.line, backgroundColor: on ? t.accent : t.surface2 }}>
                <Text style={{ color: on ? t.accentInk : t.ink, fontWeight: '700', fontSize: 13 }}>{SHORT_DAYS[d]}</Text>
              </Pressable>
            );
          })}
        </Row>
      )}
      {i.days === 'once' && (
        <View style={{ gap: 6 }}>
          <Row>
            <Btn title="Today" small kind={i.date === today ? 'primary' : 'default'} onPress={() => onSet({ date: today })} />
            <Btn title="Tomorrow" small kind={i.date === tomorrow ? 'primary' : 'default'} onPress={() => onSet({ date: tomorrow })} />
          </Row>
          <DateField value={i.date || today} onChange={d => onSet({ date: d })} />
        </View>
      )}

      <View style={{ gap: 6 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <T weight="700">Reminder</T>
          <Switch value={i.notify} onValueChange={v => onSet({ notify: v })} trackColor={{ true: t.accent, false: t.line }} accessibilityLabel={`Reminder for ${i.title}`} />
        </Row>
        {i.notify && (
          <Choice<string> value={String(i.remindBefore || 0)} options={REMIND_OPTIONS.map(([m, l]) => [String(m), l] as [string, string])}
            onChange={v => onSet({ remindBefore: Number(v) })} />
        )}
      </View>

      <Field label="Notes (shown on Today and in the reminder)" multiline value={i.note} onChangeText={v => onSet({ note: v.slice(0, 500) })} placeholder="Details, a checklist, a link…" style={NATURAL} />

      <Row>
        {i.days !== 'once' && <Btn title={i.paused ? 'Resume' : 'Pause'} small onPress={() => onSet({ paused: !i.paused })} />}
        {(onToday || skipped) && i.days !== 'once' && (
          <Btn title={skipped ? 'Undo skip' : 'Skip today'} small onPress={() => onSkipToday(!skipped)} />
        )}
        <Btn title={armed ? 'Tap again to delete' : 'Delete'} small kind="danger" onPress={() => {
          if (!armed) { setArmed(true); setTimeout(() => setArmed(false), 4000); return; }
          onDelete();
        }} />
      </Row>
      {i.paused && <T muted size={13}>Paused: hidden from Today, no reminders, not counted in your score.</T>}
      {skipped && <T muted size={13}>Skipped for today only. It&apos;s back tomorrow. Today&apos;s reminder may still appear.</T>}
    </View>
  );
}

/** YYYY-MM-DD entry with validation; commits on blur. */
function DateField({ value, onChange }: { value: string; onChange: (d: string) => void }) {
  const t = useTheme();
  const [text, setText] = useState(value);
  const [seen, setSeen] = useState(value);
  const [err, setErr] = useState('');
  if (seen !== value) { setSeen(value); setText(value); }
  const pretty = new Date(value + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <View style={{ gap: 2 }}>
      <Field style={NATURAL} label={`Date · ${pretty}`} value={text} onChangeText={setText} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation"
        onBlur={() => {
          const m = text.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
          const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12) : null;
          if (d && d.getMonth() === Number(m![2]) - 1) { const k = keyOf(d); setErr(''); setText(k); onChange(k); }
          else { setErr('Use the format 2026-11-20'); setText(value); }
        }} />
      {err ? <Text style={{ color: t.run, fontSize: 12 }}>{err}</Text> : null}
    </View>
  );
}
