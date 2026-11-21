// Run with: pnpm dlx bun@1.3.10 test tests/lib/labs-preferences.test.ts
import { beforeEach, describe, expect, test } from 'bun:test';

const store = new Map<string, string>();
Object.assign(globalThis, {
  localStorage: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, String(value)),
    removeItem: (key: string) => void store.delete(key),
  },
  window: { dispatchEvent: () => true },
});

const { loadLabsPreferences, saveLabsPreferences } = await import('../../src/lib/labs');

/** Writes raw saved preferences under whatever key labs.ts uses. */
function saved(value: Record<string, unknown>) {
  store.clear();
  saveLabsPreferences(loadLabsPreferences());
  const [key] = [...store.keys()];
  store.set(key, JSON.stringify(value));
}

describe('meeting automation is two settings', () => {
  beforeEach(() => store.clear());

  test('starting without the prompt and stopping at call end are both off by default', () => {
    const labs = loadLabsPreferences();
    expect(labs.meetingAutoStart).toBe(false);
    expect(labs.meetingAutoStop).toBe(false);
  });

  test('each setting is saved on its own', () => {
    saveLabsPreferences({ ...loadLabsPreferences(), meetingAutoStop: true });
    const labs = loadLabsPreferences();
    expect(labs.meetingAutoStop).toBe(true);
    expect(labs.meetingAutoStart).toBe(false);
  });

  test('the old single switch turns on both', () => {
    saved({ meetingAutomation: true });
    const labs = loadLabsPreferences();
    expect(labs.meetingAutoStart).toBe(true);
    expect(labs.meetingAutoStop).toBe(true);
  });

  test('a saved new setting wins over the old switch', () => {
    saved({ meetingAutomation: true, meetingAutoStart: false });
    const labs = loadLabsPreferences();
    expect(labs.meetingAutoStart).toBe(false);
    expect(labs.meetingAutoStop).toBe(true);
  });

  test('the old switch is not kept as a preference', () => {
    expect('meetingAutomation' in loadLabsPreferences()).toBe(false);
  });
});
