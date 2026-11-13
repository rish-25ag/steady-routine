import React from 'react';
import { View } from 'react-native';
import { Health, Settings } from '../data';
import { SyncNote } from '../store';
import { Bar, Btn, Card, H, Label, Row, T, useTheme } from '../ui';

// Apple's ring colours, kept as-is so they read like the Fitness app in both themes.
const RING = { move: '#FA114F', exercise: '#92E82A', stand: '#1EEAEF' };

function ago(ts: number) {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h} h ago` : new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export default function HealthCard({ health, settings, sync, onSync, onSetup }:
  { health?: Health; settings: Settings; sync: SyncNote | null; onSync: () => void; onSetup: () => void }) {
  const t = useTheme();
  const showNote = !!sync;

  if (!health) {
    return (
      <Card>
        <Label>Apple Watch</Label>
        <H size={18}>Bring in your steps and workouts</H>
        <T muted>Set up the free Steady Sync shortcut once. It copies today&apos;s steps, rings, sleep and Watch workouts from Apple Health into Steady.</T>
        {showNote && <T size={13} color={sync!.ok ? t.accent : t.run}>{sync!.text}</T>}
        <Row><Btn title="Sync now" kind="primary" onPress={onSync} /><Btn title="How to set it up" onPress={onSetup} /></Row>
      </Card>
    );
  }

  const metric = (label: string, value: string, goal: string, pct: number, color: string) => (
    <View key={label} style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <T weight="700" size={14}>{label}</T>
        <T size={14}><T weight="700" size={14}>{value}</T><T muted size={13}> / {goal}</T></T>
      </View>
      <Bar pct={pct} color={color} />
    </View>
  );
  const h = health;
  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Label>Apple Watch · synced {ago(h.syncedAt)}</Label>
      </View>
      {h.steps != null && (
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
            <H size={30}>{h.steps.toLocaleString()}</H>
            <T muted>of {settings.stepGoal.toLocaleString()} steps{h.distKm != null ? ` · ${h.distKm.toFixed(1)} km` : ''}</T>
          </View>
          <Bar pct={h.steps / settings.stepGoal} color={t.accent} />
        </View>
      )}
      {h.move != null && metric('Move', `${h.move}`, `${settings.moveGoal} kcal`, h.move / settings.moveGoal, RING.move)}
      {h.exercise != null && metric('Exercise', `${h.exercise}`, `${settings.exerciseGoal} min`, h.exercise / settings.exerciseGoal, RING.exercise)}
      {h.stand != null && metric('Stand', `${h.stand}`, `${settings.standGoal} h`, h.stand / settings.standGoal, RING.stand)}
      {(h.sleepH != null || h.rhr != null) && (
        <Row style={{ gap: 16 }}>
          {h.sleepH != null && <T><T weight="700">{h.sleepH.toFixed(1)} h</T><T muted> sleep last night</T></T>}
          {h.rhr != null && <T><T weight="700">{h.rhr} bpm</T><T muted> resting</T></T>}
        </Row>
      )}
      {showNote && <T size={13} color={sync!.ok ? t.accent : t.run}>{sync!.text}</T>}
      <Btn title="Sync now" onPress={onSync} />
    </Card>
  );
}
