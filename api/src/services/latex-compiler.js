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
 * Compile LaTeX source to a PDF buffer.
 * @param {string} source - Full .tex document source
 * @returns {Promise<{ pdf: Buffer } | { error: string, log: string }>}
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
      return { error: 'LaTeX compilation failed', log: output };
    }

    const pdf = await fs.readFile(pdfPath);
    return { pdf };
  } catch (error) {
    return { error: error.message || 'Failed to compile LaTeX', log: error.stack || '' };
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
