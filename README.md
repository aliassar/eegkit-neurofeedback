# Focus Games (eegkit-neurofeedback)

[![ci](https://github.com/aliassar/eegkit-neurofeedback/actions/workflows/ci.yml/badge.svg)](https://github.com/aliassar/eegkit-neurofeedback/actions/workflows/ci.yml)
[![license](https://img.shields.io/github/license/aliassar/eegkit-neurofeedback)](LICENSE)

Open-source attention games driven by EEG neurofeedback, for children with ADHD (about 6–12)
and the grown-ups who support them. Runs on the web, iOS and Android, built with Expo on
[eegkit](https://github.com/aliassar/eegkit) and
[eegkit-react](https://github.com/aliassar/eegkit-react).

**Play it in your browser: <https://aliassar.github.io/eegkit-neurofeedback/>.** The web demo
uses simulated EEG, so no hardware is needed: hold the "Simulate focus" button (or the Space
bar) and watch the game respond.

> **Not a medical device. Not a diagnosis or treatment for ADHD.** Use it alongside, not
> instead of, professional care. The evidence for neurofeedback in ADHD is mixed. See
> [Disclaimer](#disclaimer).

## What it does

A child plays short games. Their attention, measured from EEG against their own resting
baseline, drives the game about four times a second: focus and the balloon rises, the flower
grows, the boat speeds up. Grown-ups set things up, check the signal, and follow progress over
weeks.

### For children

- **Three original mini-games**, all drawn in code (no external art):
  - **Sky Balloon**: the balloon floats up while attention is above baseline and drifts down
    when it drops. Sustained focus charges a star to catch.
  - **Magic Garden**: focus grows the current flower from a sprout to a bloom while the sun
    brightens; the garden fills up over the round.
  - **River Boat**: the boat sails faster with focus, and the next flag comes closer.
- **Short rounds** (1–3 minutes, 2 by default), **3–5 rounds** per session (4 by default) with
  20-second stretch breaks, after a short resting baseline.
- **Stars and badges**: one star for every 8 seconds of focused play plus one for finishing each
  round. Badges reward practice (first game, each game played, 5 and 10 sessions, star totals),
  never a score. The end-of-session celebration is the same on a hard day: the stars collected,
  any new badge, and a kind word.
- **Gentle pauses**: when the signal is poor the game stops and says "Let's fix the headband"
  instead of counting it against the child. Windows with blinks or movement are skipped.
- Big buttons, few words, no numbers or charts. Each child picks a buddy who appears in the
  games.

### For grown-ups (behind a press-and-hold gate)

- **Children**: several profiles per device, each with a buddy and a training plan (protocol,
  rounds, round length, baseline length).
- **Progress** per child: sessions, training time, share of time focused per session (chart),
  longest focus streak, stars, and per-round bars. Sessions recorded with the demo are marked
  "Simulated".
- **Focus check**: a 2½-minute go/no-go task without feedback (tap for the sun, not for the
  moon). It records reaction time and its variability, omissions and commissions, plus the
  protocol's EEG metric during the task, so you can follow change over weeks. It is a practice
  measure without norms, not a diagnostic test.
- **Export** a child's sessions and focus checks as CSV, or everything as JSON: a download on
  the web, the share sheet on iOS and Android.
- **Setup**: source (demo or WebSocket), mains frequency, electrode guidance, theme.
- **Signal**: live traces, per-channel quality (good / fair / poor with the reason: flatline,
  clipping, line noise, artifact), band powers and alpha peak, for checking the headset before
  a session.

The grown-up area opens with a two-second press and hold, which young children rarely do by
accident. It locks again when you go back to the games.

## Attention measurement

Each session begins with a resting baseline (20, 30 or 60 seconds). During play, the chosen
protocol's metric is computed from 2-second windows four times a second, smoothed (1-second
time constant), and compared with that baseline as a z-score. The game uses a logistic of the
z-score (0.5 = same as rest), and counts a moment as "focused" at 0.6 or more (about +0.4
standard deviations). No protocol uses absolute thresholds: the ratios differ a lot between
children, headsets and electrode placements.

Band powers are averaged over the channels that are connected (quality not poor) and free of
artifacts in that window. If none qualify, the window is skipped and the score holds.

| Protocol                 | Metric                                                  | Rewarded | Usual placement  |
| ------------------------ | ------------------------------------------------------- | -------- | ---------------- |
| **Theta/Beta** (default) | `thetaBetaRatio`: theta (4–8 Hz) / beta (13–30 Hz)      | down     | Cz, or Fz and Cz |
| **SMR**                  | `bandRatio(bp, "smr", "theta")`: SMR (12–15 Hz) / theta | up       | Cz (or C3/C4)    |
| **Engagement**           | `engagementIndex`: beta / (alpha + theta)               | up       | Cz or Pz         |

- **Theta/Beta** is the classic ADHD neurofeedback protocol. The ratio is **not** a reliable
  diagnostic marker (Arns, Conners & Kraemer, 2013), so the app only compares a child with
  their own baseline and makes no diagnostic claims.
- **SMR** training rewards the 12–15 Hz sensorimotor rhythm relative to theta. The SMR band
  overlaps alpha and beta, so it is added to the pipeline's bands and used only through
  absolute powers and ratios; the Signal screen normalises over the five standard bands
  only.
- **Engagement** uses the index of Pope, Bogart & Bartolome (1995), which tracked task
  engagement in their study.

Electrodes: TBR and SMR training usually use Cz (or Fz/Cz), referenced to an earlobe or the
mastoid, with the ground on the other earlobe or the forehead. Follow your amplifier's manual.

## The demo source

The demo is eegkit's synthetic EEG (1/f background, rhythms in every band, mains hum and
occasional blinks) with a small 13.5 Hz rhythm added, generated on the device. While "Simulate
focus" is held, it shifts towards the pattern all three protocols reward (theta ×0.6, alpha
×0.8, beta ×1.9, SMR ×2) within a couple of seconds; released, it returns to rest. That is a
caricature for trying the games, labelled as simulated wherever it appears.

## Run it

You need Node 22 or newer.

```sh
git clone https://github.com/aliassar/eegkit-neurofeedback
cd eegkit-neurofeedback
npm install          # fetches and builds eegkit and eegkit-react from their GitHub tags
npm run web          # opens http://localhost:8081
```

For **iOS or Android**, install [Expo Go](https://expo.dev/go), run `npm start`, and scan the QR
code. Every native module the app uses ships with Expo Go.

```sh
npm test             # unit tests (vitest)
npm run typecheck    # tsc
npm run lint         # biome
npm run export:web   # static web build in dist/, as deployed to GitHub Pages
```

eegkit and eegkit-react are not published to the npm registry. `package.json` pins them to
release tags on GitHub (`github:aliassar/eegkit#v0.1.0`, `github:aliassar/eegkit-react#v0.1.0`);
npm builds them on install.

## Connect a headset

Any amplifier works if something can send its samples over a WebSocket; the app has no
device-specific code. In the grown-up area, open **Setup**, choose **WebSocket**, and enter the
server address, the sample rate and the channel labels in the order the server sends them. Then
check the **Signal** tab.

The server can send any format eegkit's `parseSampleMessage` accepts, with values in µV:

```text
[12.1, -3.4, 8.0]                      one frame (one value per channel)
[[12.1, -3.4, 8.0], [11.7, -2.9, 7.6]] several frames, oldest first
{"data": [[12.1, -3.4, 8.0]], "t": 0}  an object with a data or samples field
12.1,-3.4,8.0                          CSV or whitespace-separated lines
```

### Replay an EDF recording

`bridge/replay-edf.mjs` streams an EDF/EDF+ file in real time using eegkit's `parseEDF`, as JSON
arrays of frames, and prints the settings to enter in the app:

```sh
npm run bridge:edf -- path/to/recording.edf
#   --port 8765            WebSocket port
#   --host 127.0.0.1       use 0.0.0.0 to reach it from a phone on the same network
#   --channels Cz,Fz       pick and order channels by label
#   --speed 1              playback speed
#   --no-loop              stop at the end instead of looping
```

Free recordings to try: the
[EEG Motor Movement/Imagery Dataset](https://physionet.org/content/eegmmidb/1.0.0/) on PhysioNet
(64 channels at 160 Hz).

### Forward a Lab Streaming Layer stream

Many amplifiers and acquisition tools publish to [LSL](https://labstreaminglayer.org).
`bridge/lsl_bridge.py` forwards the first stream of type `EEG` it finds:

```sh
pip install pylsl websockets
python bridge/lsl_bridge.py --port 8765
```

### Connecting from a phone or the hosted demo

- From a phone, run the bridge with `--host 0.0.0.0` and use your computer's LAN address.
- Pages served over `https` (like the hosted demo) may only open `wss://` sockets, or `ws://` to
  `localhost`. The app warns you when this applies.
- Expo Go allows plain `ws://`. A standalone Android build needs cleartext traffic enabled
  (e.g. `expo-build-properties` with `android.usesCleartextTraffic`), or a `wss://` server.

## Privacy

Everything stays on the device: profiles, sessions and focus checks live in local storage.
There are no accounts, no analytics, no tracking and no network calls besides the EEG stream you
configure. Data leaves the device only when a grown-up exports it. Deleting a profile deletes
that child's data.

## Architecture

```text
eegkit           signal processing: filters, Welch spectra, band power, quality, EDF, WebSocket
  └─ eegkit-react   hooks: useEEG, useTrace, useBandPowers, useNeurofeedback, sources
       └─ this app     games, protocols, focus check, profiles, progress, export
```

- One `useEEG` connection lives in `src/state/eeg.tsx`, shared by the signal check, the games
  and the focus check. Its pipeline measures the standard bands plus SMR, with a band-pass and
  a 50/60 Hz notch, in 2-second windows every 0.25 s.
- A game session (`src/components/games/GameSession.tsx`) mounts `useNeurofeedback` with the
  child's protocol, so the baseline starts with the session. A 250 ms clock feeds the score into
  the focus meter (`src/lib/focus-meter.ts`), which counts focused time, streaks and stars; the
  scene components only draw it, with Reanimated and react-native-svg.
- Pure logic lives in `src/lib` with unit tests in `test/`: protocols, focus meter, focus-check
  scheduling and scoring, rewards, profiles, settings, records and export formats.

```text
src/app/              routes (expo-router)
  index.tsx           kid home
  play/[game].tsx     a game session
  focus-check.tsx     the go/no-go task
  gate.tsx            the grown-up gate
  grown-ups/          Progress, Children, Setup, Signal, About
src/components/       UI; games/ holds the scenes and the session, kid/ the child-facing parts
src/lib/              plain TypeScript, unit tested
src/state/            React contexts: settings, profiles, records, the EEG connection, the gate
src/theme/            colour tokens (dark and light), spacing, type
bridge/               replay-edf.mjs and lsl_bridge.py
scripts/              make-icons.mjs, which renders the app icons
```

## Disclaimer

Focus Games is not a medical device. It has not been evaluated or cleared by any regulator. It
does not diagnose ADHD or any other condition and is not a treatment for ADHD. Use it alongside,
not instead of, the care a child's doctor, psychologist or therapist provides, and talk to them
before changing any treatment.

The evidence for neurofeedback in ADHD is mixed. An early meta-analysis reported large effects on
inattention and impulsivity (Arns et al., 2009), but a later meta-analysis of randomised
controlled trials found effects mainly in ratings by people who knew which treatment the child
received, and much smaller or non-significant effects when raters were blinded (Cortese et al.,
2016). The theta/beta ratio is not a reliable diagnostic marker for ADHD (Arns et al., 2013).
Scores in this app are relative to the child's own baseline on the day and say nothing about
whether a child has ADHD.

- Arns, M., de Ridder, S., Strehl, U., Breteler, M., & Coenen, A. (2009). Efficacy of
  neurofeedback treatment in ADHD: the effects on inattention, impulsivity and hyperactivity: a
  meta-analysis. _Clinical EEG and Neuroscience_, 40(3), 180–189.
- Cortese, S., et al. (2016). Neurofeedback for attention-deficit/hyperactivity disorder:
  meta-analysis of clinical and neuropsychological outcomes from randomized controlled trials.
  _Journal of the American Academy of Child & Adolescent Psychiatry_, 55(6), 444–455.
- Arns, M., Conners, C. K., & Kraemer, H. C. (2013). A decade of EEG theta/beta ratio research in
  ADHD: a meta-analysis. _Journal of Attention Disorders_, 17(5), 374–383.
- Pope, A. T., Bogart, E. H., & Bartolome, D. S. (1995). Biocybernetic system evaluates indices
  of operator engagement in automated task. _Biological Psychology_, 40(1–2), 187–195.

## License

[MIT](LICENSE) © Ali Assar
