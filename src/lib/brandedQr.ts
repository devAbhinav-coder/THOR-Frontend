/** Build a large branded QR card (logo + The House of Rani) for download / share / print. */

const LOGO_CANDIDATES = ['/logoNew.png', '/logo.png'];

export type BrandedQrOptions = {
  title?: string;
  subtitle?: string;
  footer?: string;
};

export async function buildBrandedQrDataUrl(
  targetUrl: string,
  opts?: BrandedQrOptions,
): Promise<string> {
  const title = opts?.title || 'The House of Rani';
  const subtitle = opts?.subtitle || 'Scan to share your experience';
  const footer = opts?.footer || 'Secure link · No login required';

  const QRCode = (await import('qrcode')).default;

  const qrDataUrl = await QRCode.toDataURL(targetUrl, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 520,
    color: { dark: '#0b1220', light: '#ffffff' },
  });

  if (typeof document === 'undefined') return qrDataUrl;

  const W = 720;
  const H = 960;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return qrDataUrl;

  // Soft ivory / navy frame
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0f172a');
  bg.addColorStop(0.55, '#1a2744');
  bg.addColorStop(1, '#3d2a1c');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Gold thin border
  ctx.strokeStyle = 'rgba(197, 160, 89, 0.55)';
  ctx.lineWidth = 2;
  roundRect(ctx, 22, 22, W - 44, H - 44, 28);
  ctx.stroke();

  // White card
  ctx.fillStyle = '#fffdf8';
  roundRect(ctx, 48, 48, W - 96, H - 96, 24);
  ctx.fill();

  // Logo
  let logoDrawn = false;
  for (const src of LOGO_CANDIDATES) {
    try {
      const logo = await loadImage(absoluteAsset(src));
      const maxLogoW = 200;
      const maxLogoH = 88;
      const scale = Math.min(maxLogoW / logo.width, maxLogoH / logo.height, 1);
      const lw = logo.width * scale;
      const lh = logo.height * scale;
      ctx.drawImage(logo, (W - lw) / 2, 78, lw, lh);
      logoDrawn = true;
      break;
    } catch {
      /* try next */
    }
  }

  const titleY = logoDrawn ? 200 : 120;
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.font = '600 36px Georgia, "Times New Roman", serif';
  ctx.fillText(title, W / 2, titleY);

  // Gold rule
  ctx.strokeStyle = '#c5a059';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 56, titleY + 16);
  ctx.lineTo(W / 2 + 56, titleY + 16);
  ctx.stroke();

  ctx.fillStyle = '#6b7280';
  ctx.font = '500 16px system-ui, -apple-system, sans-serif';
  wrapCenteredText(ctx, subtitle, W / 2, titleY + 48, W - 160, 22);

  // QR block with soft shadow plate
  const qrImg = await loadImage(qrDataUrl);
  const qrSize = 460;
  const qrX = (W - qrSize) / 2;
  const qrY = titleY + 90;

  ctx.fillStyle = '#ffffff';
  roundRect(ctx, qrX - 18, qrY - 18, qrSize + 36, qrSize + 36, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.08)';
  ctx.lineWidth = 1;
  roundRect(ctx, qrX - 18, qrY - 18, qrSize + 36, qrSize + 36, 20);
  ctx.stroke();

  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '400 14px system-ui, -apple-system, sans-serif';
  ctx.fillText(footer, W / 2, H - 78);

  return canvas.toDataURL('image/png', 0.95);
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** WhatsApp / native share for link (+ optional QR image). */
export async function shareInvite(opts: {
  url: string;
  title?: string;
  text?: string;
  qrDataUrl?: string | null;
  filename?: string;
}): Promise<'native' | 'whatsapp' | 'copied'> {
  const title = opts.title || 'The House of Rani';
  const text =
    opts.text ||
    `You're invited to share your House of Rani experience:\n${opts.url}`;

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      const files: File[] = [];
      if (opts.qrDataUrl) {
        const file = await dataUrlToFile(
          opts.qrDataUrl,
          opts.filename || 'house-of-rani-qr.png',
        );
        if (file && navigator.canShare?.({ files: [file] })) {
          files.push(file);
        }
      }
      if (files.length) {
        await navigator.share({ title, text, url: opts.url, files });
      } else {
        await navigator.share({ title, text, url: opts.url });
      }
      return 'native';
    } catch (err) {
      // User cancelled or share failed — fall through
      if ((err as { name?: string })?.name === 'AbortError') throw err;
    }
  }

  const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(wa, '_blank', 'noopener,noreferrer');
  return 'whatsapp';
}

async function dataUrlToFile(dataUrl: string, filename: string): Promise<File | null> {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || 'image/png' });
  } catch {
    return null;
  }
}

function absoluteAsset(path: string): string {
  if (typeof window === 'undefined') return path;
  return new URL(path, window.location.origin).href;
}

function wrapCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(/\s+/);
  let line = '';
  let yy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load image: ${src}`));
    img.src = src;
  });
}
