import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { SHORTCUT_NAME } from '../data';
import { useStore } from '../store';
import { Btn, Card, Chip, Divider, H, Header, Label, Row, T, useTheme } from '../ui';

const METRICS: [string, string, string, string][] = [
  // Health type in Shortcuts, statistic, variable name, link key
  ['Steps', 'Sum', 'Steps', 's'],
  ['Walking + Running Distance', 'Sum', 'Distance', 'd'],
  ['Active Energy (or Active Calories)', 'Sum', 'Move', 'm'],
  ['Exercise Minutes (or Exercise Time)', 'Sum', 'Exercise', 'e'],
  ['Resting Heart Rate', 'Average', 'RHR', 'hr'],
];

export default function HealthGuide({ go }: { go: (tab: string) => void }) {
  const t = useTheme();
  const { syncLink, runShortcut, importFromClipboard, sync, lastLink } = useStore();
  const [copied, setCopied] = useState('');
  const tail = METRICS.map(([, , v, k]) => `&${k}=[${v}]`).join('') + '&sl=[Sleep]';

  const copy = async (text: string, what: string) => {
    try { await Clipboard.setStringAsync(text); setCopied(what); } catch { setCopied('Copy failed: select the text and copy it'); }
  };
  const step = (n: number, title: string, body: React.ReactNode) => (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: t.accentInk, fontWeight: '800' }}>{n}</Text>
      </View>
      <View style={{ flex: 1, gap: 4 }}><T weight="700">{title}</T>{body}</View>
    </View>
  );
  const code = (s: string) => (
    <Text selectable style={{ fontFamily: 'Menlo', fontSize: 12, color: t.ink, backgroundColor: t.surface2, padding: 8, borderRadius: 8 }}>{s}</Text>
  );

  return (
    <View style={{ gap: 16 }}>
      <Header eyebrow="Apple Watch → Apple Health → Steady" title="Steady Sync" />
      <Card>
        <T>Your Watch already saves steps, rings, sleep and workouts to Apple Health. A free iPhone shortcut reads them and opens Steady with the numbers. You build it once, in about 10 minutes.</T>
        <T muted size={13}>Shortcut names and Health types below match recent iOS versions. If one isn&apos;t listed on your iPhone, skip it: Steady shows whatever it receives.</T>
      </Card>

      <Card>
        <Label>Your sync link</Label>
        {code(syncLink)}
        <Row><Btn title="Copy link" kind="primary" onPress={() => copy(syncLink, 'Link copied')} />{!!copied && <T muted size={13}>{copied}</T>}</Row>
        <T muted size={13}>This link opens this copy of Steady. If you later open Steady a different way (for example after publishing), copy the link again from here and update the shortcut.</T>
      </Card>

      <Card>
        <Label>Last link Steady received</Label>
        {lastLink ? (
          <>
            {code(lastLink.url)}
            <T muted size={13}>
              {new Date(lastLink.at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} · {lastLink.imported ? 'numbers imported' : 'no Health numbers in this link'}
            </T>
            <Btn title="Copy received link" small onPress={() => copy(lastLink.url, 'Received link copied')} />
          </>
        ) : (
          <T muted size={14}>None since Steady last opened. Run Steady Sync, then come back here to see exactly what arrived.</T>
        )}
      </Card>

      <Card>
        <H size={17}>Build the shortcut</H>
        {step(1, 'Create it', <T muted size={14}>Open the Shortcuts app, tap +, and name the shortcut exactly <T weight="700" size={14}>{SHORTCUT_NAME}</T>.</T>)}
        <Divider />
        {step(2, 'Add a block for each number', (
          <View style={{ gap: 8 }}>
            <T muted size={14}>For each row, add these three actions:</T>
            <T size={14}>• <T weight="700" size={14}>Find Health Samples</T>: set Type, add the filter Start Date · is today</T>
            <T size={14}>• <T weight="700" size={14}>Calculate Statistics</T>: pick the statistic</T>
            <T size={14}>• <T weight="700" size={14}>Set Variable</T>: give it the name shown</T>
            {METRICS.map(([type, stat, v]) => (
              <Row key={v} style={{ justifyContent: 'space-between' }}>
                <T size={14} style={{ flex: 1 }}>{type}</T><Chip>{stat}</Chip><Chip>{v}</Chip>
              </Row>
            ))}
          </View>
        ))}
        <Divider />
        {step(3, 'Add sleep', (
          <T muted size={14}>
            Find Health Samples · Type <T weight="700" size={14}>Sleep</T> (or Sleep Analysis) · Start Date is in the last 1 day · Value is not In Bed and not Awake. Then <T weight="700" size={14}>Get Details of Health Samples → Duration</T>, then Calculate Statistics · Sum, then Set Variable <T weight="700" size={14}>Sleep</T>.
          </T>
        ))}
        <Divider />
        {step(4, 'Build the link', (
          <View style={{ gap: 6 }}>
            <T muted size={14}>Add a <T weight="700" size={14}>Text</T> action. Paste your sync link, then type this after it, replacing each [Name] with the variable of that name (tap the blue variable bar):</T>
            {code(tail)}
            <Btn title="Copy this ending" small onPress={() => copy(tail, 'Ending copied')} />
          </View>
        ))}
        <Divider />
        {step(5, 'Open Steady with it', <T muted size={14}>Add <T weight="700" size={14}>Open URLs</T> and give it the Text. Tap ▶︎ to run: Steady opens and the Apple Watch card fills in. Allow Health access when iPhone asks.</T>)}
      </Card>

      <Card>
        <H size={17}>Make it effortless</H>
        <T size={14}><T weight="700" size={14}>One-tap icon:</T> in Shortcuts, long-press Steady Sync → Share → Add to Home Screen. Opening Steady from that icon always brings fresh data.</T>
        <T size={14}><T weight="700" size={14}>Automatic:</T> Shortcuts → Automation → + → Time of Day (for example 1 PM, 6 PM and 9:30 PM) → Run Immediately → Steady Sync. Each run opens Steady briefly.</T>
        <T size={14}><T weight="700" size={14}>From Steady:</T> the Sync now button runs the shortcut for you.</T>
      </Card>

      <Card>
        <H size={17}>Optional: log Watch workouts</H>
        <T muted size={14}>
          If Find Health Samples offers <T weight="700" size={14}>Workouts</T> on your iPhone: find today&apos;s workouts, add Repeat with Each, and inside it a Text with
        </T>
        {code('[Type];[Distance];[Duration];[Start Date]|')}
        <T muted size={14}>
          (Duration in minutes, Start Date formatted as time). After the repeat, Combine Text with no separator, Set Variable Workouts, and add &w=[Workouts] to the link. Steady logs each one once with its pace. Without this, Steady still ticks your training when Exercise reaches 20 minutes.
        </T>
      </Card>

      <Card>
        <H size={17}>If the link doesn&apos;t open Steady</H>
        <T muted size={14}>Replace Open URLs with <T weight="700" size={14}>Copy to Clipboard</T>, run the shortcut, then come back here and tap Paste from shortcut.</T>
        <Row><Btn title="Paste from shortcut" onPress={importFromClipboard} /><Btn title="Run Steady Sync" onPress={runShortcut} /></Row>
        {sync && <T size={13} color={sync.ok ? t.accent : t.run}>{sync.text}</T>}
      </Card>

      <Btn title="Back to Routine" kind="ghost" onPress={() => go('routine')} />
    </View>
  );
}
