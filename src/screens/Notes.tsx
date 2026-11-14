import React, { useState } from 'react';
import { Pressable, Switch, Text, TextInput, View } from 'react-native';
import { DAY_NAMES, addDays, keyOf } from '../data';
import { ENERGY, MOODS, Note, useNotes } from '../notes';
import { useStore } from '../store';
import { Btn, Card, Choice, Divider, Field, H, Header, Label, Row, T, useTheme } from '../ui';

type View_ = 'journal' | 'notes';

const prettyDay = (k: string, today: string) => {
  if (k === today) return 'Today';
  if (k === keyOf(addDays(new Date(today + 'T12:00:00'), -1))) return 'Yesterday';
  const d = new Date(k + 'T12:00:00');
  return `${DAY_NAMES[d.getDay()]}, ${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`;
};
const snippet = (s: string, n = 90) => { const t = s.replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n) + '…' : t; };

export default function Notes() {
  const { today } = useStore();
  const { journal, notes } = useNotes();
  const [mode, setMode] = useState<View_>('journal');
  const [day, setDay] = useState(today);
  const [openNote, setOpenNote] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();

  const open = (kind: 'journal' | 'note', key: string) => {
    setQ('');
    if (kind === 'journal') { setMode('journal'); setDay(key); setOpenNote(null); }
    else { setMode('notes'); setOpenNote(key); }
  };

  return (
    <View style={{ gap: 16 }}>
      <Header eyebrow={`${Object.keys(journal).length} journal days · ${notes.length} notes`} title="Notes" />
      <Field label="Search" value={q} onChangeText={setQ} placeholder="Search your journal and notes" clearButtonMode="while-editing" />
      {query ? (
        <SearchResults query={query} today={today} onOpen={open} />
      ) : (
        <>
          <Choice<View_> value={mode} options={[['journal', 'Daily journal'], ['notes', 'Notes']]} onChange={v => { setMode(v); setOpenNote(null); }} />
          {mode === 'journal'
            ? <JournalView day={day} today={today} setDay={setDay} />
            : openNote
              ? <NoteEditor id={openNote} onClose={() => setOpenNote(null)} />
              : <NoteList onOpen={id => setOpenNote(id)} />}
        </>
      )}
    </View>
  );
}

function JournalView({ day, today, setDay }: { day: string; today: string; setDay: (d: string) => void }) {
  const t = useTheme();
  const { journal, setJournal } = useNotes();
  const entry = journal[day];
  const date = new Date(day + 'T12:00:00');
  const prev = keyOf(addDays(date, -1)), next = keyOf(addDays(date, 1));
  const past = Object.entries(journal).filter(([k]) => k !== day).sort(([a], [b]) => b.localeCompare(a)).slice(0, 30);

  return (
    <>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Btn title="‹" small kind="ghost" onPress={() => setDay(prev)} />
          <View style={{ alignItems: 'center', flex: 1 }}>
            <H size={18}>{prettyDay(day, today)}</H>
            {day !== today && <T muted size={12}>{date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}</T>}
          </View>
          <Btn title="›" small kind="ghost" disabled={next > today} onPress={() => setDay(next)} />
        </View>
        {day !== today && <Btn title="Back to today" small onPress={() => setDay(today)} />}
        <Scale label="Mood" names={MOODS} value={entry?.mood} onChange={v => setJournal(day, { mood: v })} />
        <Scale label="Energy" names={ENERGY} value={entry?.energy} onChange={v => setJournal(day, { energy: v })} />
        <TextInput
          multiline
          value={entry?.text || ''}
          onChangeText={v => setJournal(day, { text: v })}
          placeholder={day === today ? 'How was today? What went well, what to change tomorrow…' : 'Write about this day…'}
          placeholderTextColor={t.muted}
          style={{ minHeight: 180, backgroundColor: t.surface2, borderColor: t.line, borderWidth: 1, borderRadius: 12, padding: 12, color: t.ink, fontSize: 16, lineHeight: 23, textAlignVertical: 'top' }}
          accessibilityLabel="Journal entry"
        />
        <T muted size={12}>{entry?.updatedAt ? `Saved ${new Date(entry.updatedAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}` : 'Saves as you type'}</T>
      </Card>
      {past.length > 0 && (
        <Card>
          <H size={17}>Earlier entries</H>
          {past.map(([k, j], i) => (
            <Pressable key={k} onPress={() => setDay(k)} accessibilityRole="button" style={{ gap: 4 }}>
              {i > 0 && <Divider />}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, paddingTop: i > 0 ? 6 : 0 }}>
                <T weight="700">{prettyDay(k, today)}</T>
                <T muted size={12}>{[j.mood ? MOODS[j.mood - 1] : '', j.energy ? ENERGY[j.energy - 1] : ''].filter(Boolean).join(' · ')}</T>
              </View>
              {!!j.text && <T muted size={13}>{snippet(j.text)}</T>}
            </Pressable>
          ))}
        </Card>
      )}
    </>
  );
}

