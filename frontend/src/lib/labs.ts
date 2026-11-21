export interface LabsPreferences {
  /** A detected call that uses the mic or camera starts recording without the consent prompt. */
  meetingAutoStart: boolean;
  /** A recording started for a detected call (from the prompt or automatically) stops and saves when the call ends. */
  meetingAutoStop: boolean;
  transcriptScrubbing: boolean;
  voiceProfiles: boolean;
  whisperSilenceGuard: boolean;
  cleanTranscript: boolean;
  parakeetGpu: boolean;
}

export const defaultLabsPreferences: LabsPreferences = {
  meetingAutoStart: false,
  meetingAutoStop: false,
  transcriptScrubbing: false,
  voiceProfiles: false,
  whisperSilenceGuard: false,
  cleanTranscript: false,
  parakeetGpu: false,
};

const key = 'meetily-labs-v1';
export const LABS_CHANGED_EVENT = 'meetily-labs-changed';

export function loadLabsPreferences(): LabsPreferences {
  if (typeof window === 'undefined') return defaultLabsPreferences;
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '{}');
    // "Meeting automation" used to be one switch for both; it seeds each half
    // until that half is saved on its own.
    if (typeof saved.meetingAutomation === 'boolean') {
      saved.meetingAutoStart ??= saved.meetingAutomation;
      saved.meetingAutoStop ??= saved.meetingAutomation;
    }
    return Object.fromEntries(
      Object.entries(defaultLabsPreferences).map(([name, fallback]) =>
        [name, typeof saved[name] === 'boolean' ? saved[name] : fallback],
      ),
    ) as unknown as LabsPreferences;
  } catch {
    return defaultLabsPreferences;
  }
}

export function saveLabsPreferences(value: LabsPreferences): void {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(LABS_CHANGED_EVENT));
}

// Only display text is changed. Persisted transcription and turn timestamps stay verbatim.
export function cleanTranscriptText(text: string): string {
  const cleaned = text
    .replace(/\b(?:uh+|um+|erm|er)\b[,\s]*/gi, '')
    .replace(/\b([\p{L}\p{N}]+)(?:\s+\1)\b/giu, (pair, word: string) =>
      ['no', 'yes', 'very', 'never'].includes(word.toLowerCase()) ? pair : word)
    .replace(/\s+([,.!?;:])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.replace(/^\p{Ll}/u, (letter) => letter.toUpperCase());
}
