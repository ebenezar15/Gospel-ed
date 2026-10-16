import { z } from 'zod';

/* ---------- primitives ---------- */
export const Confidence = z.enum(['biblical', 'scholarly-consensus', 'debated', 'tradition', 'speculative', 'needs-verification']);
/** One passage: "Gen 12:1-3", "1 Sam 16", "Matt 5:3-7:29". Abbreviations from src/lib/canon.ts. */
export const Ref = z.string();
export const DateValue = z.object({
  year: z.number(), // negative = BC
  circa: z.boolean().optional(),
  confidence: Confidence,
  alternatives: z.array(z.object({ label: z.string(), year: z.number(), source: z.string().optional() })).optional(),
});
export const Source = z.object({
  author: z.string(), title: z.string(), year: z.number().optional(), locator: z.string().optional(),
  publicDomain: z.boolean().optional(), confidence: Confidence.optional(),
});
const RefNote = z.object({ name: z.string(), refs: z.array(Ref) });

/* ---------- people ---------- */
export const Person = z.object({
  id: z.string(),
  names: z.object({ primary: z.string(), original: z.string().optional(), meaning: z.string().optional(), aliases: z.array(z.string()) }),
  tier: z.enum(['major', 'secondary', 'minor']),
  testament: z.enum(['OT', 'NT', 'both']),
  eraIds: z.array(z.string()),
  born: DateValue.optional(), died: DateValue.optional(),
  active: z.tuple([DateValue, DateValue]).optional(),
  tribe: z.string().optional(), nation: z.string().optional(),
  placeIds: z.array(z.string()),
  family: z.object({ parents: z.array(z.string()), spouses: z.array(z.string()), children: z.array(z.string()), siblings: z.array(z.string()) }),
  roles: z.array(z.string()), occupations: z.array(z.string()),
  skills: z.array(RefNote), gifts: z.array(RefNote),
  events: z.array(z.object({ title: z.string(), year: z.number().optional(), placeId: z.string().optional(), refs: z.array(Ref), summary: z.string() })),
  journey: z.array(z.object({ placeId: z.string(), order: z.number(), year: z.number().optional(), note: z.string(), refs: z.array(Ref) })).optional(),
  summary: z.string(),
  textSays: z.string().optional(),      // what the text itself says
  interpretations: z.array(z.object({ tradition: z.string(), view: z.string() })).optional(),
  arc: z.object({ strengths: z.array(z.string()), failures: z.array(z.string()), turningPoints: z.array(z.string()) }).optional(),
  context: z.string().optional(),
  legacy: z.string().optional(),
  traditions: z.array(z.object({ text: z.string(), source: z.string(), confidence: z.literal('tradition') })).optional(),
  voice: z.string().optional(),         // short description of how this person speaks, for the "Interview" feature
  refs: z.array(Ref),
  books: z.array(z.string()).optional(), // book abbreviations where they appear
});

export const Relationship = z.object({
  from: z.string(), to: z.string(),
  type: z.enum(['family', 'mentor', 'ally', 'enemy', 'co-worker', 'confrontation', 'spouse', 'successor']),
  refs: z.array(Ref), note: z.string().optional(),
});

/* ---------- world ---------- */
export const Place = z.object({
  id: z.string(),
  names: z.array(z.object({ era: z.string(), name: z.string() })),
  coords: z.tuple([z.number(), z.number()]), // [lng, lat]
  coordConfidence: Confidence,
  type: z.enum(['city', 'region', 'mountain', 'water', 'wilderness', 'site']),
  refs: z.array(Ref),
  summary: z.string(),
  archaeology: z.string().optional(),
});
export const Era = z.object({ id: z.string(), name: z.string(), start: z.number(), end: z.number(), summary: z.string(), color: z.string() });
export const TimelineEvent = z.object({
  id: z.string(), title: z.string(), date: DateValue, track: z.enum(['israel', 'judah', 'empires', 'prophets', 'church', 'world']),
  eraId: z.string(), placeIds: z.array(z.string()), personIds: z.array(z.string()), refs: z.array(Ref), summary: z.string(),
});
export const Empire = z.object({ id: z.string(), name: z.string(), start: z.number(), end: z.number(), summary: z.string(), center: z.tuple([z.number(), z.number()]), radiusKm: z.number() });
export const Journey = z.object({
  id: z.string(), title: z.string(), personIds: z.array(z.string()), eraId: z.string(), summary: z.string(),
  variant: z.string().optional(), // e.g. "Southern route (traditional)"
  confidence: Confidence,
  stops: z.array(z.object({ placeId: z.string(), note: z.string(), refs: z.array(Ref), year: z.number().optional() })),
});

