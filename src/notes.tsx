import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { uid } from './data';

const KEY = 'steady.notes.v1';

export type Journal = { text: string; mood?: number; energy?: number; updatedAt: number };
export type Note = { id: string; title: string; body: string; pinned?: boolean; createdAt: number; updatedAt: number };
type Data = { journal: Record<string, Journal>; notes: Note[] };

export const MOODS = ['Rough', 'Low', 'Okay', 'Good', 'Great'];
export const ENERGY = ['Drained', 'Tired', 'Steady', 'Fresh', 'Energised'];

type Ctx = {
  ready: boolean;
  journal: Record<string, Journal>;
  notes: Note[];
  setJournal: (day: string, patch: Partial<Journal>) => void;
  newNote: () => string;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
};

const NotesCtx = createContext<Ctx | null>(null);
export function useNotes() {
  const c = useContext(NotesCtx);
  if (!c) throw new Error('useNotes must be used inside NotesProvider');
  return c;
}

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Data>({ journal: {}, notes: [] });
  const [ready, setReady] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then(raw => { if (raw) { const d = JSON.parse(raw); setData({ journal: d.journal || {}, notes: d.notes || [] }); } })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  // Save shortly after the last keystroke.
  const update = useCallback((fn: (d: Data) => Data) => {
    setData(prev => {
      const next = fn(prev);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => { AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {}); }, 400);
      return next;
    });
  }, []);

  const setJournal = useCallback((day: string, patch: Partial<Journal>) => update(d => {
    const cur = d.journal[day] || { text: '', updatedAt: 0 };
    const nextEntry = { ...cur, ...patch, updatedAt: Date.now() };
    const journal = { ...d.journal };
    if (!nextEntry.text.trim() && !nextEntry.mood && !nextEntry.energy) delete journal[day]; else journal[day] = nextEntry;
    return { ...d, journal };
  }), [update]);

  const newNote = useCallback(() => {
    const id = 'n' + uid();
    const now = Date.now();
    update(d => ({ ...d, notes: [{ id, title: '', body: '', createdAt: now, updatedAt: now }, ...d.notes] }));
    return id;
  }, [update]);

  const updateNote = useCallback((id: string, patch: Partial<Note>) => update(d => ({
    ...d, notes: d.notes.map(n => (n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n)),
  })), [update]);

  const deleteNote = useCallback((id: string) => update(d => ({ ...d, notes: d.notes.filter(n => n.id !== id) })), [update]);

  return (
    <NotesCtx.Provider value={{ ready, journal: data.journal, notes: data.notes, setJournal, newNote, updateNote, deleteNote }}>
      {children}
    </NotesCtx.Provider>
  );
}
