import React from 'react';
import { View } from 'react-native';
import { MEAL_SLOTS, fmt12, mealFor, pickIndex } from '../data';
import { useStore } from '../store';
import { Btn, Card, Chip, Divider, H, Header, Label, Row, T } from '../ui';

const RULES: [string, string][] = [
  ['Protein each meal', 'Aim for 20–25 g: paneer, tofu, dal, soya, curd, sprouts, milk. About 1.4 g per kg of body weight a day.'],
  ['Half the plate vegetables', 'Then a quarter protein and a quarter grains (roti, rice, oats).'],
  ['Carbs around training', 'Before a long or interval run, have a banana. Make breakfast bigger after it.'],
  ['Light late dinner', 'Keep dinner light and finish it 2 hours before bed.'],
  ['Watch iron & B12', 'Vegetarians run low more often. Pair dal and greens with lemon. Get a blood test once a year.'],
];

export default function Food({ go }: { go: (tab: string) => void }) {
  const { settings, days, today, updateDay } = useStore();
  const date = new Date(today + 'T12:00:00');
  const log = days[today];

  return (
    <View style={{ gap: 16 }}>
      <Header eyebrow="Vegetarian · protein at every meal" title="Food" />
      <Card>
        <Label>Today’s menu</Label>
        {MEAL_SLOTS.map(([slot, label, itemId], i) => {
          const n = settings.meals[slot]?.length || 0;
          const item = settings.schedule.find(x => x.id === itemId);
          const swapped = Number.isInteger(log?.pick?.[slot]);
          return (
            <View key={slot} style={{ gap: 8 }}>
              {i > 0 && <Divider />}
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Label>{label}{item ? ` · ${fmt12(item.time)}` : ''}</Label>
                  <T weight="700">{mealFor(settings, log, slot, date)}</T>
                  {swapped && <Btn title="Back to planned" small kind="ghost" onPress={() => updateDay(today, d => { const p = { ...d.pick }; delete p[slot]; return { ...d, pick: p }; })} />}
                </View>
                {n > 1 && <Btn title="Swap" small onPress={() => updateDay(today, d => ({ ...d, pick: { ...d.pick, [slot]: (pickIndex(settings, d, slot, date, n) + 1) % n } }))} />}
              </View>
            </View>
          );
        })}
        <T muted size={13}>Each meal rotates through your options, one per day. Swap picks the next option for today only.</T>
      </Card>
      <Card>
        <H size={17}>Plate rules for a runner</H>
        {RULES.map(([a, b], i) => (
          <View key={a} style={{ gap: 8 }}>{i > 0 && <Divider />}<T weight="700">{a}</T><T muted size={13}>{b}</T></View>
        ))}
      </Card>
      <Card>
        <H size={17}>Your meal options</H>
        {MEAL_SLOTS.map(([slot, label], i) => (
          <View key={slot} style={{ gap: 6 }}>
            {i > 0 && <Divider />}
            <Row><T weight="700">{label}</T><Chip>{settings.meals[slot]?.length || 0} options</Chip></Row>
            <T muted size={13}>{(settings.meals[slot] || []).join(' · ') || 'None yet'}</T>
          </View>
        ))}
        <Btn title="Edit meal options" onPress={() => go('routine')} />
      </Card>
    </View>
  );
}