/* ---------- rosters & books ---------- */
export const RosterEntry = z.object({
  personId: z.string().optional(), name: z.string(), note: z.string(), refs: z.array(Ref),
  start: z.number().optional(), end: z.number().optional(),
  verdict: z.enum(['good', 'mixed', 'evil', 'n/a']).optional(),
  group: z.string().optional(),
});
export const Roster = z.object({ id: z.string(), title: z.string(), intro: z.string(), entries: z.array(RosterEntry) });
export type OutlineNodeT = { title: string; refs: string[]; children?: OutlineNodeT[] };
export const OutlineNode: z.ZodType<OutlineNodeT> = z.lazy(() => z.object({ title: z.string(), refs: z.array(Ref), children: z.array(OutlineNode).optional() }));
export const Book = z.object({
  id: z.string(), abbr: z.string(), name: z.string(), testament: z.enum(['OT', 'NT']), genre: z.string(),
  authorship: z.object({ traditional: z.string(), scholarly: z.string().optional() }),
  date: DateValue, audience: z.string(), setting: z.string(), purpose: z.string(),
  themes: z.array(z.string()), outline: z.array(OutlineNode), keyRefs: z.array(Ref), bigStory: z.string(),
  canonNote: z.string().optional(),
});

/* ---------- debates ---------- */
export const Figure = z.object({
  name: z.string(), lived: z.string(), profession: z.string(), bio: z.string(), works: z.array(Source),
  role: z.enum(['originator', 'systematizer', 'popularizer', 'defender']),
});
export const Position = z.object({
  id: z.string(), name: z.string(), summary: z.string(), color: z.string().optional(),
  figures: z.array(Figure), context: z.string(), claims: z.array(z.string()),
  scriptures: z.array(z.object({ ref: Ref, reading: z.string() })),
  arguments: z.array(z.object({ kind: z.enum(['scriptural', 'logical', 'historical']), text: z.string(), refs: z.array(Ref).optional() })),
  critiques: z.array(z.object({ from: z.string(), text: z.string(), refs: z.array(Ref).optional() })),
  responses: z.array(z.object({ toCritique: z.number(), text: z.string(), refs: z.array(Ref).optional() })),
  strawMen: z.array(z.object({ strawMan: z.string(), correction: z.string() })),
  impacts: z.object({ positive: z.array(z.string()), negative: z.array(z.string()) }),
  adherents: z.array(z.string()),
  reading: z.object({ proponent: z.array(Source), critic: z.array(Source) }),
  sequence: z.array(z.string()).optional(), // flowchart steps (atonement "how salvation works", eschatology end-times order)
  originYear: z.number().optional(),
});
export const Debate = z.object({
  id: z.string(), title: z.string(), category: z.string(), question: z.string(), intro: z.string(),
  keyRefs: z.array(Ref), positions: z.array(Position),
  battleground: z.array(z.object({ ref: Ref, readings: z.array(z.object({ positionId: z.string(), reading: z.string() })) })),
  timeline: z.array(z.object({ year: z.number(), title: z.string(), note: z.string(), confidence: Confidence })),
  influence: z.array(z.object({ from: z.string(), to: z.string(), note: z.string().optional() })).optional(),
  argumentMap: z.array(z.object({ id: z.string(), kind: z.enum(['claim', 'support', 'objection', 'reply']), text: z.string(), parent: z.string().optional(), positionId: z.string().optional(), refs: z.array(Ref).optional() })),
});

