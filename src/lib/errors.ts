/**
 * A readable message for whatever a source or the pipeline reported. WebSocket
 * errors arrive as bare `Event`s with no detail (browsers hide it on purpose),
 * so those get a generic, actionable message.
 */
export function describeError(error: unknown): string | null {
  if (error === undefined || error === null) return null;
  if (error instanceof Error) {
    const channels = /expected (\d+) channels per frame, got (\d+)/.exec(error.message);
    if (channels) {
      return `The server sends ${channels[2]} values per sample, but ${channels[1]} channel labels are configured. Make the channel list match the stream.`;
    }
    return error.message;
  }
  if (typeof error === "string") return error;
  if (typeof error === "object") {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.length > 0) return message;
    return "Can't reach the server. Check the address and that the bridge is running.";
  }
  return String(error);
}
