import React, { useState } from 'react';
import { View } from 'react-native';
import { DAY_NAMES, WORKOUT_TYPES, addDays, keyOf, pad, pickIndex, plannedWeekKm, uid, workoutFor } from '../data';
import { useStore } from '../store';
import { Bar, Btn, Card, Chip, Choice, Divider, Field, H, Header, Label, Row, T, useTheme } from '../ui';

export default function Train() {
  const t = useTheme();
  const { settings, days, today, updateDay } = useStore();
  const date = new Date(today + 'T12:00:00');
  const log = days[today];
  const plan = workoutFor(settings, log, date);
  const wl = settings.workouts;
  const [type, setType] = useState(plan.type === 'Rest' ? 'Easy' : plan.type);
  const [km, setKm] = useState('');
  const [min, setMin] = useState('');
  const [effort, setEffort] = useState('');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState('');

  const weekKeys = Array.from({ length: 7 }, (_, i) => keyOf(addDays(date, i - 6)));
  const all = Object.entries(days)
    .flatMap(([dk, dd]) => (dd.runs || []).map(r => ({ ...r, day: dk })))
    .sort((a, b) => (b.at || 0) - (a.at || 0));
  const weekKm = all.filter(r => weekKeys.includes(r.day)).reduce((s, r) => s + (+r.km || 0), 0);
  const planKm = plannedWeekKm(settings, days, date);
  const swapped = Number.isInteger(log?.pick?.run);

  const swap = () => updateDay(today, d => ({ ...d, pick: { ...d.pick, run: (pickIndex(settings, d, 'run', date, wl.length) + 1) % wl.length } }));
  const unswap = () => updateDay(today, d => { const p = { ...d.pick }; delete p.run; return { ...d, pick: p }; });

  const save = () => {
    const k = parseFloat(km.replace(',', '.')) || 0, m = parseFloat(min) || 0;
    if (!k && !m) { setMsg('Add a distance or a time.'); return; }
    updateDay(today, d => ({
      ...d,
      runs: [...d.runs, { id: uid(), type, km: k, min: m, effort: parseInt(effort) || null, note: note.trim().slice(0, 200), at: Date.now() }],
      done: type === 'Walk' ? d.done : { ...d.done, run: true },
    }));
    setKm(''); setMin(''); setEffort(''); setNote(''); setMsg('Session saved.');
  };

  return (
    <View style={{ gap: 16 }}>
      <Header eyebrow={`${wl.length} workouts in your rotation`} title="Training" />
      <Card>
        <Label color={t.run}>Today · {plan.type}{plan.km ? ` · ${plan.km} km` : ''}</Label>
        <H size={22}>{plan.title}</H>
        {!!plan.detail && <T>{plan.detail}</T>}
        {wl.length > 1 && (
          <Row>
            <Btn title="Swap workout" onPress={swap} />
            {swapped && <Btn title="Back to planned" kind="ghost" onPress={unswap} />}
          </Row>
        )}
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <T muted size={13}>Last 7 days vs plan</T><T size={13} weight="700">{weekKm.toFixed(1)} / {planKm} km</T>
          </View>
          <Bar pct={planKm ? weekKm / planKm : 0} color={t.run} />
        </View>
      </Card>

      <Card>
        <H size={17}>Log a session</H>
        <Choice label="Type" value={type} options={WORKOUT_TYPES.filter(x => x !== 'Rest').map(x => [x, x] as [string, string])} onChange={setType} />
        <Row>
          <Field label="Distance (km)" value={km} onChangeText={setKm} keyboardType="decimal-pad" placeholder={plan.km ? String(plan.km) : '0'} />
          <Field label="Time (min)" value={min} onChangeText={setMin} keyboardType="number-pad" placeholder="35" />
        </Row>
        <Row>
          <Field label="Effort (1–10)" value={effort} onChangeText={setEffort} keyboardType="number-pad" placeholder="6" />
          <Field label="Notes" value={note} onChangeText={setNote} placeholder="How did it feel?" />
        </Row>
        <Row><Btn title="Save session" kind="primary" onPress={save} />{!!msg && <T muted>{msg}</T>}</Row>
      </Card>

      <Card>
        <H size={17}>Next 7 days</H>
        {Array.from({ length: 7 }, (_, i) => addDays(date, i)).map((d, i) => {
          const p = workoutFor(settings, days[keyOf(d)], d);
          return (
            <View key={i} style={{ gap: 8 }}>
              {i > 0 && <Divider />}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Row><T weight="700">{i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : DAY_NAMES[d.getDay()]}</T><Chip>{p.type}</Chip></Row>
                  <T muted size={13}>{p.title}</T>
                </View>
                <T weight="600">{p.km ? `${p.km} km` : '—'}</T>
              </View>
            </View>
          );
        })}
        <T muted size={13}>The app cycles through your workout list, one per day. Edit the list in Routine. Keep 80% of runs easy; rest if you feel sharp pain.</T>
      </Card>

      <Card>
        <H size={17}>Recent sessions</H>
        {all.length === 0 && <T muted>No sessions yet. Log today’s run above and it shows here with your pace.</T>}
        {all.slice(0, 12).map((r, i) => {
          const pace = r.km > 0 && r.min > 0 ? r.min / r.km : 0;
          return (
            <View key={r.id} style={{ gap: 8 }}>
              {i > 0 && <Divider />}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <T weight="700">{r.type} <T muted size={13}>· {new Date(r.day + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</T></T>
                  <T muted size={13}>
                    {[r.km ? `${(+r.km).toFixed(2)} km` : '', r.min ? `${r.min} min` : '', pace ? `${Math.floor(pace)}:${pad(Math.round((pace % 1) * 60))}/km` : '', r.effort ? `effort ${r.effort}` : ''].filter(Boolean).join(' · ')}
                  </T>
                  {!!r.note && <T muted size={13}>{r.note}</T>}
                </View>
                <Btn title="Delete" small kind="ghost" onPress={() => updateDay(r.day, d => ({ ...d, runs: d.runs.filter(x => x.id !== r.id) }))} />
              </View>
            </View>
          );
        })}
      </Card>
    </View>
  );
}
