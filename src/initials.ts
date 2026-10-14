// Warns when a full name's initials spell something a kid would get teased about.

const FLAGGED = new Set([
  'ASS', 'BUM', 'BUT', 'COW', 'DIE', 'DUD', 'DUM', 'FAT', 'FUK', 'FUC', 'GAG', 'HAG', 'HOE', 'KKK', 'LOL', 'MAD',
  'PEE', 'PIG', 'PMS', 'POO', 'POS', 'PUS', 'RAT', 'SAD', 'SEX', 'SOB', 'STD', 'SUX', 'TIT', 'WTF', 'VD', 'BS',
  'OMG', 'IUD', 'FML', 'DUI', 'BRA', 'WAD', 'BOO', 'NUT', 'APE', 'DOG', 'HOG', 'ICK', 'BAD', 'FAG', 'GAY',
]);

export function initialsOf(first: string, middle: string, last: string): string {
  return [first, middle, last]
    .map((p) => p.trim()[0] ?? '')
    .join('')
    .toUpperCase();
}

/** The initials, and whether they (or the first + last pair) spell something unfortunate. */
export function checkInitials(first: string, middle: string, last: string) {
  const all = initialsOf(first, middle, last);
  const flagged = FLAGGED.has(all) || (middle.trim() !== '' && FLAGGED.has(initialsOf(first, '', last)));
  return { initials: all.split('').join('.') + '.', flagged };
}
