// Captured live from api.alquran.cloud (quran-uthmani edition) — these are
// the exact wire strings, NOT NFC-normalized. The strip regressed once
// because a constant was built from normalized text; this test pins the
// wire byte order (shadda-before-fatha) and the surah 95 extra-shadda
// variant so it cannot silently regress again.
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn(), getAllKeys: jest.fn(), multiRemove: jest.fn() },
}));

import { stripEmbeddedBismillah } from '../quran';

const WIRE_1_1 = '\ufeff\u0628\u0650\u0633\u0652\u0645\u0650 \u0671\u0644\u0644\u0651\u064e\u0647\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0652\u0645\u064e\u0670\u0646\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650';
const WIRE_2_1 = '\u0628\u0650\u0633\u0652\u0645\u0650 \u0671\u0644\u0644\u0651\u064e\u0647\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0652\u0645\u064e\u0670\u0646\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650 \u0627\u0644\u0653\u0645\u0653';
const WIRE_9_1 = '\u0628\u064e\u0631\u064e\u0627\u0653\u0621\u064e\u0629\u064c\u06ed \u0645\u0651\u0650\u0646\u064e \u0671\u0644\u0644\u0651\u064e\u0647\u0650 \u0648\u064e\u0631\u064e\u0633\u064f\u0648\u0644\u0650\u0647\u0650\u06e6\u0653 \u0625\u0650\u0644\u064e\u0649 \u0671\u0644\u0651\u064e\u0630\u0650\u064a\u0646\u064e \u0639\u064e\u0670\u0647\u064e\u062f\u062a\u0651\u064f\u0645 \u0645\u0651\u0650\u0646\u064e \u0671\u0644\u0652\u0645\u064f\u0634\u0652\u0631\u0650\u0643\u0650\u064a\u0646\u064e';
const WIRE_95_1 = '\u0628\u0651\u0650\u0633\u0652\u0645\u0650 \u0671\u0644\u0644\u0651\u064e\u0647\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0652\u0645\u064e\u0670\u0646\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650 \u0648\u064e\u0671\u0644\u062a\u0651\u0650\u064a\u0646\u0650 \u0648\u064e\u0671\u0644\u0632\u0651\u064e\u064a\u0652\u062a\u064f\u0648\u0646\u0650';

describe('stripEmbeddedBismillah', () => {
  it('strips the embedded Bismillah from 2:1 (wire mark order)', () => {
    const out = stripEmbeddedBismillah(WIRE_2_1, 2, 0);
    expect(out.length).toBeLessThan(WIRE_2_1.length);
    expect(out).not.toMatch(/\u0628[\u064B-\u065F]*\u0633/); // no leading bismillah
    expect(out.startsWith('\u0627\u0644')).toBe(true); // alif-lam of Alif-Lam-Mim
  });

  it('strips the extra-shadda variant in 95:1', () => {
    const out = stripEmbeddedBismillah(WIRE_95_1, 95, 0);
    expect(out.length).toBeLessThan(WIRE_95_1.length);
    expect(out.startsWith('\u0648')).toBe(true); // waw of wat-teen
  });

  it('keeps 1:1 intact (the whole ayah IS the Bismillah) but drops its BOM', () => {
    const out = stripEmbeddedBismillah(WIRE_1_1, 1, 0);
    expect(out).toBe(WIRE_1_1.replace(/^\uFEFF/, ''));
    expect(out.length).toBeGreaterThan(30);
  });

  it('leaves 9:1 untouched (no Bismillah in At-Tawbah)', () => {
    expect(stripEmbeddedBismillah(WIRE_9_1, 9, 0)).toBe(WIRE_9_1);
  });

  it('never touches ayahs other than the first', () => {
    expect(stripEmbeddedBismillah(WIRE_2_1, 2, 1)).toBe(WIRE_2_1);
  });
});