/* ---------- gospel history & afterlife ---------- */
export const GospelNode = z.object({
  id: z.string(), title: z.string(), year: z.number(), endYear: z.number().optional(), place: z.string(), coords: z.tuple([z.number(), z.number()]).optional(),
  people: z.array(z.string()), kind: z.enum(['preaching', 'turning-point', 'father', 'movement']),
  message: z.string(), shift: z.string().optional(), refs: z.array(Ref), sources: z.array(Source), confidence: Confidence,
  leadsTo: z.array(z.string()),
});
export const Emphasis = z.object({ themes: z.array(z.string()), eras: z.array(z.object({ id: z.string(), label: z.string(), values: z.array(z.number()), note: z.string() })), caveat: z.string() });
export const GuidingQuestion = z.object({ question: z.string(), answers: z.array(z.object({ view: z.string(), evidence: z.string(), refs: z.array(Ref), sources: z.array(Source) })) });
export const Term = z.object({ id: z.string(), term: z.string(), original: z.string(), meaning: z.string(), usage: z.string(), refs: z.array(Ref), readings: z.array(z.object({ view: z.string(), text: z.string() })) });
export const EarlyView = z.object({ id: z.string(), title: z.string(), summary: z.string(), figures: z.array(z.string()), sources: z.array(Source), refs: z.array(Ref), history: z.string(), confidence: Confidence });

/* ---------- context, work, study ---------- */
export const ContextItem = z.object({ id: z.string(), title: z.string(), category: z.string(), summary: z.string(), body: z.string(), refs: z.array(Ref), personIds: z.array(z.string()), debateIds: z.array(z.string()), facts: z.array(z.object({ label: z.string(), value: z.string() })).optional() });
export const Occupation = z.object({ id: z.string(), name: z.string(), kind: z.enum(['trade', 'ministry']), summary: z.string(), status: z.string(), tools: z.array(z.string()), personIds: z.array(z.string()), teaching: z.array(z.object({ text: z.string(), refs: z.array(Ref) })), refs: z.array(Ref) });
export const GiftsList = z.object({ id: z.string(), ref: Ref, context: z.string(), gifts: z.array(z.string()) });
export const StudyPath = z.object({ id: z.string(), title: z.string(), summary: z.string(), steps: z.array(z.object({ title: z.string(), body: z.string(), refs: z.array(Ref), link: z.string().optional() })) });
export const QuizQ = z.object({ id: z.string(), topic: z.string(), q: z.string(), options: z.array(z.string()), answer: z.number(), explain: z.string(), refs: z.array(Ref) });

export type PersonT = z.infer<typeof Person>;
export type PlaceT = z.infer<typeof Place>;
export type EraT = z.infer<typeof Era>;
export type TimelineEventT = z.infer<typeof TimelineEvent>;
export type EmpireT = z.infer<typeof Empire>;
export type JourneyT = z.infer<typeof Journey>;
export type RelationshipT = z.infer<typeof Relationship>;
export type RosterT = z.infer<typeof Roster>;
export type BookT = z.infer<typeof Book>;
export type DebateT = z.infer<typeof Debate>;
export type PositionT = z.infer<typeof Position>;
export type GospelNodeT = z.infer<typeof GospelNode>;
export type EmphasisT = z.infer<typeof Emphasis>;
export type GuidingQuestionT = z.infer<typeof GuidingQuestion>;
export type TermT = z.infer<typeof Term>;
export type EarlyViewT = z.infer<typeof EarlyView>;
export type ContextItemT = z.infer<typeof ContextItem>;
export type OccupationT = z.infer<typeof Occupation>;
export type GiftsListT = z.infer<typeof GiftsList>;
export type StudyPathT = z.infer<typeof StudyPath>;
export type QuizQT = z.infer<typeof QuizQ>;
export type ConfidenceT = z.infer<typeof Confidence>;
export type DateValueT = z.infer<typeof DateValue>;
export type SourceT = z.infer<typeof Source>;

