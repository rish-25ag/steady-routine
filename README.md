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

## Using the app

- **Today** — what's due now, your day as a checklist, and a water warning if you fall behind.
- **Water** — log glasses or bottles against your daily goal.
- **Train** — today's workout from your rotation (tap **Swap** to change it), log sessions with pace, next 7 days.
- **Food** — today's meals from your rotation (swap any of them), plate rules for runners.
- **Stats** — streak (days with at least 70% done), weekly completion, water, vitamins and distance.
- **Routine** — edit every schedule item and its reminder, water goal, vitamins, workout list and meal options, or rerun setup.

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
