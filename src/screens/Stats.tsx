import React from 'react';
import { Text, View } from 'react-native';
import { DAY_NAMES, ON_TRACK, addDays, completion, keyOf, plannedWeekKm } from '../data';
import { useStore } from '../store';
import { Bar, Card, Divider, H, Header, Label, T, useTheme } from '../ui';

export default function Stats() {
  const t = useTheme();
  const { settings, days, today } = useStore();
  const date = new Date(today + 'T12:00:00');
  const rows = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(date, i - 6), k = keyOf(d), dd = days[k];
    return { k, d, pct: completion(settings, dd, d), water: dd?.waterMl || 0, km: (dd?.runs || []).reduce((s, r) => s + (+r.km || 0), 0), vits: !!dd?.done.vits };
  });

  let streak = 0;
  let cur = new Date(date);
  if (completion(settings, days[keyOf(cur)], cur) < ON_TRACK) cur = addDays(cur, -1);
  for (let i = 0; i < 400 && completion(settings, days[keyOf(cur)], cur) >= ON_TRACK; i++) { streak++; cur = addDays(cur, -1); }

  const avg = rows.reduce((s, r) => s + r.pct, 0) / 7;
  const waterDays = rows.filter(r => r.water >= settings.waterGoalMl).length;
  const km = rows.reduce((s, r) => s + r.km, 0);
  const vitDays = rows.filter(r => r.vits).length;
  const planKm = plannedWeekKm(settings, days, date);
  const any = rows.some(r => r.pct > 0 || r.water > 0 || r.km > 0);

  const stat = (label: string, value: string, sub: string) => (
    <View style={{ flex: 1, backgroundColor: t.surface, borderColor: t.line, borderWidth: 1, borderRadius: 14, padding: 12, gap: 2 }}>
      <Label>{label}</Label><H size={24}>{value}</H><T muted size={12}>{sub}</T>
    </View>
  );
  const habit = (label: string, n: number, of: number, unit: string, color: string, i: number) => (
    <View key={label} style={{ gap: 8 }}>
      {i > 0 && <Divider />}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><T weight="700">{label}</T><T weight="600">{unit}</T></View>
      <Bar pct={of ? n / of : 0} color={color} />
    </View>
  );

  return (
    <View style={{ gap: 16 }}>
      <Header eyebrow="Last 7 days" title="Progress" />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {stat('Streak', String(streak), 'days ≥ 70%')}
        {stat('Routine', `${Math.round(avg * 100)}%`, 'avg done')}
        {stat('Run', km.toFixed(1), 'km')}
      </View>
      <Card>
        <H size={17}>Routine completed per day</H>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {rows.map(r => (
            <View key={r.k} style={{ flex: 1, alignItems: 'center', gap: 6 }} accessibilityLabel={`${DAY_NAMES[r.d.getDay()]}: ${Math.round(r.pct * 100)}%`}>
              <Text style={{ color: t.ink, fontSize: 11, fontWeight: '700' }}>{Math.round(r.pct * 100)}%</Text>
              <View style={{ width: '100%', height: 90, backgroundColor: t.surface2, borderRadius: 8, overflow: 'hidden', justifyContent: 'flex-end', borderWidth: r.k === today ? 2 : 0, borderColor: t.accent }}>
                <View style={{ height: `${r.pct * 100}%`, backgroundColor: t.accent }} />
              </View>
              <Text style={{ color: t.muted, fontSize: 11 }}>{DAY_NAMES[r.d.getDay()].slice(0, 3)}</Text>
            </View>
          ))}
        </View>
        {!any && <T muted size={13}>Nothing logged this week yet. Tick items on Today and your days fill in here.</T>}
      </Card>
      <Card>
        <H size={17}>Habits this week</H>
        {habit('Water goal hit', waterDays, 7, `${waterDays}/7 days`, t.water, 0)}
        {habit('Vitamins taken', vitDays, 7, `${vitDays}/7 days`, t.vit, 1)}
        {habit('Distance vs plan', km, planKm, `${km.toFixed(1)}/${planKm} km`, t.run, 2)}
      </Card>
    </View>
  );
}
