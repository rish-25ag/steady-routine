import React, { useState } from 'react';
import { Switch, View } from 'react-native';
import { DEFAULT_SETTINGS, MEAL_SLOTS, Settings, WORKOUT_TYPES, WaterNudge, dayMinFor, uid } from '../data';
import { IOS_LIMIT, plan } from '../notify';
import { useStore } from '../store';
import TaskList from './TaskList';
import { Btn, Card, Choice, Divider, Field, H, Header, Row, T, useTheme } from '../ui';

const clone = <X,>(x: X): X => JSON.parse(JSON.stringify(x));

export default function Routine({ go }: { go: (tab: string) => void }) {
  const t = useTheme();
  const { settings, saveSettings, notif, enableNotifications, today, days, updateDay } = useStore();
  const [e, setE] = useState<Settings>(() => clone(settings));
  const [dirty, setDirty] = useState(false);
  const [armed, setArmed] = useState(false);
  const [msg, setMsg] = useState('');
  const [ver, setVer] = useState(0); // remounts uncontrolled fields after discard/reset/external changes
  // When saved settings change elsewhere (setup, reset) and nothing is being edited, reload the draft.
  const [seen, setSeen] = useState(settings);
  if (seen !== settings) {
    setSeen(settings);
    if (!dirty) { setE(clone(settings)); setVer(v => v + 1); }
  }

  const edit = (fn: (d: Settings) => void) => { setE(prev => { const n = clone(prev); fn(n); return n; }); setDirty(true); setMsg(''); };
  const dm = dayMinFor(e.setup.wake);
  const preview = plan(e);

  const save = () => {
    const s = clone(e);
    s.schedule.sort((a, b) => dm(a.time) - dm(b.time));
    saveSettings(s); setDirty(false); setMsg('Saved. Reminders updated.');
  };

  return (
    <View key={ver} style={{ gap: 16 }}>
      <Header eyebrow="Edit times, habits and reminders" title="Your routine" />

      <Card>
        <H size={17}>Quick setup</H>
        <T muted>Rebuild the schedule from your wake, sleep, office and run times. Workouts, meals and vitamins stay as they are.</T>
        <Btn title="Run setup again" onPress={() => go('setup')} />
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <H size={17}>Reminders</H>
          <Switch value={e.notificationsOn} onValueChange={v => edit(d => { d.notificationsOn = v; })} trackColor={{ true: t.accent, false: t.line }} />
        </View>
        {notif.perm === 'granted' ? (
          <T muted size={13}>
            {settings.notificationsOn ? `${notif.scheduled} reminders scheduled, repeating every day or week.` : 'Reminders are switched off.'}
            {notif.skipped ? ` ${notif.skipped} skipped: iPhone allows ${IOS_LIMIT}. Turn off a few items or water nudges.` : ''}
          </T>
        ) : notif.perm === 'denied' ? (
          <T size={13} color={t.run}>Notifications are blocked. Turn them on in iPhone Settings → Notifications → Expo Go (or Steady).</T>
        ) : (
          <Btn title="Allow notifications" kind="primary" onPress={enableNotifications} />
        )}
        {!!notif.error && <T size={13} color={t.run}>{notif.error}</T>}
        <Choice<WaterNudge> label="Water nudges during work hours" value={e.waterNudge}
          options={[['off', 'Off'], ['2h', 'Every 2 hours'], ['1h', 'Every hour']]} onChange={v => edit(d => { d.waterNudge = v; })} />
        <T muted size={13}>With these settings: {Math.min(preview.total, IOS_LIMIT)} reminders{preview.total > IOS_LIMIT ? ` (${preview.total - IOS_LIMIT} over the iPhone limit)` : ''}. Use the “Remind me” switch on each item below to choose which ones alert you.</T>
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <H size={17}>Apple Health & Watch</H>
          <Btn title="Set up sync" small onPress={() => go('healthguide')} />
        </View>
        <Row>
          <Field label="Daily step goal" keyboardType="number-pad" defaultValue={String(e.stepGoal)}
            onEndEditing={ev => { const v = parseInt(ev.nativeEvent.text.replace(/[^0-9]/g, '')); if (v >= 1000 && v <= 50000) edit(d => { d.stepGoal = v; }); }} />
          <Field label="Move goal (kcal)" keyboardType="number-pad" defaultValue={String(e.moveGoal)}
            onEndEditing={ev => { const v = parseInt(ev.nativeEvent.text); if (v >= 50 && v <= 3000) edit(d => { d.moveGoal = v; }); }} />
        </Row>
        <Row>
          <Field label="Exercise goal (min)" keyboardType="number-pad" defaultValue={String(e.exerciseGoal)}
            onEndEditing={ev => { const v = parseInt(ev.nativeEvent.text); if (v >= 5 && v <= 240) edit(d => { d.exerciseGoal = v; }); }} />
        </Row>
        <T muted size={13}>Use the same Move and Exercise goals as your Watch so the bars match your rings.</T>
        <Row style={{ justifyContent: 'space-between' }}>
          <T style={{ flex: 1 }}>Tick items from Watch data</T>
          <Switch value={e.healthAutoTick} onValueChange={v => edit(d => { d.healthAutoTick = v; })} trackColor={{ true: t.accent, false: t.line }} accessibilityLabel="Tick items from Watch data" />
        </Row>
        <T muted size={13}>Training ticks when the Watch logs a workout or 20+ exercise minutes. Movement breaks tick when your steps are on pace for your goal at that time.</T>
      </Card>

      <Card>
        <H size={17}>Tasks</H>
        <T muted size={13}>Tap a task to change its time, repeat, reminder, duration or notes, or to pause, skip or delete it. Times are 24-hour (07:30, 21:00). Changes apply when you tap Save routine.</T>
        <TaskList
          items={e.schedule}
          wake={e.setup.wake}
          today={today}
          todayLog={days[today]}
          onChange={fn => edit(d => { d.schedule = fn(d.schedule); })}
          onSkipToday={(id, skip) => updateDay(today, d => {
            const skipped = { ...(d.skipped || {}) };
            if (skip) skipped[id] = true; else delete skipped[id];
            return { ...d, skipped };
          })}
        />
      </Card>

      <Card>
        <H size={17}>Water</H>
        <Row>
          <Field label="Daily goal (ml)" keyboardType="number-pad" defaultValue={String(e.waterGoalMl)} onEndEditing={ev => { const v = parseInt(ev.nativeEvent.text); if (v >= 1000 && v <= 6000) edit(d => { d.waterGoalMl = v; }); }} />
          <Field label="Glass size (ml)" keyboardType="number-pad" defaultValue={String(e.glassMl)} onEndEditing={ev => { const v = parseInt(ev.nativeEvent.text); if (v >= 50 && v <= 1000) edit(d => { d.glassMl = v; }); }} />
        </Row>
      </Card>

      <Card>
        <H size={17}>Vitamins after breakfast</H>
        <Field label="One per line" multiline defaultValue={e.vitamins.join('\n')}
          onEndEditing={ev => edit(d => { d.vitamins = ev.nativeEvent.text.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 20); })} />
        <T muted size={13}>Take them with breakfast so D3 and Omega-3 absorb better. Check doses with your doctor.</T>
      </Card>

      <Card>
        <H size={17}>Workout rotation</H>
        <T muted size={13}>One workout per day, in this order, then it starts over. Add a Rest entry for rest days.</T>
        {e.workouts.map((w, ix) => (
          <View key={w.id} style={{ gap: 8 }}>
            {ix > 0 && <Divider />}
            <T weight="700">Day {ix + 1}</T>
            <Choice value={w.type} options={WORKOUT_TYPES.map(x => [x, x] as [string, string])} onChange={v => edit(d => { d.workouts[ix].type = v; })} />
            <Row>
              <Field label="Title" defaultValue={w.title} onEndEditing={ev => edit(d => { d.workouts[ix].title = ev.nativeEvent.text.trim().slice(0, 80) || d.workouts[ix].type; })} />
              <Field label="Distance (km)" keyboardType="decimal-pad" defaultValue={String(w.km)} style={{ flex: 0, minWidth: 110, width: 110 }}
                onEndEditing={ev => edit(d => { d.workouts[ix].km = Math.max(0, parseFloat(ev.nativeEvent.text.replace(',', '.')) || 0); })} />
            </Row>
            <Field label="Details" defaultValue={w.detail} onEndEditing={ev => edit(d => { d.workouts[ix].detail = ev.nativeEvent.text.trim().slice(0, 300); })} />
            <Row>
              {ix > 0 && <Btn title="Move up" small kind="ghost" onPress={() => edit(d => { const a = d.workouts; [a[ix - 1], a[ix]] = [a[ix], a[ix - 1]]; })} />}
              <Btn title="Remove" small kind="danger" onPress={() => edit(d => { d.workouts.splice(ix, 1); })} />
            </Row>
          </View>
        ))}
        <Btn title="Add workout" onPress={() => edit(d => { d.workouts.push({ id: 'w' + uid(), type: 'Easy', title: 'Easy run, 5 km', detail: '', km: 5 }); })} />
      </Card>

      <Card>
        <H size={17}>Meal options</H>
        <T muted size={13}>One meal per line. Each meal rotates through its options, one per day.</T>
        {MEAL_SLOTS.map(([slot, label]) => (
          <Field key={slot} label={label} multiline defaultValue={(e.meals[slot] || []).join('\n')}
            onEndEditing={ev => edit(d => { d.meals[slot] = ev.nativeEvent.text.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 40); })} />
        ))}
      </Card>

      <Row>
        <Btn title="Save routine" kind="primary" disabled={!dirty} onPress={save} />
        <Btn title="Discard changes" kind="ghost" disabled={!dirty} onPress={() => { setDirty(false); setE(clone(settings)); setVer(v => v + 1); setMsg('Changes discarded.'); }} />
        <Btn title={armed ? 'Tap again to reset' : 'Reset to suggested'} kind="danger" onPress={() => {
          if (!armed) { setArmed(true); setTimeout(() => setArmed(false), 4000); return; }
          setArmed(false); setDirty(false); saveSettings(clone(DEFAULT_SETTINGS)); setMsg('Reset to the suggested routine.');
        }} />
      </Row>
      {!!msg && <T muted>{msg}</T>}
      {dirty && <T size={13} color={t.warnInk}>You have unsaved changes.</T>}
    </View>
  );
}
