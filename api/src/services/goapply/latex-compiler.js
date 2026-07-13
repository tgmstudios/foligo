/**
 * LaTeX compilation via LuaLaTeX (TeX Live) — supports microtype letterspacing,
 * fontspec, Unicode, and system fonts. Replaces the former tectonic-based compiler
 * which was XeTeX-only and incompatible with microtype's \textls{} commands.
 */
const { spawn } = require('child_process');
const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const LUALATEX_BIN = process.env.LUALATEX_BIN || 'lualatex';
const COMPILE_TIMEOUT_MS = 30000;

/**
 * Check if a line looks like a lualatex "note:" / info line (not an error).
 * LuaLaTeX and TeX Live emit various info lines starting with words like
 * "note:", "(", ")", "This is", "Document Class:", etc. that are not errors.
 */
function isInfoLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('(') || trimmed.startsWith(')')) return true;
  if (trimmed.startsWith('This is ')) return true;
  if (trimmed.startsWith('Document Class:')) return true;
  if (/^\[?\d+\]?$/.test(trimmed)) return true; // page numbers like [1]
  if (trimmed.startsWith('Output written on ')) return true;
  if (trimmed.startsWith('Transcript written on ')) return true;
  if (trimmed.startsWith('<') && trimmed.includes('>')) return true; // font loading
  if (trimmed.startsWith('No file ') && trimmed.endsWith('.aux.')) return true;
  if (trimmed.startsWith('No file ') && trimmed.endsWith('.toc.')) return true;
  return false;
}

/**
 * Parse LaTeX compiler output for structured error information.
 * Handles lualatex's traditional `! <msg>.\nl.<line>` format and
 * the modern `file:line: error: <msg>` format.
 *
 * @param {string} output - raw compiler stdout/stderr
 * @param {string} source - original .tex source (for context extraction)
 * @returns {{ message: string, errors: Array<{line?:number, col?:number, message:string, context?:string}> }}
 */
function parseLatexErrors(output, source) {
  const errors = [];
  const sourceLines = source.split('\n');

  // Pattern 1: traditional LaTeX "! <message>.\nl.<line> <content>"
  // This is the primary format from lualatex
  const latexPattern = /!\s+(.+?)\.\s*\nl\.(\d+)\s*(.*?)(?=\n[!?]|\n\n|\n\s*\n|$)/gs;
  let match;
  while ((match = latexPattern.exec(output)) !== null) {
    const message = match[1].trim();
    const line = parseInt(match[2], 10);
    const context = match[3].trim().slice(0, 120);
    if (!errors.some(e => e.line === line && e.message === message)) {
      errors.push({ line, col: undefined, message, context });
    }
  }

  // Pattern 2: lualatex "file:line: error: <message>" or "file:line: <message>"
  const modernPattern = /^(?:! )?([^:\s]+\.tex):(\d+):(?:\s*error:)?\s*(.+)$/gm;
  while ((match = modernPattern.exec(output)) !== null) {
    const line = parseInt(match[2], 10);
    const message = match[3].trim();
    if (!errors.some(e => e.line === line && e.message === message)) {
      const contextLine = sourceLines[line - 1]?.trim().slice(0, 120) || '';
      errors.push({ line, col: undefined, message, context: contextLine });
    }
  }

  // Pattern 3: lualatex "Package <name> Error: <message>"
  const packagePattern = /Package (\S+) Error:\s*(.+?)(?=\n|$)/g;
  while ((match = packagePattern.exec(output)) !== null) {
    const pkg = match[1];
    const message = match[2].trim();
    // Try to find the line number near this error
    const pos = match.index;
    const surrounding = output.substring(Math.max(0, pos - 200), pos);
    const lineMatch = surrounding.match(/l\.(\d+)\s/);
    const line = lineMatch ? parseInt(lineMatch[1], 10) : undefined;
    if (!errors.some(e => e.line === line && e.message.includes(pkg))) {
      const contextLine = line ? sourceLines[line - 1]?.trim().slice(0, 120) : undefined;
      errors.push({ line, col: undefined, message: `[${pkg}] ${message}`, context: contextLine });
    }
  }

  // Pattern 4: "Undefined control sequence" from lualatex
  const undefPattern = /Undefined control sequence[:\\s]*(\\\S+)?/g;
  while ((match = undefPattern.exec(output)) !== null) {
    const cmd = match[1]?.trim() || '(unknown)';
    // Find the line number
    const pos = match.index;
    const surrounding = output.substring(Math.max(0, pos - 200), pos);
    const lineMatch = surrounding.match(/l\.(\d+)\s/);
    const line = lineMatch ? parseInt(lineMatch[1], 10) : undefined;
    const contextLine = line ? sourceLines[line - 1]?.trim().slice(0, 120) : undefined;
    errors.push({ line, message: `Undefined control sequence: ${cmd}`, context: contextLine });
  }

  // Pattern 5: "Emergency stop" — last-resort catch-all
  if (errors.length === 0 && output.includes('Emergency stop')) {
    const lines = output.split('\n');
    // Find the line with the actual error, skipping info lines
    const errorLines = [];
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.startsWith('!') || line.includes('Error')) {
        errorLines.unshift(line);
        if (errorLines.length >= 5) break;
      }
    }
    if (errorLines.length > 0) {
      errors.push({ message: errorLines.join(' | ').slice(0, 500) });
    } else {
      errors.push({ message: 'Emergency stop — compilation aborted' });
    }
  }

  // If we found nothing, scan for non-info lines that might be errors
  if (errors.length === 0) {
    const nonInfoLines = output.split('\n')
      .filter(l => !isInfoLine(l))
      .join('\n')
      .trim();
    if (nonInfoLines) {
      const clean = nonInfoLines.split('\n')
        .filter(l => l.trim())
        .slice(-15)
        .join('\n');
      if (clean) {
        errors.push({ message: clean.slice(0, 500) });
      }
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
 * Compile LaTeX source to a PDF buffer using LuaLaTeX.
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

    const { code, output } = await runLuaLatex(texPath, workDir);

    if (code !== 0) {
      const parsed = parseLatexErrors(output, source);
      return {
        error: parsed.message,
        log: output.slice(-3000),
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

function runLuaLatex(texPath, workDir) {
  return new Promise((resolve) => {
    const args = [
      '-interaction=nonstopmode',
      '-halt-on-error',
      '-output-directory', workDir,
      texPath,
    ];

    const proc = spawn(LUALATEX_BIN, args, {
      cwd: workDir,
      timeout: COMPILE_TIMEOUT_MS,
    });

    let output = '';
    proc.stdout.on('data', (d) => { output += d.toString(); });
    proc.stderr.on('data', (d) => { output += d.toString(); });

    proc.on('error', (err) => {
      resolve({ code: -1, output: `Failed to launch lualatex: ${err.message}` });
    });
    proc.on('close', (code) => {
      resolve({ code, output });
    });
  });
}

module.exports = { compile };
