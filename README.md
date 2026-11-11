# eegkit-neurofeedback

[![ci](https://github.com/aliassar/eegkit-neurofeedback/actions/workflows/ci.yml/badge.svg)](https://github.com/aliassar/eegkit-neurofeedback/actions/workflows/ci.yml)
[![license](https://img.shields.io/github/license/aliassar/eegkit-neurofeedback)](LICENSE)

An open-source neurofeedback trainer for web, iOS and Android, built with Expo on
[eegkit](https://github.com/aliassar/eegkit) and
[eegkit-react](https://github.com/aliassar/eegkit-react).

**Try it in your browser: <https://aliassar.github.io/eegkit-neurofeedback/>.** It starts on a
simulated EEG stream, so you can see live traces, band powers and a full training session
without any hardware.

It works with any EEG source that can send numbers over a WebSocket. There are no
device-specific or reverse-engineered protocols: a small bridge script next to your amplifier's
SDK, Lab Streaming Layer, or an EDF recording is all it takes.

> **Not a medical device.** This app is for education, research and wellness experiments. It
> does not diagnose, treat or prevent any condition. See [Disclaimer](#disclaimer).

## Features

- **Live signal**: scrolling traces for every channel, a quality indicator per channel (good /
  fair / poor, with the reason: flatline, clipping, line noise or artifact), relative band power
  from delta to gamma, and the individual alpha peak frequency.
- **Training**: three protocols. A session goes through a signal check, a resting baseline with
  a progress bar, then training. The feedback is a slowly breathing orb that grows, brightens
  and shifts from violet to mint as your score rises above your own baseline.
- **Artifact handling**: channels with poor contact are left out, and windows with blinks or
  movement are skipped, so the score holds steady instead of dropping on every blink. If the
  signal is lost, feedback pauses and the time is excluded from the statistics.
- **History**: each session's protocol, duration, mean score and time in the reward zone, with a
  chart of the score over the session. Stored on the device only.
- **Sources**: a simulated demo stream, or any WebSocket server. The settings (source, address,
  sample rate, channel labels, 50/60 Hz mains, theme) are saved on the device.
- Dark and light themes, phone and desktop layouts, screen-reader labels, 44 pt touch targets,
  and reduced motion respected.

## Protocols

The app compares each analysis window (2 s, updated 4 times a second) with a baseline you record
at the start of every session. The score is a logistic function of the z-score against that
baseline: 50% means "same as at rest", and the reward zone starts at 60% (about +0.4 standard
deviations). Band powers are averaged over the usable, artifact-free channels before the
metric is computed.

| Protocol  | Trains                        | Direction | Usual sites |
| --------- | ----------------------------- | --------- | ----------- |
| **Relax** | Relative alpha power, 8–13 Hz | up        | Pz, O1, O2  |
| **Focus** | Theta/beta ratio              | down      | Cz, Fz      |
| **Calm**  | Alpha/theta ratio             | up        | Cz, Pz      |

- **Relax.** Posterior alpha grows in relaxed wakefulness and is the oldest neurofeedback target
  (Kamiya's alpha training in the 1960s; for a controlled study of upper-alpha training see
  Zoefel, Huster & Herrmann, 2011, NeuroImage 54(2):1427–1431). It is the easiest effect to feel
  and to see in the data.
- **Focus.** The theta/beta ratio tends to fall with sustained, alert attention and is the
  classic attention-training target (Monastra et al., 1999). It uses eegkit's `thetaBetaRatio`.
  Its value as a marker is disputed (Arns et al., 2013), so treat it as a within-person trend.
- **Calm.** The alpha/theta ratio (eegkit's `alphaThetaRatio`) rewards calm alertness: more
  alpha without the rise in theta that comes with drowsiness. This is deliberately not the
  Peniston–Kulkosky "alpha-theta" protocol, which encourages a theta-over-alpha crossover into a
  hypnagogic state. That is usually done eyes-closed with audio feedback and a clinician, which
  an unsupervised visual app should not steer people into.

**A caveat on the literature.** Neurofeedback studies are often small, many lack a sham control,
and effects found in controlled trials are frequently smaller than open-label ones. Consumer
headsets add their own limits: few, often frontal electrodes, and plenty of muscle and eye
artifacts. Use this app to learn how EEG and neurofeedback work and to experiment on yourself,
not as a treatment.

## The demo source

The demo is eegkit's synthetic EEG (1/f background, rhythms in every band, mains hum and
occasional blinks) generated on your device. It is labelled as simulated everywhere it appears,
and sessions recorded with it are marked "Simulated" in the history.

So the feedback loop can be experienced without a headset, the demo can shift its band powers
towards a state over a few seconds: _Relaxed_ (alpha ×2, theta ×0.8) or _Focused_ (theta ×0.6,
alpha ×0.8, beta ×1.9). Use the selector on the Live screen, or the "Simulate the target state"
switch during training (turn it on after the baseline). These are caricatures; real changes are
smaller and slower.

## Run it

You need Node 22 or newer.

```sh
git clone https://github.com/aliassar/eegkit-neurofeedback
cd eegkit-neurofeedback
npm install          # also builds eegkit and eegkit-react from GitHub
npm run web          # opens http://localhost:8081
```

For **iOS or Android**, install [Expo Go](https://expo.dev/go) on your phone, run `npm start`,
and scan the QR code. Every native module the app uses ships with Expo Go, so no development
build is needed.

Other scripts:

```sh
npm test             # unit tests (vitest)
npm run typecheck    # tsc
npm run lint         # biome
npm run export:web   # static web build in dist/, as deployed to GitHub Pages
```

## Connect a WebSocket source

In **Setup**, choose **WebSocket** and enter:

- the **server address**, e.g. `ws://localhost:8765` or `ws://192.168.1.20:8765`;
- the **sample rate** in Hz;
- the **channel labels**, comma separated, in the order the server sends them.

Then press **Connect**. The status line shows whether the connection is open, retrying, or why
it failed. A typical mistake, a channel list that doesn't match the stream, is reported as such.

The server can send any format eegkit's `parseSampleMessage` understands, with values in µV:

```text
[12.1, -3.4, 8.0]                     one frame (one value per channel)
[[12.1, -3.4, 8.0], [11.7, -2.9, 7.6]] several frames, oldest first
{"data": [[12.1, -3.4, 8.0]], "t": 0}  an object with a data or samples field
12.1,-3.4,8.0                          CSV or whitespace-separated lines
```

### Replay an EDF recording

`bridge/replay-edf.mjs` streams any EDF/EDF+ file in real time with eegkit's `parseEDF`, as
JSON arrays of frames. It prints the sample rate and channel labels to enter in the app.

```sh
npm run bridge:edf -- path/to/recording.edf
#   --port 8765            WebSocket port
#   --host 127.0.0.1       use 0.0.0.0 to reach it from a phone on the same network
#   --channels Fp1,Fp2,O1  pick and order channels by label
#   --speed 1              playback speed
#   --no-loop              stop at the end instead of looping
```

Free recordings to try: the
[EEG Motor Movement/Imagery Dataset](https://physionet.org/content/eegmmidb/1.0.0/) on PhysioNet
(64 channels at 160 Hz, `S001R01.edf` is an eyes-open baseline and `S001R02.edf` eyes closed,
where the alpha rise is easy to see).

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
  `localhost`. To use a bridge on another machine from the hosted demo, put it behind TLS, or run
  the app locally. The app warns you when this applies.
- Expo Go allows plain `ws://`. A standalone Android build needs cleartext traffic enabled
  (e.g. `expo-build-properties` with `android.usesCleartextTraffic`), or a `wss://` server.

## Architecture

```text
eegkit           signal processing: filters, Welch spectra, band power, quality, EDF, WebSocket
  └─ eegkit-react   hooks: useEEG, useTrace, useBandPowers, useNeurofeedback, sources
       └─ this app     screens, protocols, sessions, settings
```

- One `useEEG` connection lives in `src/state/eeg.tsx` and is shared by every screen, so the live
  view and a training session see the same stream. eegkit's pipeline does the work: a 1–45 Hz
  band-pass, a 50/60 Hz notch, 2 s windows every 0.25 s, Welch spectra, band powers, alpha peak,
  and quality checks on the raw signal.
- The Live screen draws `useTrace` buffers as SVG paths (min/max per pixel column) and reads
  `useBandPowers` for the bars. Traces are only rendered while the screen is focused.
- Training mounts `useNeurofeedback` with the protocol's metric, so the baseline starts exactly
  when the session does.
- Pure logic lives in `src/lib` with unit tests in `test/`: protocols, quality descriptions,
  session statistics, settings validation, trace geometry and the demo source.
- `src/lib/demo-source.ts` implements eegkit-react's `EEGSource` interface on top of eegkit's
  `createSyntheticEEG`, with band gains that can change while it runs.

```text
src/app/          routes (expo-router): Live, Train, History, Setup
src/components/   UI: orb, traces, band bars, charts, form controls
src/lib/          plain TypeScript, unit tested
src/state/        React contexts: settings, sessions, the EEG connection
src/theme/        colour tokens (dark and light), spacing, type
bridge/           replay-edf.mjs and lsl_bridge.py
scripts/          make-icons.mjs, which renders the app icons
```

## Disclaimer

This software is not a medical device. It has not been evaluated or cleared by any regulator, and
it must not be used to diagnose, treat, cure or prevent any disease or condition, or as a
substitute for professional care. The scores it shows are relative to your own baseline and say
nothing about your health. If you have a medical or psychological concern, talk to a qualified
professional.

## License

[MIT](LICENSE) © Ali Assar
