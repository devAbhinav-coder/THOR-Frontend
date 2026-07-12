"use client";

export type VoiceSessionStatus = "idle" | "starting" | "listening" | "error";

export type VoiceSessionState = {
  active: boolean;
  status: VoiceSessionStatus;
  statusMessage: string | null;
  interimTranscript: string;
};

type SpeechRecognitionAlternative = { transcript: string; confidence: number };
type SpeechRecognitionResult = {
  [index: number]: SpeechRecognitionAlternative;
  length: number;
  isFinal: boolean;
};
type SpeechRecognitionResultList = {
  [index: number]: SpeechRecognitionResult;
  length: number;
};
type SpeechRecognitionEventLike = Event & {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};
type SpeechRecognitionErrorEventLike = Event & { error: string };
type SpeechRecognitionLike = EventTarget & {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort?(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onstart?: (() => void) | null;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

/** Max mic session length */
const SESSION_MS = 15000;
/** Wait for a pause after the user stops speaking before searching */
const SILENCE_FINALIZE_MS = 1400;

const SPOKEN_ONES: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
};

const SPOKEN_TENS: Record<string, number> = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

function spokenWordsToNumber(words: string): number | null {
  const parts = words.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!parts.length) return null;

  if (parts.length === 1 && parts[0]! in SPOKEN_ONES) {
    return SPOKEN_ONES[parts[0]!]!;
  }

  let total = 0;
  let current = 0;
  for (const part of parts) {
    if (part in SPOKEN_ONES) {
      current += SPOKEN_ONES[part]!;
      continue;
    }
    if (part in SPOKEN_TENS) {
      current += SPOKEN_TENS[part]!;
      continue;
    }
    if (part === "hundred") {
      current = (current || 1) * 100;
      continue;
    }
    if (part === "thousand") {
      current = (current || 1) * 1000;
      total += current;
      current = 0;
      continue;
    }
    return null;
  }
  return total + current;
}

/**
 * Fix common Indian-English speech-to-text mistakes for shopping queries.
 * e.g. "saree and 5000" → "saree under 5000", "five thousand" → "5000"
 */
export function normalizeVoiceSearchTranscript(raw: string): string {
  let text = raw
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/[₹]/g, " ")
    .replace(/\b(?:rupees?|rs\.?|inr)\b/gi, " ")
    .replace(/\s+/g, " ");

  // "saree and 5000" / "on 5000" often means budget cap
  text = text.replace(
    /\b(?:and|on|in|below|upto|up to)\s+(\d[\d,]*)\b/gi,
    "under $1",
  );

  text = text.replace(
    /\b(?:under|below|over|above|less than|more than|greater than)\s+([\w\s-]+?)\s+(thousand|hundred)\b/gi,
    (_, spoken, unit) => {
      const n = spokenWordsToNumber(spoken);
      if (n === null) return `${_} ${unit}`;
      const mult = unit.toLowerCase() === "thousand" ? 1000 : 100;
      return `under ${n * mult}`;
    },
  );

  text = text.replace(
    /\b([\w\s-]+?)\s+(thousand|hundred)\b/gi,
    (match, spoken, unit) => {
      if (/^(under|below|over|above|less|more|greater)/i.test(match)) {
        return match;
      }
      const n = spokenWordsToNumber(spoken);
      if (n === null) return match;
      const mult = unit.toLowerCase() === "thousand" ? 1000 : 100;
      return String(n * mult);
    },
  );

  // Common fashion mishears
  text = text
    .replace(/\bsari\b/g, "saree")
    .replace(/\bshalwar\b/g, "salwar")
    .replace(/\bslawar\b/g, "salwar")
    .replace(/\bslwar\b/g, "salwar");

  return text.replace(/\s+/g, " ").trim();
}

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isVoiceSearchSupported(): boolean {
  return Boolean(getSpeechRecognitionCtor());
}

export type SessionCallbacks = {
  onResult: (transcript: string) => void;
  onError?: (message: string) => void;
};

let state: VoiceSessionState = {
  active: false,
  status: "idle",
  statusMessage: null,
  interimTranscript: "",
};

const listeners = new Set<() => void>();