/* ---------- study guides & plain-language layer ---------- */
export const DeepDive = z.object({
  id: z.string(), title: z.string(), category: z.string(), question: z.string(),
  plainAnswer: z.string(),            // 3-6 sentences, the short honest answer in everyday words
  keyTakeaways: z.array(z.string()),  // 4-7 bullet points
  sections: z.array(z.object({
    heading: z.string(), body: z.string(), refs: z.array(Ref),
    sources: z.array(Source).optional(), confidence: Confidence.optional(),
    callout: z.object({ kind: z.enum(['note', 'debate', 'tradition', 'myth']), text: z.string() }).optional(),
  })),
  table: z.object({ caption: z.string(), columns: z.array(z.string()), rows: z.array(z.array(z.string())) }).optional(),
  timeline: z.array(z.object({ year: z.number(), title: z.string(), note: z.string(), confidence: Confidence })).optional(),
  keyVerses: z.array(Ref),
  views: z.array(z.object({ name: z.string(), summary: z.string() })).optional(),
  related: z.array(z.string()),       // in-app routes, e.g. "/debates/soteriology"
  furtherQuestions: z.array(z.string()),
});
export type DeepDiveT = z.infer<typeof DeepDive>;
const PlainPos = z.object({ summary: z.string(), takeaway: z.string(), keyVerse: Ref.optional(), analogy: z.string().optional() });
export const PlainLayer = z.record(z.string(), z.object({ summary: z.string(), takeaway: z.string(), whyItMatters: z.string(), positions: z.record(z.string(), PlainPos) }));
export type PlainLayerT = z.infer<typeof PlainLayer>;

/** Which schema validates which content file. Files may hold an array (most) or a single object (emphasis). */
export const FILES = {
  'people-1.json': z.array(Person), 'people-2.json': z.array(Person), 'people-3.json': z.array(Person),
  'people-4.json': z.array(Person), 'people-5.json': z.array(Person), 'people-6.json': z.array(Person),
  'relationships.json': z.array(Relationship),
  'people-7.json': z.array(Person), 'relationships-7.json': z.array(Relationship),
  'people-8.json': z.array(Person), 'relationships-8.json': z.array(Relationship),
  'people-9.json': z.array(Person), 'relationships-9.json': z.array(Relationship),
  'people-10.json': z.array(Person), 'relationships-10.json': z.array(Relationship),
  'people-11.json': z.array(Person), 'relationships-11.json': z.array(Relationship),
  'guides-1.json': z.array(DeepDive),
  'guides-2.json': z.array(DeepDive),
  'guides-3.json': z.array(DeepDive),
  'guides-4.json': z.array(DeepDive),
  'guides-5.json': z.array(DeepDive),
  'plain-1.json': PlainLayer, 'plain-2.json': PlainLayer,
  'places.json': z.array(Place),
  'eras.json': z.array(Era),
  'timeline.json': z.array(TimelineEvent),
  'empires.json': z.array(Empire),
  'journeys.json': z.array(Journey),
  'rosters.json': z.array(Roster),
  'books-ot.json': z.array(Book), 'books-nt.json': z.array(Book),
  'debates-1.json': z.array(Debate), 'debates-2.json': z.array(Debate), 'debates-3.json': z.array(Debate),
  'debates-4.json': z.array(Debate), 'debates-5.json': z.array(Debate),
  'eschatology.json': z.array(Debate),
  'movements.json': z.array(Debate),
  'gospel-history.json': z.array(GospelNode),
  'gospel-emphasis.json': Emphasis,
  'gospel-questions.json': z.array(GuidingQuestion),
  'afterlife-terms.json': z.array(Term),
  'afterlife-views.json': z.array(EarlyView),
  'context.json': z.array(ContextItem),
  'occupations.json': z.array(Occupation),
  'gifts.json': z.array(GiftsList),
  'study-paths.json': z.array(StudyPath),
  'quiz.json': z.array(QuizQ),
} as const;
