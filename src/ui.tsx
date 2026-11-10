import React, { useState } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextInput, TextInputProps, TextStyle, View, ViewStyle, useColorScheme } from 'react-native';
import { Cat, fmt12, parseTime } from './data';

const light = {
  bg: '#EEF3F1', surface: '#FFFFFF', surface2: '#E3ECE8', line: '#D2DDD8',
  ink: '#14302A', muted: '#5A706A', accent: '#1C7A62', accentInk: '#FFFFFF',
  water: '#2A78CF', run: '#D65F2F', food: '#5E8A1E', vit: '#A87C0A', work: '#5B5FB8', rest: '#7A6A9C',
  warnBg: '#FFF1DC', warnInk: '#7A4A00',
};
const dark: typeof light = {
  bg: '#0E1614', surface: '#16211E', surface2: '#1E2C28', line: '#2A3A35',
  ink: '#E4EEEA', muted: '#93A8A1', accent: '#45C29C', accentInk: '#06231B',
  water: '#62A9F4', run: '#F2885A', food: '#9BC954', vit: '#E2B93C', work: '#9DA1F2', rest: '#B9A6E0',
  warnBg: '#3A2A10', warnInk: '#F5CF8A',
};
export type Theme = typeof light;
export function useTheme(): Theme { return useColorScheme() === 'dark' ? dark : light; }
export function catColor(t: Theme, c: Cat) {
  return { water: t.water, run: t.run, food: t.food, vitamin: t.vit, work: t.work, rest: t.rest, move: t.accent }[c];
}

export function Card({ children, style, tone }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; tone?: 'accent' | 'warn' }) {
  const t = useTheme();
  const bg = tone === 'accent' ? t.accent : tone === 'warn' ? t.warnBg : t.surface;
  return (
    <View style={[{ backgroundColor: bg, borderColor: tone ? bg : t.line, borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 }, style]}>
      {children}
    </View>
  );
}

export function Label({ children, color, style }: { children: React.ReactNode; color?: string; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  return <Text style={[{ fontSize: 11, fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase', color: color || t.muted }, style]}>{children}</Text>;
}

export function T({ children, style, muted, weight, size, color, numberOfLines }:
  { children: React.ReactNode; style?: StyleProp<TextStyle>; muted?: boolean; weight?: TextStyle['fontWeight']; size?: number; color?: string; numberOfLines?: number }) {
  const t = useTheme();
  return <Text numberOfLines={numberOfLines} style={[{ color: color || (muted ? t.muted : t.ink), fontSize: size || 15, fontWeight: weight || '400', lineHeight: (size || 15) * 1.4 }, style]}>{children}</Text>;
}

export function H({ children, size = 20, color }: { children: React.ReactNode; size?: number; color?: string }) {
  const t = useTheme();
  return <Text style={{ color: color || t.ink, fontSize: size, fontWeight: '800', letterSpacing: -0.3 }}>{children}</Text>;
}

export function Btn({ title, onPress, kind = 'default', disabled, small }:
  { title: string; onPress: () => void; kind?: 'default' | 'primary' | 'water' | 'ghost' | 'danger' | 'inverse'; disabled?: boolean; small?: boolean }) {
  const t = useTheme();
  const st: Record<string, { bg: string; fg: string; bd: string }> = {
    default: { bg: t.surface, fg: t.ink, bd: t.line },
    primary: { bg: t.accent, fg: t.accentInk, bd: t.accent },
    water: { bg: t.water, fg: t.surface, bd: t.water },
    ghost: { bg: 'transparent', fg: t.ink, bd: t.line },
    danger: { bg: 'transparent', fg: t.run, bd: t.run },
    inverse: { bg: t.accentInk, fg: t.accent, bd: t.accentInk },
  };
  const c = st[kind];
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: c.bg, borderColor: c.bd, borderWidth: 1, borderRadius: 999,
        paddingVertical: small ? 6 : 10, paddingHorizontal: small ? 12 : 16, opacity: disabled ? 0.5 : pressed ? 0.75 : 1, alignSelf: 'flex-start',
      })}>
      <Text style={{ color: c.fg, fontWeight: '700', fontSize: small ? 13 : 15 }}>{title}</Text>
    </Pressable>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }, style]}>{children}</View>;
}

export function Field({ label, style, ...props }: TextInputProps & { label: string; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return (
    <View style={[{ gap: 4, flex: 1, minWidth: 120 }, style]}>
      <Text style={{ color: t.muted, fontSize: 12, fontWeight: '700' }}>{label}</Text>
      <TextInput
        placeholderTextColor={t.muted}
        {...props}
        style={{ backgroundColor: t.surface2, borderColor: t.line, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: t.ink, fontSize: 15, minHeight: props.multiline ? 90 : undefined, textAlignVertical: props.multiline ? 'top' : 'center' }}
      />
    </View>
  );
}

/** Time entry as text ("7:30", "1930"). Commits a valid HH:MM on blur, otherwise reverts. */
export function TimeField({ label, value, onChange, optional, style }:
  { label: string; value: string; onChange: (v: string) => void; optional?: boolean; style?: StyleProp<ViewStyle> }) {
  const [text, setText] = useState(value);
  const [err, setErr] = useState('');
  const t = useTheme();
  const [seen, setSeen] = useState(value);
  if (seen !== value) { setSeen(value); setText(value); }
  return (
    <View style={[{ flex: 1, minWidth: 120, gap: 2 }, style]}>
      <Field
        label={label + (value ? ` · ${fmt12(value)}` : '')}
        value={text}
        onChangeText={setText}
        keyboardType="numbers-and-punctuation"
        placeholder={optional ? 'None' : 'HH:MM'}
        onBlur={() => {
          if (optional && !text.trim()) { setErr(''); onChange(''); return; }
          const p = parseTime(text);
          if (p) { setErr(''); setText(p); onChange(p); } else { setErr('Use 24-hour time, e.g. 07:30 or 21:00'); setText(value); }
        }}
      />
      {err ? <Text style={{ color: t.run, fontSize: 12 }}>{err}</Text> : null}
    </View>
  );
}

/** A row of choice chips (stands in for a select). */
export function Choice<V extends string>({ label, value, options, onChange }:
  { label?: string; value: V; options: [V, string][]; onChange: (v: V) => void }) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={{ color: t.muted, fontSize: 12, fontWeight: '700' }}>{label}</Text> : null}
      <Row>
        {options.map(([v, l]) => {
          const on = v === value;
          return (
            <Pressable key={v} onPress={() => onChange(v)} accessibilityRole="button" accessibilityState={{ selected: on }}
              style={{ paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: on ? t.accent : t.line, backgroundColor: on ? t.accent : t.surface2 }}>
              <Text style={{ color: on ? t.accentInk : t.ink, fontWeight: '600', fontSize: 13 }}>{l}</Text>
            </Pressable>
          );
        })}
      </Row>
    </View>
  );
}

export function Bar({ pct, color }: { pct: number; color?: string }) {
  const t = useTheme();
  return (
    <View style={{ height: 8, borderRadius: 99, backgroundColor: t.surface2, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(100, pct * 100))}%`, height: '100%', backgroundColor: color || t.accent, borderRadius: 99 }} />
    </View>
  );
}

export function Chip({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return <Text style={{ fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, backgroundColor: t.surface2, color: t.muted, overflow: 'hidden' }}>{children}</Text>;
}

export function Divider() {
  const t = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.line }} />;
}

export function Header({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1, gap: 2 }}>
        {eyebrow ? <Label>{eyebrow}</Label> : null}
        <H size={28}>{title}</H>
      </View>
      {right}
    </View>
  );
}
