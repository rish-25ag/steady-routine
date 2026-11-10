// Plans, defaults and pure helpers. No React or native imports here.

export type Cat = 'water' | 'run' | 'food' | 'vitamin' | 'work' | 'rest' | 'move';
export type Days = 'all' | 'weekdays' | 'weekends';

export type Item = {
  id: string;
  time: string; // "HH:MM", 24h
  title: string;
  cat: Cat;
  days: Days;
  note: string;
  notify: boolean;
};

export type Workout = { id: string; type: string; title: string; detail: string; km: number };
export type MealSlot = 'breakfast' | 'lunch' | 'snack' | 'dinner';
export type Meals = Record<MealSlot, string[]>;
export type WaterNudge = 'off' | '2h' | '1h';

export type Setup = {
  wake: string;
  sleep: string;
  login: string;
  standup: string;
  logoff: string;
  workDays: 'weekdays' | 'all' | 'none';
  runWhen: 'morning' | 'evening' | 'none';
  runTime: string;
};

export type Settings = {
  setupDone: boolean;
  setup: Setup;
  waterGoalMl: number;
  glassMl: number;
  waterNudge: WaterNudge;
  notificationsOn: boolean;
  vitamins: string[];
  schedule: Item[];
  workouts: Workout[];
  meals: Meals;
  rotationStart: string;
};

export type Run = { id: string; type: string; km: number; min: number; effort: number | null; note: string; at: number };
export type DayLog = {
  done: Record<string, boolean>;
  waterMl: number;
  runs: Run[];
  pick?: Partial<Record<MealSlot | 'run', number>>;
};

export const CATS: Record<Cat, string> = {
  water: 'Water', run: 'Run', food: 'Food', vitamin: 'Vitamins', work: 'Work', rest: 'Rest', move: 'Movement',
};
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const WORKOUT_TYPES = ['Easy', 'Intervals', 'Tempo', 'Long', 'Strength', 'Yoga / mobility', 'Walk', 'Rest'];
export const MEAL_SLOTS: [MealSlot, string, string][] = [
  ['breakfast', 'Breakfast', 'bfast'],
  ['lunch', 'Lunch', 'lunch'],
  ['snack', 'Evening snack', 'snack2'],
  ['dinner', 'Dinner', 'dinner'],
];
export const ON_TRACK = 0.7;
const ROTATION_START = '2026-11-09'; // a Monday, so a 7-item rotation lines up with the week

export const DEFAULT_SETUP: Setup = {
  wake: '07:00', sleep: '23:15', login: '12:00', standup: '12:30', logoff: '21:00',
  workDays: 'weekdays', runWhen: 'morning', runTime: '07:30',
};

export const DEFAULT_WORKOUTS: Workout[] = [
  { id: 'w1', type: 'Easy', title: 'Easy run, 6 km', detail: 'Conversational pace. Finish with 4 × 20 s strides.', km: 6 },
  { id: 'w2', type: 'Strength', title: 'Strength + core, 35 min', detail: '3 rounds: 12 squats, 10 lunges/leg, 12 glute bridges, 10 push-ups, 45 s plank, 15 calf raises.', km: 0 },
  { id: 'w3', type: 'Intervals', title: 'Intervals: 6 × 800 m', detail: '2 km warm-up, 6 × 800 m at 5K effort with 2 min jog between, 1.5 km cool-down.', km: 8 },
  { id: 'w4', type: 'Easy', title: 'Recovery run, 5 km', detail: 'Very easy. If legs are heavy, swap for 30 min yoga.', km: 5 },
  { id: 'w5', type: 'Tempo', title: 'Tempo run, 7 km', detail: '2 km easy, 20 min comfortably hard (about 10K pace), 1.5 km easy.', km: 7 },
  { id: 'w6', type: 'Long', title: 'Long run, 10–12 km', detail: "Easy and steady. Carry water if it's warm. Add 1 km every 2 weeks, up to 16 km.", km: 11 },
  { id: 'w7', type: 'Rest', title: 'Rest + mobility', detail: '20 min yoga or foam rolling. Optional easy walk.', km: 0 },
];

export const DEFAULT_MEALS: Meals = {
  breakfast: [
    'Moong dal chilla (2) with mint chutney + curd',
    'Overnight oats: milk, chia, banana, peanut butter',
    'Besan chilla with veggies + glass of milk',
    'Poha with peanuts + bowl of sprouts',
    'Idli (3) with sambar + a few almonds',
    'Greek yogurt bowl: fruit, muesli, seeds',
    'Paneer bhurji, 2 multigrain toast, orange',
  ],
  lunch: [
    'Dal, 2 roti, seasonal sabzi, curd',
    'Chole, jeera rice, onion-tomato salad',
    'Paneer tikka wrap + green salad',
    'Soya chunk pulao + boondi raita',
    'Vegetable khichdi + curd + papad',
    'Tofu & vegetable stir-fry with rice',
    'Rajma, brown rice, cucumber salad',
  ],
  snack: [
    'Apple + 10 almonds',
    'Sprouts chaat with lemon',
    'Makhana (roasted) + green tea',
    'Hummus with carrot & cucumber sticks',
    'Banana + peanut butter',
    'Protein smoothie: milk, banana, oats',
    'Roasted chana + buttermilk',
  ],
  dinner: [
    'Dal, 2 roti, lauki or tinda sabzi',
    'Vegetable quinoa upma + curd',
    'Tofu bhurji + 2 roti + salad',
    'Palak paneer + 2 roti',
    'Moong dal khichdi + curd',
    'Stir-fried veggies with tofu + soup',
    'Vegetable soup + grilled paneer salad',
  ],
};

