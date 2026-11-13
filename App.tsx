import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, ScrollViewInstance, Text, View, useColorScheme } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Food from './src/screens/Food';
import HealthGuide from './src/screens/HealthGuide';
import Routine from './src/screens/Routine';
import Setup from './src/screens/Setup';
import Stats from './src/screens/Stats';
import Today from './src/screens/Today';
import Train from './src/screens/Train';
import Water from './src/screens/Water';
import { StoreProvider, useStore } from './src/store';
import { useTheme } from './src/ui';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
const TABS: [string, string, IconName][] = [
  ['today', 'Today', 'list'],
  ['water', 'Water', 'water-outline'],
  ['train', 'Train', 'walk-outline'],
  ['food', 'Food', 'restaurant-outline'],
  ['stats', 'Stats', 'stats-chart-outline'],
  ['routine', 'Routine', 'time-outline'],
];

function Shell() {
  const t = useTheme();
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { ready } = useStore();
  const [tab, setTab] = useState('today');
  const scroll = useRef<ScrollViewInstance>(null);
  const go = (next: string) => { setTab(next); scroll.current?.scrollTo({ y: 0, animated: false }); };

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={t.accent} /></View>;
  }

  const screen =
    tab === 'water' ? <Water /> :
    tab === 'train' ? <Train /> :
    tab === 'food' ? <Food go={go} /> :
    tab === 'stats' ? <Stats /> :
    tab === 'routine' ? <Routine go={go} /> :
    tab === 'setup' ? <Setup go={go} /> :
    tab === 'healthguide' ? <HealthGuide go={go} /> :
    <Today go={go} />;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scroll}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 32, paddingLeft: Math.max(16, insets.left), paddingRight: Math.max(16, insets.right) }}>
          <View style={{ width: '100%', maxWidth: 560, alignSelf: 'center' }}>{screen}</View>
        </ScrollView>
      </KeyboardAvoidingView>
      <View style={{ flexDirection: 'row', backgroundColor: t.surface, borderTopWidth: 1, borderTopColor: t.line, paddingBottom: insets.bottom, paddingLeft: insets.left, paddingRight: insets.right }}>
        {TABS.map(([id, label, icon]) => {
          const on = tab === id || (id === 'routine' && (tab === 'setup' || tab === 'healthguide'));
          return (
            <Pressable key={id} onPress={() => go(id)} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={label}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 2 }}>
              <Ionicons name={icon} size={22} color={on ? t.accent : t.muted} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: on ? t.accent : t.muted }}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