function Scale({ label, names, value, onChange }: { label: string; names: string[]; value?: number; onChange: (v: number | undefined) => void }) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Label>{label}</Label>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {names.map((n, ix) => {
          const v = ix + 1, on = value === v;
          return (
            <Pressable key={n} onPress={() => onChange(on ? undefined : v)} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={`${label}: ${n}`}
              style={{ flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: on ? t.accent : t.line, backgroundColor: on ? t.accent : t.surface2 }}>
              <Text style={{ color: on ? t.accentInk : t.ink, fontWeight: '700', fontSize: 15 }}>{v}</Text>
              <Text style={{ color: on ? t.accentInk : t.muted, fontSize: 10 }} numberOfLines={1}>{n}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function NoteList({ onOpen }: { onOpen: (id: string) => void }) {
  const { notes, newNote } = useNotes();
  const sorted = notes.slice().sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.updatedAt - a.updatedAt);
  return (
    <Card>
      <Row style={{ justifyContent: 'space-between' }}>
        <H size={17}>Your notes</H>
        <Btn title="+ New note" kind="primary" small onPress={() => onOpen(newNote())} />
      </Row>
      {sorted.length === 0 && <T muted>No notes yet. Use them for ideas, lists, or anything that isn&apos;t about one day.</T>}
      {sorted.map((n, i) => <NoteRow key={n.id} note={n} first={i === 0} onPress={() => onOpen(n.id)} />)}
    </Card>
  );
}

function NoteRow({ note: n, first, onPress }: { note: Note; first: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ gap: 4 }}>
      {!first && <Divider />}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, paddingTop: first ? 0 : 6 }}>
        <T weight="700" numberOfLines={1} style={{ flex: 1 }}>{n.pinned ? 'Pinned · ' : ''}{n.title || 'Untitled'}</T>
        <T muted size={12}>{new Date(n.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</T>
      </View>
      {!!n.body && <T muted size={13}>{snippet(n.body)}</T>}
    </Pressable>
  );
}

function NoteEditor({ id, onClose }: { id: string; onClose: () => void }) {
  const t = useTheme();
  const { notes, updateNote, deleteNote } = useNotes();
  const [armed, setArmed] = useState(false);
  const n = notes.find(x => x.id === id);
  if (!n) return <Btn title="Back to notes" onPress={onClose} />;
  const close = () => { if (!n.title.trim() && !n.body.trim()) deleteNote(n.id); onClose(); };
  return (
    <Card>
      <Row style={{ justifyContent: 'space-between' }}>
        <Btn title="‹ All notes" small kind="ghost" onPress={close} />
        <Row>
          <T size={13}>Pin</T>
          <Switch value={!!n.pinned} onValueChange={v => updateNote(n.id, { pinned: v })} trackColor={{ true: t.accent, false: t.line }} accessibilityLabel="Pin note" />
        </Row>
      </Row>
      <TextInput value={n.title} onChangeText={v => updateNote(n.id, { title: v.slice(0, 120) })} placeholder="Title"
        placeholderTextColor={t.muted} accessibilityLabel="Note title"
        style={{ color: t.ink, fontSize: 22, fontWeight: '800', paddingVertical: 4 }} />
      <TextInput multiline value={n.body} onChangeText={v => updateNote(n.id, { body: v })} placeholder="Write anything…"
        placeholderTextColor={t.muted} accessibilityLabel="Note text"
        style={{ minHeight: 240, backgroundColor: t.surface2, borderColor: t.line, borderWidth: 1, borderRadius: 12, padding: 12, color: t.ink, fontSize: 16, lineHeight: 23, textAlignVertical: 'top' }} />
      <Row style={{ justifyContent: 'space-between' }}>
        <T muted size={12}>Edited {new Date(n.updatedAt).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</T>
        <Btn title={armed ? 'Tap again to delete' : 'Delete'} small kind="danger" onPress={() => {
          if (!armed) { setArmed(true); setTimeout(() => setArmed(false), 4000); return; }
          deleteNote(n.id); onClose();
        }} />
      </Row>
    </Card>
  );
}

function SearchResults({ query, today, onOpen }: { query: string; today: string; onOpen: (kind: 'journal' | 'note', key: string) => void }) {
  const { journal, notes } = useNotes();
  const j = Object.entries(journal).filter(([, e]) => e.text.toLowerCase().includes(query)).sort(([a], [b]) => b.localeCompare(a));
  const n = notes.filter(x => (x.title + ' ' + x.body).toLowerCase().includes(query)).sort((a, b) => b.updatedAt - a.updatedAt);
  const around = (text: string) => {
    const i = text.toLowerCase().indexOf(query);
    const start = Math.max(0, i - 30);
    return (start > 0 ? '…' : '') + snippet(text.slice(start), 100);
  };
  return (
    <Card>
      <Label>{j.length + n.length} result{j.length + n.length === 1 ? '' : 's'}</Label>
      {j.length + n.length === 0 && <T muted>Nothing matches “{query}”.</T>}
      {j.map(([k, e], i) => (
        <Pressable key={k} onPress={() => onOpen('journal', k)} accessibilityRole="button" style={{ gap: 2 }}>
          {i > 0 && <Divider />}
          <T weight="700">Journal · {prettyDay(k, today)}</T>
          <T muted size={13}>{around(e.text)}</T>
        </Pressable>
      ))}
      {n.map((x, i) => (
        <Pressable key={x.id} onPress={() => onOpen('note', x.id)} accessibilityRole="button" style={{ gap: 2 }}>
          {(i > 0 || j.length > 0) && <Divider />}
          <T weight="700">Note · {x.title || 'Untitled'}</T>
          <T muted size={13}>{around(x.title.toLowerCase().includes(query) ? x.body || x.title : x.body)}</T>
        </Pressable>
      ))}
    </Card>
  );
}
