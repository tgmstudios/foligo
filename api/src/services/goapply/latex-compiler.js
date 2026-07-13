/**
 * LaTeX compilation via tectonic — a self-contained TeX engine (no system TeX Live install needed).
 * Compiles a .tex source string to a PDF buffer in an isolated temp directory.
 */
const { spawn } = require('child_process');
const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const TECTONIC_BIN = process.env.TECTONIC_BIN || 'tectonic';
const TECTONIC_BUNDLE_URL = process.env.TECTONIC_BUNDLE_URL;
const COMPILE_TIMEOUT_MS = 30000;

/**
 * Parse LaTeX compiler output for structured error information.
 * Handles both tectonic's `error:` prefix format and traditional `! ... l.X` format.
 *
 * @param {string} output - raw compiler stdout/stderr
 * @param {string} source - original .tex source (for context extraction)
 * @returns {{ message: string, errors: Array<{line?:number, col?:number, message:string, context?:string}> }}
 */
function parseLatexErrors(output, source) {
  const errors = [];
  const sourceLines = source.split('\n');
  let match;

  // Pattern 1a: tectonic inline format "error: <file>:<line>:<col>?: <message>"
  const tectonicInlinePattern = /error:\s*\S+:(\d+)(?::(\d+))?:\s*(.+?)(?=\n\S|\nerror:|\n$|$)/gs;
  while ((match = tectonicInlinePattern.exec(output)) !== null) {
    const line = parseInt(match[1], 10);
    const col = match[2] ? parseInt(match[2], 10) : undefined;
    const message = match[3].trim();
    const contextLine = sourceLines[line - 1]?.trim().slice(0, 120) || '';
    errors.push({ line, col, message, context: contextLine });
  }

  // Pattern 1b: tectonic Rust-style "error: <msg>\n   --> <file>:<line>:<col>"
  const tectonicRustPattern = /error:\s*(.+?)(?:\n|\r|$)\s*-->\s*\S+:(\d+):(\d+)/g;
  while ((match = tectonicRustPattern.exec(output)) !== null) {
    const message = match[1].trim();
    const line = parseInt(match[2], 10);
    const col = parseInt(match[3], 10);
    if (!errors.some(e => e.line === line && e.message === message)) {
      const contextLine = sourceLines[line - 1]?.trim().slice(0, 120) || '';
      errors.push({ line, col, message, context: contextLine });
    }
  }

  // Pattern 2: traditional LaTeX "! <msg>.\nl.<line> <content>"
  const latexPattern = /!\s+(.+?)\.\s*\nl\.(\d+)\s+(.*?)(?=\n[!?]|\n\n|$)/gs;
  while ((match = latexPattern.exec(output)) !== null) {
    const message = match[1].trim();
    const line = parseInt(match[2], 10);
    const context = match[3].trim().slice(0, 120);
    // Avoid duplicates (same line)
    if (!errors.some(e => e.line === line && e.message === message)) {
      errors.push({ line, col: undefined, message, context });
    }
  }

  // Pattern 3: "Undefined control sequence" from tectonic
  const undefPattern = /Undefined control sequence[:\s]*(.*?)(?:\n|$)/g;
  while ((match = undefPattern.exec(output)) !== null) {
    const cmd = match[1].trim();
    errors.push({
      line: undefined,
      message: `Undefined control sequence: ${cmd || '(unknown)'}`,
      context: cmd ? `\\${cmd}...` : undefined,
    });
  }

  // Pattern 4: "Emergency stop" — last-resort catch
  if (errors.length === 0 && output.includes('Emergency stop')) {
    // Extract whatever context we can
    const lines = output.split('\n');
    const errorStart = lines.findIndex(l => l.includes('!') || l.includes('error:'));
    if (errorStart >= 0) {
      const msg = lines.slice(errorStart, errorStart + 5).join('\n').trim();
      errors.push({ message: msg.slice(0, 300) });
    }
  }

  // If we still found nothing, grab the last 20 lines as raw context
  if (errors.length === 0) {
    const trimmed = output.trim();
    if (trimmed) {
      const tail = trimmed.split('\n').slice(-15).join('\n');
      errors.push({ message: tail.slice(0, 500) });
    }
  }

  // Build a human-readable summary
  let message;
  if (errors.length === 0) {
    message = 'LaTeX compilation failed (no specific error details available)';
  } else if (errors.length === 1) {
    const e = errors[0];
    const loc = e.line ? ` at line ${e.line}` : '';
    message = `LaTeX error${loc}: ${e.message}`;
  } else {
    message = `${errors.length} LaTeX errors found (first at line ${errors[0].line || '?'})`;
  }

  return { message, errors };
}

/**
 * Compile LaTeX source to a PDF buffer.
 * @param {string} source - Full .tex document source
 * @returns {Promise<{ pdf: Buffer } | { error: string, log: string, errors?: Array }>}
 */
async function compile(source) {
  const workDir = path.join(os.tmpdir(), `latex-${crypto.randomBytes(8).toString('hex')}`);
  const texPath = path.join(workDir, 'document.tex');
  const pdfPath = path.join(workDir, 'document.pdf');

  try {
    await fs.mkdir(workDir, { recursive: true });
    await fs.writeFile(texPath, source, 'utf8');

    const { code, output } = await runTectonic(texPath, workDir);

    if (code !== 0) {
      const parsed = parseLatexErrors(output, source);
      return {
        error: parsed.message,
        log: output.slice(-3000), // Keep log manageable
        errors: parsed.errors,
      };
    }

    const pdf = await fs.readFile(pdfPath);
    return { pdf };
  } catch (error) {
    return {
      error: error.message || 'Failed to compile LaTeX',
      log: error.stack?.slice(0, 2000) || '',
      errors: [{ message: error.message }],
    };
  } finally {
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

function runTectonic(texPath, workDir) {
  return new Promise((resolve) => {
    const args = [];
    if (TECTONIC_BUNDLE_URL) {
      args.push('--bundle', TECTONIC_BUNDLE_URL);
    }
    args.push('--outdir', workDir, texPath);

    const proc = spawn(TECTONIC_BIN, args, {
      cwd: workDir,
      timeout: COMPILE_TIMEOUT_MS,
    });

    let output = '';
    proc.stdout.on('data', (d) => { output += d.toString(); });
    proc.stderr.on('data', (d) => { output += d.toString(); });

    proc.on('error', (err) => {
      resolve({ code: -1, output: `Failed to launch tectonic: ${err.message}` });
    });
    proc.on('close', (code) => {
      resolve({ code, output });
    });
  });
}

module.exports = { compile };
