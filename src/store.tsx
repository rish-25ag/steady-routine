import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { AppState, Platform } from 'react-native';
import { CATS, DEFAULT_SETTINGS, DayLog, HEALTH_KEYS, SHORTCUT_NAME, Settings, applyHealth, emptyDay, keyOf, parseHealthPayload } from './data';
import { PermissionState, askPermission, permissionState, reschedule } from './notify';

const KEY_SETTINGS = 'steady.settings.v1';
const KEY_DAYS = 'steady.days.v1';

export type SyncNote = { ok: boolean; text: string; at: number };
export type LinkSeen = { url: string; at: number; imported: boolean };

/** "…?s=1&d=2" or "s=1&d=2" -> { s: '1', d: '2' }. Tolerates spaces around values. */
export function queryFrom(text: string): Record<string, string> {
  const q = text.includes('?') ? text.slice(text.indexOf('?') + 1) : text;
  const out: Record<string, string> = {};
  for (const pair of q.split(/[&\n]/)) {
    const i = pair.indexOf('=');
    if (i <= 0) continue;
    try { out[decodeURIComponent(pair.slice(0, i).trim())] = decodeURIComponent(pair.slice(i + 1).trim().replace(/\+/g, ' ')); }
    catch { out[pair.slice(0, i).trim()] = pair.slice(i + 1).trim(); }
  }
  return out;
}

type NotifStatus = { perm: PermissionState; scheduled: number; skipped: number; error?: string };

type Store = {
  ready: boolean;
  settings: Settings;
  days: Record<string, DayLog>;
  today: string;
  notif: NotifStatus;
  saveSettings: (s: Settings) => void;
  updateDay: (key: string, fn: (d: DayLog) => DayLog) => void;
  enableNotifications: () => Promise<void>;
  sync: SyncNote | null;
  lastLink: LinkSeen | null;
  syncLink: string;
  runShortcut: () => Promise<void>;
  importFromClipboard: () => Promise<void>;
};

const Ctx = createContext<Store | null>(null);

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}

