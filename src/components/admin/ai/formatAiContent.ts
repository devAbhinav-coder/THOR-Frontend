/** Remove markdown artifacts so **bold** does not show literally. */
export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

/** Client-side fallback when API bullets are empty or one blob. */
export function parseDisplayBullets(text: string, bullets?: string[]): {
  intro: string;
  bullets: string[];
} {
  if (bullets && bullets.length > 0) {
    const intro = stripMarkdown(text.split('\n')[0]?.trim() || '');
    const onlyBullets = bullets.map(stripMarkdown).filter((b) => b.trim().length > 2);
    if (onlyBullets.length === bullets.length) {
      return { intro: intro.startsWith('•') ? '' : intro, bullets: onlyBullets };
    }
    return { intro: '', bullets: onlyBullets };
  }

  const normalized = stripMarkdown(text.replace(/\r\n/g, '\n'));
  if (!normalized) return { intro: '', bullets: [] };

  const lines = normalized.split('\n').map((l) => l.trim()).filter(Boolean);
  const parsedBullets: string[] = [];
  const introParts: string[] = [];

  for (const line of lines) {
    const m = line.match(/^(?:[-–—•*]|\d+[.)])\s+(.+)$/);
    if (m) {
      parsedBullets.push(m[1].trim());
    } else if (line.startsWith('•')) {
      parsedBullets.push(line.replace(/^•\s*/, '').trim());
    } else if (/\s•\s/.test(line)) {
      parsedBullets.push(
        ...line.split(/\s*•\s*/).map((p) => p.trim()).filter((p) => p.length > 2),
      );
    } else {
      introParts.push(line);
    }
  }

  if (parsedBullets.length > 0) {
    return { intro: introParts.join(' '), bullets: parsedBullets };
  }

  if (introParts.length === 1 && introParts[0].length > 80) {
    const sentences = introParts[0]
      .split(/(?<=[.!?।])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 8);
    if (sentences.length >= 2) {
      return { intro: sentences[0], bullets: sentences.slice(1, 8) };
    }
  }

  return { intro: introParts.join(' '), bullets: introParts.length > 1 ? introParts.slice(1) : [] };
}