/* ---------- time helpers ---------- */
export const pad = (n: number) => String(n).padStart(2, '0');
export const toMin = (t: string) => {
  const [h, m] = String(t).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};
export const fromMin = (v: number) => {
  const c = Math.max(0, Math.min(23 * 60 + 59, Math.round(v)));
  return pad(Math.floor(c / 60)) + ':' + pad(c % 60);
};
export const addMin = (t: string, m: number) => fromMin(toMin(t) + m);
export const fmt12 = (t: string) => {
  const m = toMin(t);
  let h = Math.floor(m / 60);
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${pad(m % 60)} ${ap}`;
};
/** Accepts "7", "730", "7:30", "07:30", "19.30" and returns "HH:MM", or null if invalid. */
export function parseTime(input: string): string | null {
  const s = input.trim().replace('.', ':');
  let h: number, m: number;
  if (/^\d{1,2}:\d{2}$/.test(s)) [h, m] = s.split(':').map(Number);
  else if (/^\d{3,4}$/.test(s)) { h = Number(s.slice(0, -2)); m = Number(s.slice(-2)); }
  else if (/^\d{1,2}$/.test(s)) { h = Number(s); m = 0; }
  else return null;
  if (h > 23 || m > 59) return null;
  return pad(h) + ':' + pad(m);
}
export const keyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const dayIndex = (d: Date) => Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 864e5);
export const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
export const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
export const uid = () => Math.random().toString(36).slice(2, 10);
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

/** Minutes in "your day": times well before wake-up (a 12:30 AM bedtime) count as late night. */
export const dayMinFor = (wake: string) => (t: string) => {
  const w = toMin(wake) - 120;
  const m = toMin(t);
  return m < w ? m + 1440 : m;
};

/* ---------- schedule generation ---------- */
export function buildSchedule(s: Setup): Item[] {
  const wd = s.workDays;
  const items: Item[] = [];
  const add = (id: string, time: string, title: string, cat: Cat, days: Days | 'none' = 'all', note = '', notify = true) => {
    if (days !== 'none') items.push({ id, time, title, cat, days, note, notify });
  };
  const q15 = (m: number) => Math.round(m / 15) * 15;
  const morningRun = s.runWhen === 'morning';
  const eveningRun = s.runWhen === 'evening';

  add('wake', s.wake, 'Wake up + 500 ml water', 'water', 'all', 'Water before coffee or tea.');
  let bfast: string;
  if (morningRun) {
    const run = toMin(s.runTime) > toMin(s.wake) + 15 ? s.runTime : addMin(s.wake, 30);
    add('warm', addMin(run, -15), 'Warm-up & mobility', 'move', 'all', '10 min: leg swings, hip circles, calf raises.', false);
    add('run', run, 'Training session', 'run');
    add('cool', addMin(run, 60), 'Stretch + shower', 'move', 'all', '5 min stretch: hamstrings, calves, hip flexors.', false);
    bfast = addMin(run, 90);
  } else {
    bfast = addMin(s.wake, 45);
  }
  add('bfast', bfast, 'Breakfast', 'food');
  add('vits', addMin(bfast, 30), 'Vitamins (after breakfast)', 'vitamin');
  if (toMin(s.login) - toMin(bfast) >= 120)
    add('me', addMin(bfast, 60), 'Personal time: learn, read, errands', 'rest', 'all', 'Keep it screen-light before work.', false);
  const wdays: Days | 'none' = wd === 'none' ? 'none' : wd === 'all' ? 'all' : 'weekdays';
  add('snack1', addMin(s.login, -30), 'Fruit + water before work', 'food', wdays);
  add('login', s.login, 'Log in to office', 'work', wdays, 'Fill your bottle and keep it on the desk.', false);
  if (s.standup) add('standup', s.standup, 'Stand-up', 'work', wdays, '', false);
  const workLen = (toMin(s.logoff) - toMin(s.login) + 1440) % 1440;
  add('lunch', addMin(s.login, Math.min(150, q15(workLen * 0.25))), 'Lunch', 'food');
  add('move1', addMin(s.login, q15(workLen * 0.45)), 'Movement break, 5 min', 'move', wdays, 'Walk, stairs or 20 squats. Drink a glass.');
  add('snack2', addMin(s.login, q15(workLen * 0.6)), 'Evening snack', 'food');
  add('move2', addMin(s.login, q15(workLen * 0.8)), 'Stretch break + water', 'move', wdays, 'Neck, shoulders, wrists. 2 min away from the screen.');
  add('logoff', s.logoff, 'Log off', 'work', wdays, "Write tomorrow's top 3 before closing the laptop.", false);
  let dinner = addMin(s.logoff, 15);
  if (eveningRun) {
    const run = toMin(s.runTime) >= toMin(s.logoff) ? s.runTime : addMin(s.logoff, 15);
    add('run', run, 'Training session', 'run');
    dinner = addMin(run, 75);
  }
  const dm = dayMinFor(s.wake);
  add('dinner', dinner, 'Dinner (light)', 'food', 'all', dm(s.sleep) - toMin(dinner) < 120 ? 'Keep it small: bedtime is close.' : '');
  if (!eveningRun) add('walk', addMin(dinner, 45), '10-min walk, screens down', 'move', 'all', 'Helps digestion and sleep.', false);
  add('prep', addMin(s.sleep, -30), eveningRun ? 'Screens down, wind down' : 'Wind down + lay out running kit', 'rest');
  add('sleep', s.sleep, 'Lights out', 'rest', 'all', 'Aim for 7.5+ hours of sleep.');
  return items.sort((a, b) => dm(a.time) - dm(b.time));
}

export const DEFAULT_SETTINGS: Settings = {
  setupDone: false,
  setup: DEFAULT_SETUP,
  waterGoalMl: 3000,
  glassMl: 250,
  waterNudge: '2h',
  notificationsOn: true,
  vitamins: ['Multivitamin', 'Vitamin B12', 'Vitamin D3', 'Omega-3 (algae-based)'],
  schedule: buildSchedule(DEFAULT_SETUP),
  workouts: DEFAULT_WORKOUTS,
  meals: DEFAULT_MEALS,
  rotationStart: ROTATION_START,
};

/* ---------- derived values ---------- */
export function itemsFor(settings: Settings, date: Date): Item[] {
  const we = isWeekend(date);
  const dm = dayMinFor(settings.setup.wake);
  return settings.schedule
    .filter(i => i.days === 'all' || (i.days === 'weekdays' && !we) || (i.days === 'weekends' && we))
    .slice()
    .sort((a, b) => dm(a.time) - dm(b.time));
}

const rotIndex = (settings: Settings, d: Date, n: number) => {
  const off = dayIndex(d) - dayIndex(new Date(settings.rotationStart + 'T12:00:00'));
  return ((off % n) + n) % n;
};
export function pickIndex(settings: Settings, log: DayLog | undefined, slot: MealSlot | 'run', d: Date, n: number) {
  const p = log?.pick?.[slot];
  return Number.isInteger(p) ? (((p as number) % n) + n) % n : rotIndex(settings, d, n);
}
export function mealFor(settings: Settings, log: DayLog | undefined, slot: MealSlot, d: Date) {
  const list = settings.meals[slot] || [];
  return list.length ? list[pickIndex(settings, log, slot, d, list.length)] : 'Add options in Routine';
}
const NO_WORKOUT: Workout = { id: 'none', type: 'Rest', title: 'No workouts in your list', detail: 'Add workouts in the Routine tab.', km: 0 };
export function workoutFor(settings: Settings, log: DayLog | undefined, d: Date) {
  const list = settings.workouts || [];
  return list.length ? list[pickIndex(settings, log, 'run', d, list.length)] : NO_WORKOUT;
}
export function noteFor(settings: Settings, log: DayLog | undefined, item: Item, d: Date): string {
  const slot = ({ bfast: 'breakfast', lunch: 'lunch', snack2: 'snack', dinner: 'dinner' } as Record<string, MealSlot>)[item.id];
  if (item.cat === 'run') { const w = workoutFor(settings, log, d); return w.title + (w.detail ? ' · ' + w.detail : ''); }
  if (slot) return mealFor(settings, log, slot, d);
  if (item.cat === 'vitamin') return settings.vitamins.join(' · ') || item.note;
  return item.note;
}
export function completion(settings: Settings, log: DayLog | undefined, d: Date) {
  const items = itemsFor(settings, d);
  if (!items.length || !log) return 0;
  return items.filter(i => log.done[i.id]).length / items.length;
}
export function plannedWeekKm(settings: Settings, days: Record<string, DayLog>, date: Date) {
  let s = 0;
  for (let i = 6; i >= 0; i--) { const d = addDays(date, -i); s += +workoutFor(settings, days[keyOf(d)], d).km || 0; }
  return Math.round(s * 10) / 10;
}
export function waterPace(settings: Settings, date: Date) {
  const items = itemsFor(settings, date);
  if (!items.length) return 0;
  const dm = dayMinFor(settings.setup.wake);
  const start = dm(items[0].time), end = dm(items[items.length - 1].time) - 60;
  const n = nowMin();
  if (n <= start) return 0;
  return Math.min(1, (n - start) / Math.max(60, end - start));
}
export const emptyDay = (): DayLog => ({ done: {}, waterMl: 0, runs: [] });
