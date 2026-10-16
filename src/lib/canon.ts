/** Canonical book list (Protestant 66-book order) with the abbreviations every Ref must use. */
export const BOOKS: { abbr: string; name: string; testament: 'OT' | 'NT' }[] = [
  ['Gen', 'Genesis'], ['Exod', 'Exodus'], ['Lev', 'Leviticus'], ['Num', 'Numbers'], ['Deut', 'Deuteronomy'],
  ['Josh', 'Joshua'], ['Judg', 'Judges'], ['Ruth', 'Ruth'], ['1 Sam', '1 Samuel'], ['2 Sam', '2 Samuel'],
  ['1 Kgs', '1 Kings'], ['2 Kgs', '2 Kings'], ['1 Chr', '1 Chronicles'], ['2 Chr', '2 Chronicles'], ['Ezra', 'Ezra'],
  ['Neh', 'Nehemiah'], ['Esth', 'Esther'], ['Job', 'Job'], ['Ps', 'Psalms'], ['Prov', 'Proverbs'],
  ['Eccl', 'Ecclesiastes'], ['Song', 'Song of Songs'], ['Isa', 'Isaiah'], ['Jer', 'Jeremiah'], ['Lam', 'Lamentations'],
  ['Ezek', 'Ezekiel'], ['Dan', 'Daniel'], ['Hos', 'Hosea'], ['Joel', 'Joel'], ['Amos', 'Amos'],
  ['Obad', 'Obadiah'], ['Jonah', 'Jonah'], ['Mic', 'Micah'], ['Nah', 'Nahum'], ['Hab', 'Habakkuk'],
  ['Zeph', 'Zephaniah'], ['Hag', 'Haggai'], ['Zech', 'Zechariah'], ['Mal', 'Malachi'],
  ['Matt', 'Matthew'], ['Mark', 'Mark'], ['Luke', 'Luke'], ['John', 'John'], ['Acts', 'Acts'],
  ['Rom', 'Romans'], ['1 Cor', '1 Corinthians'], ['2 Cor', '2 Corinthians'], ['Gal', 'Galatians'], ['Eph', 'Ephesians'],
  ['Phil', 'Philippians'], ['Col', 'Colossians'], ['1 Thess', '1 Thessalonians'], ['2 Thess', '2 Thessalonians'], ['1 Tim', '1 Timothy'],
  ['2 Tim', '2 Timothy'], ['Titus', 'Titus'], ['Phlm', 'Philemon'], ['Heb', 'Hebrews'], ['Jas', 'James'],
  ['1 Pet', '1 Peter'], ['2 Pet', '2 Peter'], ['1 John', '1 John'], ['2 John', '2 John'], ['3 John', '3 John'],
  ['Jude', 'Jude'], ['Rev', 'Revelation'],
].map(([abbr, name], i) => ({ abbr, name, testament: i < 39 ? 'OT' : 'NT' }));

export const BOOK_INDEX: Record<string, number> = Object.fromEntries(BOOKS.map((b, i) => [b.abbr, i]));