let recognition: SpeechRecognitionLike | null = null;
let sessionTimer: number | null = null;
let silenceTimer: number | null = null;
let finalTranscript = "";
let interimTranscript = "";
let gotResult = false;
let sessionEnded = false;
let callbacks: SessionCallbacks | null = null;
let lastCallbacks: SessionCallbacks | null = null;
let lastLang = "en-IN";
let startedAt = 0;

function emit() {
  listeners.forEach((l) => l());
}

function setState(patch: Partial<VoiceSessionState>) {
  state = { ...state, ...patch };
  emit();
}

function clearSessionTimer() {
  if (sessionTimer !== null) {
    window.clearTimeout(sessionTimer);
    sessionTimer = null;
  }
}

function clearSilenceTimer() {
  if (silenceTimer !== null) {
    window.clearTimeout(silenceTimer);
    silenceTimer = null;
  }
}

function clearAllTimers() {
  clearSessionTimer();
  clearSilenceTimer();
}

function getCombinedTranscript(): string {
  return `${finalTranscript}${interimTranscript}`.replace(/\s+/g, " ").trim();
}

function teardownRecognition() {
  const instance = recognition;
  recognition = null;
  if (!instance) return;
  instance.onend = null;
  instance.onresult = null;
  instance.onerror = null;
  try {
    instance.abort?.();
  } catch {
    try {
      instance.stop();
    } catch {
      // ignore
    }
  }
}

function mapSpeechError(error: string): string {
  if (error === "not-allowed" || error === "service-not-allowed") {
    return "Mic blocked. Click the lock icon in the address bar → Microphone → Allow, then Try again.";
  }
  if (error === "audio-capture") {
    return "No microphone detected. Check Windows sound settings.";
  }
  if (error === "no-speech") {
    return "No speech heard. Speak louder and try again.";
  }
  if (error === "network") {
    return "Voice search needs internet (Chrome uses Google speech).";
  }
  return `Voice error (${error}). Try again or type below.`;
}

function fail(message: string) {
  if (sessionEnded || gotResult) return;
  sessionEnded = true;
  clearAllTimers();
  teardownRecognition();
  setState({
    active: true,
    status: "error",
    statusMessage: message,
  });
  callbacks?.onError?.(message);
}

function succeed(rawText: string) {
  const cleaned = normalizeVoiceSearchTranscript(rawText);
  if (!cleaned || gotResult) return;
  gotResult = true;
  sessionEnded = true;
  clearAllTimers();
  teardownRecognition();
  setState({
    active: false,
    status: "idle",
    statusMessage: null,
    interimTranscript: cleaned,
  });
  callbacks?.onResult(cleaned);
  callbacks = null;
}

function scheduleFinalizeAfterSilence() {
  clearSilenceTimer();
  silenceTimer = window.setTimeout(() => {
    if (sessionEnded || gotResult) return;
    const text = getCombinedTranscript();
    if (text.length >= 2) {
      succeed(text);
    }
  }, SILENCE_FINALIZE_MS);
}

function handleSpeechResult(event: SpeechRecognitionEventLike) {
  interimTranscript = "";

  for (let i = event.resultIndex; i < event.results.length; i++) {
    const result = event.results[i];
    const piece = result?.[0]?.transcript ?? "";
    if (!piece) continue;
    if (result.isFinal) {
      finalTranscript += piece;
    } else {
      interimTranscript += piece;
    }
  }

  const display = getCombinedTranscript();
  if (!display) return;

  setState({
    status: "listening",
    statusMessage: "Listening…",
    interimTranscript: display,
  });

  scheduleFinalizeAfterSilence();
}

