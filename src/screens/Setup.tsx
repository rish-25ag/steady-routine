import React, { useState } from 'react';
import { View } from 'react-native';
import { Setup as SetupT, buildSchedule } from '../data';
import { useStore } from '../store';
import { Btn, Card, Choice, Field, H, Header, Row, T, TimeField } from '../ui';

export default function Setup({ go }: { go: (tab: string) => void }) {
  const { settings, saveSettings, enableNotifications, notif } = useStore();
  const [s, setS] = useState<SetupT>({ ...settings.setup });
  const [water, setWater] = useState(String(settings.waterGoalMl / 1000));
  const [steps, setSteps] = useState(String(settings.stepGoal));
  const set = (patch: Partial<SetupT>) => setS(prev => ({ ...prev, ...patch }));

  const build = async () => {
    const goal = Math.round((parseFloat(water.replace(',', '.')) || 3) * 1000);
    const stepGoal = parseInt(steps.replace(/[^0-9]/g, '')) || settings.stepGoal;
    saveSettings({ ...settings, setup: s, setupDone: true, waterGoalMl: Math.min(6000, Math.max(1500, goal)), stepGoal: Math.min(50000, Math.max(1000, stepGoal)), schedule: buildSchedule(s) });
    if (notif.perm === 'undetermined') await enableNotifications();
    go('today');
  };

  return (
    <View style={{ gap: 16 }}>
      <Header eyebrow={settings.setupDone ? 'Rebuild your schedule' : 'Takes about a minute'} title="Quick setup" />
      <Card>
        <H size={17}>Your day</H>
        <Row>
          <TimeField label="Wake up" value={s.wake} onChange={v => set({ wake: v })} />
          <TimeField label="Lights out" value={s.sleep} onChange={v => set({ sleep: v })} />
        </Row>
        <T muted size={13}>Use 24-hour time. A bedtime after midnight (e.g. 00:30) is fine.</T>
      </Card>
      <Card>
        <H size={17}>Office</H>
        <Choice label="Office days" value={s.workDays} options={[['weekdays', 'Mon–Fri'], ['all', 'Every day'], ['none', 'No office']]} onChange={v => set({ workDays: v })} />
        {s.workDays !== 'none' && (
          <>
            <Row>
              <TimeField label="Log in" value={s.login} onChange={v => set({ login: v })} />
              <TimeField label="Log off" value={s.logoff} onChange={v => set({ logoff: v })} />
            </Row>
            <TimeField label="Stand-up (empty if none)" value={s.standup} optional onChange={v => set({ standup: v })} />
          </>
        )}
      </Card>
      <Card>
        <H size={17}>Training</H>
        <Choice label="When do you train?" value={s.runWhen} options={[['morning', 'Morning'], ['evening', 'After log-off'], ['none', 'Not scheduled']]} onChange={v => set({ runWhen: v })} />
        {s.runWhen !== 'none' && <TimeField label="Start time" value={s.runTime} onChange={v => set({ runTime: v })} />}
        <T muted size={13}>Morning runs get a warm-up 15 min before and breakfast 90 min after. Vitamins follow 30 min after breakfast.</T>
      </Card>
      <Card>
        <H size={17}>Steps</H>
        <Field label="Daily step goal" value={steps} onChangeText={setSteps} keyboardType="number-pad" />
        <T muted size={13}>Counted by your Apple Watch and iPhone. 8,000 suits a desk job plus regular runs.</T>
      </Card>
      <Card>
        <H size={17}>Water</H>
        <Field label="Daily goal (litres)" value={water} onChangeText={setWater} keyboardType="decimal-pad" />
        <T muted size={13}>About 35 ml per kg of body weight, plus 0.5–0.75 L on run days.</T>
      </Card>
      <T muted size={13}>Building replaces your current schedule items and reschedules reminders. Workouts, meals and vitamins stay as they are.</T>
      <Row>
        <Btn title="Build my routine" kind="primary" onPress={build} />
        <Btn title="Cancel" kind="ghost" onPress={() => go(settings.setupDone ? 'routine' : 'today')} />
      </Row>
    </View>
  );
}
