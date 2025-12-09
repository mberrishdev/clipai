export type ContentType = 'json' | 'url' | 'email' | 'color' | 'base64' | 'text';

export interface DetectedContent {
  type: ContentType;
  formatted?: string;
  original: string;
}

export function detectContentType(text: string): DetectedContent {
  const trimmed = text.trim();

  if (isJSON(trimmed)) {
    return {
      type: 'json',
      formatted: formatJSON(trimmed),
      original: text,
    };
  }

  if (isURL(trimmed)) {
    return { type: 'url', original: text };
  }

  if (isEmail(trimmed)) {
    return { type: 'email', original: text };
  }

  if (isColor(trimmed)) {
    return { type: 'color', original: text };
  }

  if (isBase64(trimmed)) {
    return { type: 'base64', original: text };
  }

  return { type: 'text', original: text };
}

function isJSON(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return false;
  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
}

function formatJSON(text: string): string {
  try {
    const parsed = JSON.parse(text.trim());
    return JSON.stringify(parsed, null, 2);
  } catch {
    return text;
  }
}

function isURL(text: string): boolean {
  try {
    new URL(text);
    return true;
  } catch {
    return false;
  }
}

function isEmail(text: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(text);
}

function isColor(text: string): boolean {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[A-Fa-f0-9]{8})$/;
  const rgbRegex = /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/;
  const rgbaRegex = /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*[\d.]+\s*\)$/;

  return hexRegex.test(text) || rgbRegex.test(text) || rgbaRegex.test(text);
}

function isBase64(text: string): boolean {
  if (text.length < 20) return false;
  const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
  return base64Regex.test(text) && text.length % 4 === 0;
}
