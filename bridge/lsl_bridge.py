"""Forwards a Lab Streaming Layer EEG stream to WebSocket clients as JSON frames.

    pip install pylsl websockets
    python bridge/lsl_bridge.py [--type EEG] [--port 8765]

Each message is a JSON array of frames, [[ch1, ch2, ...], ...], in the stream's
units (most LSL EEG streams use microvolts, which the app expects).
"""

import argparse
import asyncio
import json

import websockets
from pylsl import StreamInlet, resolve_byprop


async def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--type", default="EEG", help="LSL stream type to resolve")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()

    print(f"Looking for an LSL stream of type {args.type}...")
    info = resolve_byprop("type", args.type, timeout=30)[0]
    inlet = StreamInlet(info)
    channels, labels = info.channel_count(), []
    ch = info.desc().child("channels").child("channel")
    for _ in range(channels):
        labels.append(ch.child_value("label") or f"ch{len(labels) + 1}")
        ch = ch.next_sibling()
    print(f"{info.name()}: {info.nominal_srate():g} Hz, channels: {', '.join(labels)}")

    clients: set = set()

    async def handler(socket) -> None:
        clients.add(socket)
        try:
            await socket.wait_closed()
        finally:
            clients.discard(socket)

    async with websockets.serve(handler, args.host, args.port):
        print(f"Serving on ws://{args.host}:{args.port}")
        while True:
            frames, _ = inlet.pull_chunk(timeout=0.0)
            if frames and clients:
                websockets.broadcast(clients, json.dumps(frames))
            await asyncio.sleep(0.02)


if __name__ == "__main__":
    asyncio.run(main())
