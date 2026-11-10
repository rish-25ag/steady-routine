import React from 'react';
import { View } from 'react-native';
import { waterPace } from '../data';
import { useStore } from '../store';
import { Btn, Card, Divider, H, Header, Label, Row, T, useTheme } from '../ui';

export default function Water() {
  const t = useTheme();
  const { settings, days, today, updateDay } = useStore();
  const date = new Date(today + 'T12:00:00');
  const ml = days[today]?.waterMl || 0;
  const g = settings.waterGoalMl, gl = settings.glassMl;
  const pct = Math.min(1, ml / g);
  const expect = g * waterPace(settings, date);
  const add = (v: number) => updateDay(today, d => ({ ...d, waterMl: Math.max(0, d.waterMl + v) }));

  const plan: [string, string, string][] = [
    ['Wake-up', '500 ml before anything else', '0.5 L'],
    ['Training', '250 ml before, 250–500 ml after (more on long runs)', '0.6 L'],
    ['Before log-in', 'Fill a 1 L bottle for your desk', '0.25 L'],
    ['Work hours', "A glass every hour you're online", '1.5 L'],
    ['After log-off', 'Small sips; stop an hour before bed', '0.15 L'],
  ];

  return (
    <View style={{ gap: 16 }}>
      <Header eyebrow={`Daily goal ${(g / 1000).toFixed(1)} L`} title="Water" />
      <Card>
        <View style={{ flexDirection: 'row', gap: 18, alignItems: 'center' }}>
          <View style={{ width: 96, height: 150, borderWidth: 3, borderTopWidth: 0, borderColor: t.water, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, backgroundColor: t.surface2, overflow: 'hidden', justifyContent: 'flex-end' }}>
            <View style={{ height: `${pct * 100}%`, backgroundColor: t.water, opacity: 0.85 }} />
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Label>Today</Label>
            <H size={36}>{(ml / 1000).toFixed(2)} L</H>
            <T muted>{Math.round(ml / gl)} of {Math.ceil(g / gl)} glasses · {ml >= g ? 'Goal reached' : `${((g - ml) / 1000).toFixed(2)} L to go`}</T>
            <T muted>Target by now: {(expect / 1000).toFixed(1)} L</T>
          </View>
        </View>
        <Row>
          <Btn title={`+ Glass (${gl} ml)`} kind="water" onPress={() => add(gl)} />
          <Btn title="+ Bottle (500 ml)" kind="water" onPress={() => add(500)} />
          <Btn title="Undo a glass" kind="ghost" onPress={() => add(-gl)} />
        </Row>
      </Card>
      <Card>
        <H size={17}>How to spread {(g / 1000).toFixed(1)} L across your day</H>
        {plan.map(([a, b, c], i) => (
          <View key={a} style={{ gap: 8 }}>
            {i > 0 && <Divider />}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1 }}><T weight="700">{a}</T><T muted size={13}>{b}</T></View>
              <T weight="600">{c}</T>
            </View>
          </View>
        ))}
        <T muted size={13}>Hot day or a long run: add 500–750 ml. Pale-yellow urine means you’re hydrated.</T>
      </Card>
    </View>
  );
}
