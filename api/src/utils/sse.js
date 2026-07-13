/**
 * Set up a Server-Sent Events connection on an Express response.
 *
 * Configures headers, disables timeouts, starts a keepalive heartbeat,
 * and handles client disconnect cleanup.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {{ send: (event: object) => void, aborted: boolean }}
 */
function setupSSE(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Disable Node's default 2-minute socket timeout — long-running AI
  // responses with multi-step tool calls can exceed it easily.
  req.socket.setTimeout(0);
  res.socket?.setTimeout?.(0);

  // SSE keepalive heartbeat — prevents proxies and QUIC/HTTP3 connections
  // from dropping the stream during quiet periods (e.g. while the AI model
  // is reasoning or a tool call is executing server-side).
  const heartbeatTimer = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 15_000);

  let aborted = false;
  req.on('close', () => {
    aborted = true;
    clearInterval(heartbeatTimer);
  });

  const send = (event) => {
    if (aborted) return;
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  return {
    send,
    get aborted() { return aborted; },
    cleanup() { clearInterval(heartbeatTimer); },
  };
}

module.exports = { setupSSE };