function mergeSettings(raw: unknown): Settings {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Partial<Settings>;
  return {
    ...DEFAULT_SETTINGS,
    ...o,
    setup: { ...DEFAULT_SETTINGS.setup, ...(o.setup || {}) },
    meals: { ...DEFAULT_SETTINGS.meals, ...(o.meals || {}) },
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [days, setDays] = useState<Record<string, DayLog>>({});
  const [today, setToday] = useState(keyOf(new Date()));
  const [notif, setNotif] = useState<NotifStatus>({ perm: 'undetermined', scheduled: 0, skipped: 0 });
  const daysTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsRef = useRef<Settings>(DEFAULT_SETTINGS);
  const daysRef = useRef<Record<string, DayLog>>({});
  const [sync, setSync] = useState<SyncNote | null>(null);
  const [lastLink, setLastLink] = useState<LinkSeen | null>(null);
  const lastUrl = useRef<string | null>(null);
  // Sync messages show for 10 minutes, then clear.
  useEffect(() => {
    if (!sync) return;
    const timer = setTimeout(() => setSync(null), 10 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [sync]);
  const syncLink = Linking.createURL('sync', { queryParams: { v: '1' } });

  const applyNotifications = useCallback(async (s: Settings) => {
    if (Platform.OS === 'web') return; // browser preview: phone reminders only work in the app
    try {
      const perm = await permissionState();
      const r = await reschedule(s);
      setNotif({ perm, ...r });
    } catch {
      setNotif(n => ({ ...n, error: 'Could not schedule reminders. Reopen the app to try again.' }));
    }
  }, []);

  // Load once.
  useEffect(() => {
    (async () => {
      let s = DEFAULT_SETTINGS;
      try {
        const [rs, rd] = await Promise.all([AsyncStorage.getItem(KEY_SETTINGS), AsyncStorage.getItem(KEY_DAYS)]);
        if (rs) s = mergeSettings(JSON.parse(rs));
        if (rd) { daysRef.current = JSON.parse(rd); setDays(daysRef.current); }
      } catch {
        // Corrupt or missing data: start from defaults.
      }
      settingsRef.current = s;
      setSettings(s);
      setReady(true);
      applyNotifications(s);
    })();
  }, [applyNotifications]);

  // Roll over to a new day and refresh permission state when the app comes back.
  useEffect(() => {
    const sub = AppState.addEventListener('change', st => {
      if (st === 'active') {
        setToday(keyOf(new Date()));
        permissionState().then(perm => setNotif(n => ({ ...n, perm }))).catch(() => {});
      }
    });
    const t = setInterval(() => setToday(keyOf(new Date())), 60_000);
    return () => { sub.remove(); clearInterval(t); };
  }, []);

  const saveSettings = useCallback((s: Settings) => {
    settingsRef.current = s;
    setSettings(s);
    AsyncStorage.setItem(KEY_SETTINGS, JSON.stringify(s)).catch(() => {});
    applyNotifications(s);
  }, [applyNotifications]);

  const updateDay = useCallback((key: string, fn: (d: DayLog) => DayLog) => {
    setDays(prev => {
      const next = { ...prev, [key]: fn({ ...emptyDay(), ...(prev[key] || {}) }) };
      daysRef.current = next;
      if (daysTimer.current) clearTimeout(daysTimer.current);
      daysTimer.current = setTimeout(() => { AsyncStorage.setItem(KEY_DAYS, JSON.stringify(next)).catch(() => {}); }, 300);
      return next;
    });
  }, []);

  const enableNotifications = useCallback(async () => {
    const perm = await askPermission();
    setNotif(n => ({ ...n, perm }));
    saveSettings({ ...settingsRef.current, notificationsOn: true });
  }, [saveSettings]);

  /** Saves numbers sent by the Steady Sync shortcut and reports what changed. */
  const importHealth = useCallback((q: Record<string, string | undefined>) => {
    const p = parseHealthPayload(q);
    if (!p) { setSync({ ok: false, text: 'The shortcut sent no Health numbers. Check the Steady Sync steps in Routine → Apple Health.', at: Date.now() }); return; }
    const base = { ...emptyDay(), ...(daysRef.current[p.day] || {}) };
    const { log, ticked } = applyHealth(settingsRef.current, base, p);
    updateDay(p.day, () => log);
    const added = log.runs.length - base.runs.length;
    const names = ticked.map(id => settingsRef.current.schedule.find(i => i.id === id)?.title || CATS.move);
    const parts = [
      p.health.steps != null ? `${p.health.steps.toLocaleString()} steps` : '',
      added ? `${added} Watch workout${added > 1 ? 's' : ''} logged` : '',
      names.length ? `ticked ${names.join(', ')}` : '',
    ].filter(Boolean);
    setSync({ ok: true, text: 'Synced from Apple Health' + (parts.length ? ': ' + parts.join(' · ') : '') + '.', at: Date.now() });
  }, [updateDay]);

  // The shortcut ends by opening <syncLink>&s=…; handle it on launch and while open.
  useEffect(() => {
    if (!ready) return;
    const handle = (url: string | null) => {
      if (!url || url === lastUrl.current) return;
      lastUrl.current = url;
      const { path } = Linking.parse(url);
      const q = queryFrom(url);
      // Accept the numbers whether or not Expo Go kept the /sync path.
      const isSync = (!!path && /(^|\/)sync$/.test(path)) || HEALTH_KEYS.some(k => k in q);
      setLastLink({ url, at: Date.now(), imported: isSync });
      if (isSync) importHealth(q);
    };
    Linking.getInitialURL().then(handle).catch(() => {});
    const sub = Linking.addEventListener('url', e => handle(e.url));
    return () => sub.remove();
  }, [ready, importHealth]);

  const runShortcut = useCallback(async () => {
    try {
      await Linking.openURL('shortcuts://run-shortcut?name=' + encodeURIComponent(SHORTCUT_NAME));
    } catch {
      setSync({ ok: false, text: `Couldn't open Shortcuts. Make sure a shortcut named "${SHORTCUT_NAME}" exists.`, at: Date.now() });
    }
  }, []);

  const importFromClipboard = useCallback(async () => {
    try {
      const text = await Clipboard.getStringAsync();
      importHealth(queryFrom(text || ''));
    } catch {
      setSync({ ok: false, text: "Couldn't read the clipboard. Allow pasting when iPhone asks.", at: Date.now() });
    }
  }, [importHealth]);

  return (
    <Ctx.Provider value={{ ready, settings, days, today, notif, saveSettings, updateDay, enableNotifications, sync, lastLink, syncLink, runShortcut, importFromClipboard }}>
      {children}
    </Ctx.Provider>
  );
}
