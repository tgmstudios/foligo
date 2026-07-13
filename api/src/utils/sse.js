/**
 * Write a single Server-Sent-Events formatted event. Extracted from the
 * identical `res.write(\`data: ${JSON.stringify(event)}\n\n\`)` helper
 * duplicated across goapply.js, extension-agent.js, content.js, and resume.js.
 */
function sendSse(res, event) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

module.exports = { sendSse };
