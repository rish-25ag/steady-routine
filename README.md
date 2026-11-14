# Steady

A daily routine app for iPhone: a timeline you tick off, phone reminders for each habit, water tracking, a workout rotation with a run log, vegetarian meal rotation, vitamins after breakfast, and weekly streaks.

Everything is stored on your phone. Reminders are scheduled on the phone itself, so they keep firing even when your laptop is off.

## Run it on your iPhone (from Windows)

You only do steps 1–3 once.

1. **Install the tools on your laptop**
   - Node.js LTS: download the Windows installer from <https://nodejs.org> and run it.
   - Git for Windows: <https://git-scm.com/download/win> (or use **Code → Download ZIP** on GitHub and unzip it).
2. **Install Expo Go on your iPhone** from the App Store.
3. **Get the code and its packages.** Open *Command Prompt* or *PowerShell* and run:

   ```bash
   git clone https://github.com/YOUR-USERNAME/steady-routine.git
   ```

   ```bash
   cd steady-routine
   ```

   ```bash
   npm install
   ```

4. **Start the app:**

   ```bash
   npx expo start --tunnel
   ```

   If Windows Firewall asks, click **Allow access**. If it asks to install `@expo/ngrok`, answer **Y**.
5. **Open it on your phone.** Point the iPhone **Camera** at the QR code in the terminal and tap the banner. It opens in Expo Go.
6. Tap **Start setup**, enter your times, then tap **Allow** when iOS asks about notifications.

Next time, run step 4 again from the `steady-routine` folder and scan the code (or pick Steady from Expo Go's recent list while the command runs).

## Use it without your laptop (EAS Update, free)

Publish the app to your Expo account once, and Expo Go can open it any time — laptop off, any network.

One-time setup, in the `steady-routine` folder (signed in to Expo; see the login note below):

```bash
npx eas-cli@latest init
```

```bash
npx eas-cli@latest update:configure
```

Answer **Y** to the prompts. These link the project to your Expo account and add the update settings to `app.json`.

Publish (run this again whenever the app changes):

```bash
npm run publish-app
```

Then open it on the phone: the command prints an **EAS Dashboard** link. Open it, or go to expo.dev → your project → **Updates**, open the latest update and use **Preview** to open it in Expo Go (same account as on the laptop). After the first open, Steady stays in Expo Go's recent list.

**Login note (Windows):** if `npx expo login` crashes while opening the browser, create a token at expo.dev → Account settings → Access tokens and run `setx EXPO_TOKEN "your-token"`, then open a new PowerShell window.

## Using the app

- **Today** — what's due now, your day as a checklist, and a water warning if you fall behind.
- **Water** — log glasses or bottles against your daily goal.
- **Train** — today's workout from your rotation (tap **Swap** to change it), log sessions with pace, next 7 days.
- **Food** — today's meals from your rotation (swap any of them), plate rules for runners.
- **Notes** — a daily journal (with mood and energy) plus separate titled notes you can pin; search covers both.
- **Stats** — streak (days with at least 70% done), weekly completion, water, vitamins and distance.
- **Routine** — add, edit and delete tasks; set water goal, vitamins, workout list and meal options; rerun setup.

### Tasks

Every task has a time, title, category, notes and optional duration, plus:

- **Repeat:** every day, weekdays, weekends, chosen days (e.g. Mon/Wed/Fri), or one time on a date.
- **Reminder:** off, at the time, or 5/10/15/30 minutes before.
- **Pause** (kept but hidden and silent), **Skip today** (back tomorrow), or **Delete**.

Adding a task asks whether it's for today only, a specific date, or repeating. Past one-time tasks can be cleared in one tap.

## Apple Watch & Apple Health (free, via Shortcuts)

Expo Go can't read Apple Health directly, so a free iPhone shortcut called **Steady Sync** reads today's steps, distance, Move/Exercise/Stand, last night's sleep, resting heart rate and (optionally) Watch workouts, then opens Steady with them.

- Build it once: in Steady go to **Routine → Apple Health & Watch → Set up sync** for the step-by-step guide and your personal sync link.
- Add the shortcut to your Home Screen and open Steady from it for fresh numbers, or schedule it with a Shortcuts automation.
- Steady shows the numbers on Today and Stats, logs Watch workouts in Train (once each), and ticks Training and movement breaks automatically (switch this off in Routine). Untick an item and later syncs leave it alone.
- The sync link differs between `npx expo start` and the published app: copy it again from the guide after publishing.

Live, automatic Health access needs a standalone app (Apple Developer account, $99/year) using a HealthKit module and an EAS build.

## Reminders

- Each schedule item has a **Remind me** switch. Daily items use one reminder; weekday-only items use five (one per weekday).
- Optional water nudges every 1 or 2 hours during work hours.
- iPhone allows an app 64 scheduled reminders. Steady uses up to 60 and tells you if some were skipped.
- No reminders? iPhone **Settings → Notifications → Expo Go** → Allow Notifications. Also check that a Focus mode isn't silencing them.

## Develop

```bash
npm run web
```

```bash
npx tsc --noEmit
```

```bash
npx expo lint
```

Code lives in `src/`: `data.ts` (plans, defaults, schedule builder), `notify.ts` (reminders), `store.tsx` (on-device storage), `ui.tsx` (theme and components), `screens/`.
