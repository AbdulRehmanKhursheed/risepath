// Madinah-Mushaf juz (para) starting pages in the standard 604-page King Fahd
// Complex layout. The only juz data we keep — used to route "para 13" smart
// search jumps to the right Mushaf page. No Juz browse UI; Para is a search
// shortcut, not a feature.
// Verified against api.quran.com/v4 (page_number of each juz's first verse).
export const JUZ_START_PAGE: Record<number, number> = {
  1: 1,    2: 22,   3: 42,   4: 62,   5: 82,
  6: 102,  7: 121,  8: 142,  9: 162,  10: 182,
  11: 201, 12: 222, 13: 242, 14: 262, 15: 282,
  16: 302, 17: 322, 18: 342, 19: 362, 20: 382,
  21: 402, 22: 422, 23: 442, 24: 462, 25: 482,
  26: 502, 27: 522, 28: 542, 29: 562, 30: 582,
};
