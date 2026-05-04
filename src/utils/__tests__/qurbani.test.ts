import {
  animalsNeededFor,
  isQurbaniWindow,
  isDontCutWindow,
  isTakbirWindow,
} from '../qurbani';
import { QURBANI_ANIMALS } from '../../constants/qurbani';

const goat    = QURBANI_ANIMALS.find((a) => a.key === 'goat')!;
const sheep   = QURBANI_ANIMALS.find((a) => a.key === 'sheep')!;
const cow     = QURBANI_ANIMALS.find((a) => a.key === 'cow')!;
const buffalo = QURBANI_ANIMALS.find((a) => a.key === 'buffalo')!;
const camel   = QURBANI_ANIMALS.find((a) => a.key === 'camel')!;

describe('animalsNeededFor', () => {
  test('1 person on a goat → 1 goat', () => {
    expect(animalsNeededFor(goat, 1)).toBe(1);
  });

  test('5 people on goats → 5 goats (1 share each)', () => {
    expect(animalsNeededFor(goat, 5)).toBe(5);
  });

  test('1 person on sheep → 1 sheep (sheep also 1-share)', () => {
    expect(animalsNeededFor(sheep, 1)).toBe(1);
  });

  test('7 people share 1 cow exactly', () => {
    expect(animalsNeededFor(cow, 7)).toBe(1);
  });

  test('8 people on cows → 2 cows (Math.ceil — never 1.14)', () => {
    expect(animalsNeededFor(cow, 8)).toBe(2);
  });

  test('14 people on cows → exactly 2 cows', () => {
    expect(animalsNeededFor(cow, 14)).toBe(2);
  });

  test('15 people on buffalo → 3 buffalo', () => {
    expect(animalsNeededFor(buffalo, 15)).toBe(3);
  });

  test('14 people on camels → exactly 2 camels', () => {
    expect(animalsNeededFor(camel, 14)).toBe(2);
  });

  test('zero / negative people clamps to 1 animal — never returns 0', () => {
    expect(animalsNeededFor(cow, 0)).toBe(1);
    expect(animalsNeededFor(cow, -3)).toBe(1);
  });

  test('fractional people input is floored', () => {
    expect(animalsNeededFor(cow, 7.6)).toBe(1);
    expect(animalsNeededFor(cow, 8.2)).toBe(2);
  });
});

describe('isQurbaniWindow (Eid days 10–13 Dhul Hijjah)', () => {
  test('9th Dhul Hijjah (Arafah) — NOT yet open', () => {
    expect(isQurbaniWindow(12, 9)).toBe(false);
  });

  test('10th Dhul Hijjah (Eid day) — open', () => {
    expect(isQurbaniWindow(12, 10)).toBe(true);
  });

  test('13th Dhul Hijjah — last day, still open', () => {
    expect(isQurbaniWindow(12, 13)).toBe(true);
  });

  test('14th Dhul Hijjah — closed', () => {
    expect(isQurbaniWindow(12, 14)).toBe(false);
  });

  test('Ramadan (month 9) → never qurbani', () => {
    expect(isQurbaniWindow(9, 10)).toBe(false);
  });
});

describe('isDontCutWindow (1–10 Dhul Hijjah)', () => {
  test('1st Dhul Hijjah — applies', () => {
    expect(isDontCutWindow(12, 1)).toBe(true);
  });

  test('10th Dhul Hijjah (Eid day) — last day applies', () => {
    expect(isDontCutWindow(12, 10)).toBe(true);
  });

  test('11th onwards — does NOT apply', () => {
    expect(isDontCutWindow(12, 11)).toBe(false);
  });

  test('30th Dhul Qa\'dah — does not apply (wrong month)', () => {
    expect(isDontCutWindow(11, 30)).toBe(false);
  });
});

describe('isTakbirWindow (Fajr 9 → Asr 13 Dhul Hijjah)', () => {
  test('9th Dhul Hijjah — open (Day of Arafah)', () => {
    expect(isTakbirWindow(12, 9)).toBe(true);
  });

  test('13th Dhul Hijjah — last day, open', () => {
    expect(isTakbirWindow(12, 13)).toBe(true);
  });

  test('8th Dhul Hijjah — not yet', () => {
    expect(isTakbirWindow(12, 8)).toBe(false);
  });

  test('14th Dhul Hijjah — closed', () => {
    expect(isTakbirWindow(12, 14)).toBe(false);
  });
});
