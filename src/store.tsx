import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { DEFAULT_SETTINGS, DayLog, Settings, emptyDay, keyOf } from './data';
import { PermissionState, askPermission, permissionState, reschedule } from './notify';

const KEY_SETTINGS = 'steady.settings.v1';
const KEY_DAYS = 'steady.days.v1';

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
        if (rd) setDays(JSON.parse(rd));
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

  return (
    <Ctx.Provider value={{ ready, settings, days, today, notif, saveSettings, updateDay, enableNotifications }}>
      {children}
    </Ctx.Provider>
  );
}
