#!/usr/bin/env node
// Streams an EDF/EDF+ recording over WebSocket in real time, so the app's
// WebSocket source can be tried without hardware.
//
//   node bridge/replay-edf.mjs recording.edf [--port 8765] [--host 127.0.0.1]
//        [--channels Fp1,Fp2,O1,O2] [--speed 1] [--chunk-ms 40] [--no-loop]
//
// Every client receives the same live stream, as from a device: JSON arrays of
// frames, e.g. [[12.1,-3.4,8.0],[11.7,-2.9,7.6]], one value per channel in µV,
// which is a format eegkit's parseSampleMessage accepts.
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { parseEDF } from "eegkit";
import { WebSocketServer } from "ws";

const { values: options, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    port: { type: "string", default: "8765" },
    host: { type: "string", default: "127.0.0.1" },
    channels: { type: "string" },
    speed: { type: "string", default: "1" },
    "chunk-ms": { type: "string", default: "40" },
    "no-loop": { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
});

if (options.help || positionals.length !== 1) {
  console.log(
    "Usage: node bridge/replay-edf.mjs <file.edf> [--port 8765] [--host 127.0.0.1]\n" +
      "         [--channels Fp1,Fp2] [--speed 1] [--chunk-ms 40] [--no-loop]",
  );
  process.exit(options.help ? 0 : 1);
}

const port = Number(options.port);
const speed = Number(options.speed);
const chunkMs = Number(options["chunk-ms"]);
if (!(Number.isInteger(port) && port > 0 && port < 65536)) fail(`invalid --port ${options.port}`);
if (!(speed > 0)) fail(`invalid --speed ${options.speed}`);
if (!(chunkMs > 0)) fail(`invalid --chunk-ms ${options["chunk-ms"]}`);

/** µV per unit of the EDF physical dimension; the app expects µV. */
const TO_MICROVOLTS = { uv: 1, µv: 1, μv: 1, mv: 1e3, v: 1e6, nv: 1e-3 };

const recording = parseEDF(readFileSync(positionals[0]));
let signals = recording.signals;
if (signals.length === 0) fail("the file has no data signals");

if (options.channels) {
  const wanted = options.channels.split(",").map((c) => c.trim().toLowerCase());
  signals = wanted.map((name) => {
    const match = recording.signals.find((s) => s.label.trim().toLowerCase() === name);
    if (!match) {
      const known = recording.signals.map((s) => s.label.trim()).join(", ");
      fail(`no channel "${name}" in the file. Available: ${known}`);
    }
    return match;
  });
}

// A WebSocket stream has one sample rate, so keep the signals that share the first one's.
const sampleRate = signals[0].sampleRate;
const skipped = signals.filter((s) => s.sampleRate !== sampleRate);
signals = signals.filter((s) => s.sampleRate === sampleRate);
if (skipped.length > 0) {
  console.warn(
    `Skipping ${skipped.length} signal(s) at other sample rates: ${skipped.map((s) => s.label.trim()).join(", ")}`,
  );
}

const scales = signals.map((s) => {
  const unit = s.physicalDimension.trim().toLowerCase();
  const scale = TO_MICROVOLTS[unit];
  if (scale === undefined) {
    console.warn(`Unknown unit "${s.physicalDimension}" for ${s.label.trim()}: sending as is.`);
    return 1;
  }
  return scale;
});
const length = Math.min(...signals.map((s) => s.samples.length));
// Commas would break the app's comma-separated channel field.
const labels = signals.map((s) => s.label.trim().replaceAll(",", " "));

const server = new WebSocketServer({ host: options.host, port });
server.on("listening", () => {
  console.log(`Replaying ${positionals[0]} (${(length / sampleRate).toFixed(0)} s)`);
  console.log(
    `  address:     ws://${options.host === "0.0.0.0" ? "<this-machine>" : options.host}:${port}`,
  );
  console.log(`  sample rate: ${sampleRate}`);
  console.log(`  channels:    ${labels.join(", ")}`);
  console.log("Enter these in the app under Setup → WebSocket. Ctrl+C to stop.");
});
server.on("connection", (socket, request) => {
  console.log(
    `Client connected from ${request.socket.remoteAddress} (${server.clients.size} total)`,
  );
  socket.on("close", () => console.log(`Client left (${server.clients.size} remaining)`));
});
server.on("error", (error) => fail(error.message));

// Deliver whatever is due by the wall clock on each tick, like a device would.
const start = Date.now();
let sent = 0;
setInterval(() => {
  const due = Math.floor(((Date.now() - start) / 1000) * sampleRate * speed);
  const frames = [];
  for (; sent < due; sent++) {
    if (sent >= length && options["no-loop"]) {
      console.log("End of recording.");
      process.exit(0);
    }
    const index = sent % length;
    frames.push(signals.map((s, c) => Math.round(s.samples[index] * scales[c] * 1000) / 1000));
  }
  if (frames.length === 0 || server.clients.size === 0) return;
  const message = JSON.stringify(frames);
  for (const client of server.clients) {
    if (client.readyState === client.OPEN) client.send(message);
  }
}, chunkMs);

function fail(message) {
  console.error(`replay-edf: ${message}`);
  process.exit(1);
}
