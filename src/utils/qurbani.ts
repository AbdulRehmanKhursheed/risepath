import type { QurbaniAnimal } from '../constants/qurbani';

// How many animals do we need for `people` shares of `animal`?
// Goats / sheep are 1-share animals → 1 animal per person.
// Cows / buffalo / camels are 7-share animals → 7 people share one.
// Always rounds up — 8 people on cows = 2 cows, never 1.14.
export function animalsNeededFor(animal: QurbaniAnimal, people: number): number {
  const safePeople = Math.max(1, Math.floor(people));
  return Math.max(1, Math.ceil(safePeople / animal.shares));
}

// Detects whether `today` is inside the qurbani slaughter window
// (10–13 Dhul Hijjah). Pure function over Hijri components so it can be
// unit-tested without time mocks.
export function isQurbaniWindow(hijriMonth: number, hijriDay: number): boolean {
  return hijriMonth === 12 && hijriDay >= 10 && hijriDay <= 13;
}

// "Don't cut hair / nails" applies from 1st Dhul Hijjah until the qurbani
// is performed (typically the 10th).
export function isDontCutWindow(hijriMonth: number, hijriDay: number): boolean {
  return hijriMonth === 12 && hijriDay >= 1 && hijriDay <= 10;
}

// Takbeer al-Tashreeq window: Fajr 9 → Asr 13 Dhul Hijjah.
export function isTakbirWindow(hijriMonth: number, hijriDay: number): boolean {
  return hijriMonth === 12 && hijriDay >= 9 && hijriDay <= 13;
}