function beginRecognition(Ctor: SpeechRecognitionCtor, lang: string) {
  const instance = new Ctor();
  instance.lang = lang;
  instance.interimResults = true;
  instance.continuous = true;
  instance.maxAlternatives = 1;

  instance.onstart = () => {
    startedAt = Date.now();
    setState({ status: "listening", statusMessage: "Speak now — e.g. red saree under 5000" });
  };

  instance.onresult = handleSpeechResult;

  instance.onerror = (event: SpeechRecognitionErrorEventLike) => {
    if (sessionEnded || gotResult) return;
    if (event.error === "aborted") return;

    // no-speech after partial transcript — use what we heard
    if (event.error === "no-speech") {
      const partial = getCombinedTranscript();
      if (partial.length >= 2) {
        succeed(partial);
        return;
      }
    }

    sessionEnded = true;
    clearAllTimers();
    teardownRecognition();
    setState({
      active: true,
      status: "error",
      statusMessage: mapSpeechError(event.error),
    });
    callbacks?.onError?.(mapSpeechError(event.error));
  };

  instance.onend = () => {
    if (sessionEnded || gotResult) return;

    const text = getCombinedTranscript();
    if (text.length >= 2) {
      succeed(text);
      return;
    }

    if (Date.now() - startedAt < 800) {
      sessionEnded = true;
      clearAllTimers();
      setState({
        active: true,
        status: "error",
        statusMessage:
          "Mic could not start. Use Chrome, allow mic for localhost, then Try again.",
      });
      return;
    }

    fail("Didn't catch that. Say the full phrase — e.g. saree under 5000.");
  };

  recognition = instance;
  startedAt = Date.now();

  sessionTimer = window.setTimeout(() => {
    if (sessionEnded || gotResult) return;
    const text = getCombinedTranscript();
    if (text.length >= 2) succeed(text);
    else fail("No speech heard. Try again or type below.");
  }, SESSION_MS);

  instance.start();
}

/** Request mic (shows Chrome prompt) then start speech — getUserMedia call is sync from click. */
function primeMicThenRecognize(Ctor: SpeechRecognitionCtor, lang: string) {
  const media = navigator.mediaDevices;
  if (!media?.getUserMedia) {
    beginRecognition(Ctor, lang);
    return;
  }

  setState({
    status: "starting",
    statusMessage: "Allow microphone when Chrome asks…",
  });

  media
    .getUserMedia({ audio: true })
    .then((stream) => {
      stream.getTracks().forEach((t) => t.stop());
      if (sessionEnded || gotResult) return;
      try {
        beginRecognition(Ctor, lang);
      } catch {
        try {
          beginRecognition(Ctor, lang === "en-IN" ? "en-US" : lang);
        } catch {
          fail("Could not start voice. Tap Try again.");
        }
      }
    })
    .catch((err: DOMException) => {
      if (sessionEnded) return;
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        fail(
          "Microphone denied. Click the lock icon → Microphone → Allow, then Try again.",
        );
      } else if (err.name === "NotFoundError") {
        fail("No microphone found. Check Windows sound settings.");
      } else {
        fail("Mic error. Try again or type below.");
      }
    });
}

/**
 * Must be called synchronously from a user click/tap (no await before this).
 */
export function startVoiceSearch(
  lang: string,
  sessionCallbacks: SessionCallbacks,
): void {
  lastLang = lang;
  lastCallbacks = sessionCallbacks;
  callbacks = sessionCallbacks;

  gotResult = false;
  sessionEnded = false;
  finalTranscript = "";
  interimTranscript = "";

  clearAllTimers();
  teardownRecognition();

  setState({
    active: true,
    status: "starting",
    statusMessage: "Starting… speak your full search",
    interimTranscript: "",
  });

  if (!window.isSecureContext) {
    fail("Voice search needs HTTPS or localhost.");
    return;
  }

  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) {
    fail("Use Chrome or Edge for voice search.");
    return;
  }

  try {
    primeMicThenRecognize(Ctor, lang);
  } catch {
    fail("Could not start mic. Tap Try again.");
  }
}

export function subscribeVoiceSearch(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getVoiceSearchSnapshot(): VoiceSessionState {
  return state;
}

export function getLastVoiceSearchCallbacks(): SessionCallbacks | null {
  return lastCallbacks;
}

export function getLastVoiceLang(): string {
  return lastLang;
}

export function stopVoiceSearch() {
  sessionEnded = true;
  gotResult = true;
  clearAllTimers();
  teardownRecognition();
  callbacks = null;
  setState({
    active: false,
    status: "idle",
    statusMessage: null,
    interimTranscript: "",
  });
}

export function submitTypedVoiceQuery(text: string) {
  const cleaned = normalizeVoiceSearchTranscript(text);
  if (!cleaned) return;
  stopVoiceSearch();
  lastCallbacks?.onResult(cleaned);
}
