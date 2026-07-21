/**
 * Offscreen GIF encoder for the gif_creator browser tool.
 *
 * gif.js needs Web Workers and a DOM canvas, and MV3 service workers have
 * neither, so background.js keeps only the frame store and forwards encoding
 * here (mirroring the Claude extension's offscreen-document split). Frames
 * arrive as data URLs with per-action metadata; overlays are drawn onto each
 * frame before encoding.
 */

const FRAME_DELAY_MS = {
  wait: 300, screenshot: 300,
  navigate: 800, scroll: 800, scroll_to: 800, type: 800, key: 800,
  left_click: 1500, right_click: 1500, double_click: 1500, triple_click: 1500, left_click_drag: 1500,
};

function frameDelay(actionType) {
  return FRAME_DELAY_MS[actionType] ?? 800;
}

function actionLabel(meta = {}) {
  const type = String(meta.type || '');
  const text = String(meta.text || '').replace(/\s+/g, ' ').trim();
  const clipped = text.length > 40 ? `${text.slice(0, 40)}…` : text;
  switch (type) {
    case 'left_click': return 'Click';
    case 'double_click': return 'Double-click';
    case 'triple_click': return 'Triple-click';
    case 'right_click': return 'Right-click';
    case 'left_click_drag': return 'Drag';
    case 'mouse_move': case 'hover': return 'Hover';
    case 'scroll': case 'scroll_to': return 'Scroll';
    case 'type': return clipped ? `Type: ${clipped}` : 'Type';
    case 'key': return clipped ? `Press ${clipped}` : 'Key press';
    case 'navigate': return clipped ? `Navigate: ${clipped}` : 'Navigate';
    case 'screenshot': return 'Screenshot';
    case 'wait': return 'Wait';
    default: return clipped ? `${type || 'Action'}: ${clipped}` : (type || 'Action');
  }
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawOverlays(ctx, frame, index, total, options, width, height) {
  const meta = frame.meta || {};
  // captureVisibleTab renders at device-pixel scale while action coordinates
  // are CSS viewport pixels; the recorder stores the tab's CSS viewport size.
  const scaleX = meta.viewportWidth > 0 ? width / meta.viewportWidth : 1;
  const scaleY = meta.viewportHeight > 0 ? height / meta.viewportHeight : 1;

  const isClick = ['left_click', 'double_click', 'triple_click', 'right_click'].includes(meta.type);
  if (options.showClickIndicators && isClick && Number.isFinite(meta.x) && Number.isFinite(meta.y)) {
    const x = meta.x * scaleX;
    const y = meta.y * scaleY;
    ctx.save();
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.95)';
    ctx.fillStyle = 'rgba(249, 115, 22, 0.25)';
    ctx.lineWidth = Math.max(2, 3 * scaleX);
    ctx.beginPath();
    ctx.arc(x, y, 16 * scaleX, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 4 * scaleX, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(249, 115, 22, 0.95)';
    ctx.fill();
    ctx.restore();
  }

  if (options.showDragPaths && meta.type === 'left_click_drag'
      && Number.isFinite(meta.x) && Number.isFinite(meta.y)
      && Number.isFinite(meta.endX) && Number.isFinite(meta.endY)) {
    const fromX = meta.x * scaleX, fromY = meta.y * scaleY;
    const toX = meta.endX * scaleX, toY = meta.endY * scaleY;
    ctx.save();
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.9)';
    ctx.fillStyle = 'rgba(220, 38, 38, 0.9)';
    ctx.lineWidth = Math.max(2, 3 * scaleX);
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const head = 12 * scaleX;
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - head * Math.cos(angle - Math.PI / 6), toY - head * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - head * Math.cos(angle + Math.PI / 6), toY - head * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  const fontSize = Math.max(12, Math.round(14 * scaleX));
  if (options.showActionLabels) {
    const label = actionLabel(meta);
    ctx.save();
    ctx.font = `${fontSize}px system-ui, sans-serif`;
    const padding = Math.round(fontSize * 0.6);
    const textWidth = ctx.measureText(label).width;
    const boxHeight = fontSize + padding * 2;
    const y = height - boxHeight - Math.round(10 * scaleY);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    drawRoundedRect(ctx, Math.round(10 * scaleX), y, textWidth + padding * 2, boxHeight, Math.round(6 * scaleX));
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, Math.round(10 * scaleX) + padding, y + boxHeight / 2);
    ctx.restore();
  }

  if (options.showWatermark) {
    ctx.save();
    ctx.font = `${fontSize}px system-ui, sans-serif`;
    ctx.textBaseline = 'middle';
    const label = 'GoApply';
    const textWidth = ctx.measureText(label).width;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillText(label, width - textWidth - Math.round(11 * scaleX), height - Math.round(19 * scaleY) + 1);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText(label, width - textWidth - Math.round(12 * scaleX), height - Math.round(20 * scaleY));
    ctx.restore();
  }

  if (options.showProgressBar) {
    const barHeight = Math.max(3, Math.round(4 * scaleY));
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(0, height - barHeight, width, barHeight);
    ctx.fillStyle = 'rgba(249, 115, 22, 0.95)';
    ctx.fillRect(0, height - barHeight, width * ((index + 1) / total), barHeight);
    ctx.restore();
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read encoded GIF.'));
    reader.readAsDataURL(blob);
  });
}

async function encodeGif(frames, requestedOptions = {}) {
  if (!frames?.length) throw new Error('There are no recorded frames to encode.');
  const options = {
    showClickIndicators: true,
    showDragPaths: true,
    showActionLabels: true,
    showProgressBar: true,
    showWatermark: true,
    quality: 10,
    ...requestedOptions,
  };
  const bitmaps = await Promise.all(frames.map(async (frame) => {
    const blob = await fetch(frame.dataUrl).then((response) => response.blob());
    return createImageBitmap(blob);
  }));
  const width = bitmaps[0].width;
  const height = bitmaps[0].height;
  const gif = new GIF({
    workers: 2,
    quality: Math.max(1, Math.min(30, Number(options.quality) || 10)),
    width,
    height,
    workerScript: 'vendor/gif/gif.worker.js',
  });
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  frames.forEach((frame, index) => {
    ctx.drawImage(bitmaps[index], 0, 0, width, height);
    drawOverlays(ctx, frame, index, frames.length, options, width, height);
    gif.addFrame(ctx, { copy: true, delay: frameDelay(frame.meta?.type) });
  });
  bitmaps.forEach((bitmap) => bitmap.close());
  const blob = await new Promise((resolve, reject) => {
    gif.on('finished', resolve);
    gif.on('abort', () => reject(new Error('GIF encoding was aborted.')));
    gif.render();
  });
  return {
    dataUrl: await blobToDataUrl(blob),
    sizeBytes: blob.size,
    width,
    height,
    frameCount: frames.length,
  };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.target !== 'goapply-offscreen' || message.action !== 'encode-gif') return false;
  encodeGif(message.frames, message.options)
    .then((result) => sendResponse({ ok: true, ...result }))
    .catch((error) => sendResponse({ ok: false, error: error.message }));
  return true;
});
