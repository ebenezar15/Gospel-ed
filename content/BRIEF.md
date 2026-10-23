# Logos Atlas — content brief (read fully before writing)

You are writing one content file for **Logos Atlas**, an interactive Bible, church-history and theology explorer.
Schemas: `src/schemas/index.ts` (Zod). Your file must parse against the schema named for it in the `FILES` map.
Validate with: `cd /home/user/Gospel-ed && npx tsx scripts/validate.ts <your-file.json>` — fix every ✗ error until it prints "No errors."
(Unresolved person/place id warnings are acceptable if you used ids from the lists below.)

## Editorial rules (non-negotiable)
1. **Scripture refs for every claim.** Format is strict, one passage per string: `"Gen 12:1-3"`, `"1 Sam 16:13"`, `"Ps 23"`, `"Matt 5:3-7:29"`, `"Jude 1:3"` (single-chapter books still need chapter 1).
   No commas, no "ff", no "f", no semicolons, no "a/b" verse halves. Use ONLY these abbreviations:
   Gen Exod Lev Num Deut Josh Judg Ruth "1 Sam" "2 Sam" "1 Kgs" "2 Kgs" "1 Chr" "2 Chr" Ezra Neh Esth Job Ps Prov Eccl Song Isa Jer Lam Ezek Dan Hos Joel Amos Obad Jonah Mic Nah Hab Zeph Hag Zech Mal
   Matt Mark Luke John Acts Rom "1 Cor" "2 Cor" Gal Eph Phil Col "1 Thess" "2 Thess" "1 Tim" "2 Tim" Titus Phlm Heb Jas "1 Pet" "2 Pet" "1 John" "2 John" "3 John" Jude Rev
   Versification is the KJV/English one (e.g. Mal has 4 chapters, Joel 3, Dan 3 has 30 verses). The validator checks every verse exists.
2. **Confidence labels**: `biblical` (stated in the text), `scholarly-consensus`, `debated` (give alternatives), `tradition` (extra-biblical church tradition), `speculative`, `needs-verification` (use when unsure of a citation — never guess).
3. **Even-handed debates.** Every position gets the same depth and template. Steelman each as its best defenders would. Include critiques AND responses. Flag straw men and correct them. No view is presented as the default correct one.
4. **Never fabricate quotes.** Paraphrase in your own words. Cite Church Fathers by work + section (e.g. Irenaeus, *Against Heresies* 5.32) only when you are confident; otherwise set `confidence: "needs-verification"` on the Source.
5. **Separate text from interpretation** (persons have `textSays` and `interpretations`).
6. Dates: years are integers, negative = BC (e.g. -1446). Use `circa: true` for approximations.
7. Write plainly and specifically, like a knowledgeable teacher. No filler, no emoji, no markdown inside strings except *italics* for book titles is fine. Use `\n\n` to separate paragraphs in long fields.

## Shared IDs (use these exact ids for cross-links)
**Eras** (`eraId`/`eraIds`): primeval, patriarchs, egypt-exodus, conquest-judges, united-monarchy, divided-kingdom, exile, return, second-temple, life-of-jesus, apostolic, early-church, imperial-church, medieval, reformation, modern

**People ids** (file → ids). Major = full profile. Secondary = medium. Minor = short stub.
- people-1.json (Primeval & patriarchs): adam*, eve*, cain, abel, seth, enoch, methuselah, noah*, shem, ham, japheth, terah, abraham*, sarah*, hagar, ishmael, lot, melchizedek, isaac*, rebekah*, laban, esau, jacob*, leah, rachel, reuben, levi, judah, tamar, joseph-patriarch*, benjamin, job*
- people-2.json (Exodus to Judges): amram, jochebed, moses*, aaron*, miriam*, jethro, zipporah, pharaoh-of-the-exodus, joshua*, caleb, korah, balaam, rahab, eleazar-priest, phinehas, othniel, ehud, deborah*, barak, jael, gideon*, jephthah, samson*, delilah, naomi, ruth*, boaz, obed, jesse
- people-3.json (United monarchy & early divided kingdom): eli, hannah*, samuel*, saul-king*, jonathan, michal, david*, abigail, bathsheba, uriah, nathan, gad-prophet, joab, absalom, solomon*, queen-of-sheba, rehoboam, jeroboam-i, ahab, jezebel, elijah*, elisha*, naaman, micaiah, jehoshaphat, jehu, athaliah, joash-judah
- people-4.json (Later kings, prophets, exile, return): uzziah, hezekiah*, manasseh-king, josiah*, huldah, zedekiah, isaiah*, jeremiah*, baruch, ezekiel*, daniel*, shadrach, meshach, abednego, nebuchadnezzar, cyrus, esther*, mordecai, ezra*, nehemiah*, zerubbabel, joshua-high-priest, hosea, joel-prophet, amos, obadiah-prophet, jonah*, micah, nahum, habakkuk, zephaniah, haggai, zechariah-prophet, malachi, sennacherib
- people-5.json (Gospels): jesus*, mary-mother-of-jesus*, joseph-of-nazareth, elizabeth, zechariah-priest, john-the-baptist*, simeon, anna, peter*, andrew, james-son-of-zebedee, john-the-apostle*, philip-apostle, bartholomew, thomas*, matthew, james-son-of-alphaeus, thaddaeus, simon-the-zealot, judas-iscariot*, mary-magdalene*, martha, mary-of-bethany, lazarus, nicodemus, joseph-of-arimathea, zacchaeus, pontius-pilate, caiaphas, annas, herod-the-great, herod-antipas
- people-6.json (Acts & letters): matthias, stephen*, philip-the-evangelist, paul*, barnabas*, silas, timothy*, titus, luke*, john-mark, lydia, priscilla*, aquila, apollos, james-brother-of-jesus*, jude-brother-of-jesus, cornelius, agabus, gamaliel, phoebe, junia, andronicus, onesimus, philemon, ethiopian-eunuch, dorcas, herod-agrippa-i, herod-agrippa-ii, felix, festus
(* = major)

**Place ids** (kebab-case English name; places.json must define ALL of these, plus any more it wants):
eden, ararat, babel, ur, haran, shechem, bethel, ai, hebron, mamre, beersheba, gerar, sodom, salem, moriah, negev, egypt, goshen, rameses, succoth, red-sea, marah, elim, wilderness-of-sin, rephidim, mount-sinai, kadesh-barnea, mount-nebo, moab, edom, ammon, midian, paddan-aram, peniel, dothan, gilgal, jericho, shiloh, bethlehem, gibeah, ramah, mizpah, gath, ashdod, gaza, ekron, ashkelon, timnah, zorah, mount-gilboa, en-gedi, adullam, ziklag, jerusalem, mount-of-olives, hazor, megiddo, jezreel, samaria, mount-carmel, dan, tirzah, zarephath, horeb, damascus, tyre, sidon, nineveh, assyria, babylon, susa, persepolis, tarshish, joppa, anathoth, tekoa, chebar-canal, lachish, tishbe, abel-meholah, sheba, jordan-river, dead-sea, sea-of-galilee, nazareth, capernaum, bethsaida, chorazin, cana, nain, magdala, caesarea-philippi, mount-tabor, sychar, jericho, bethany, emmaus, gethsemane, golgotha, decapolis, tiberias, caesarea-maritima, lydda, antioch-syria, tarsus, cyprus, salamis, paphos, perga, antioch-pisidia, iconium, lystra, derbe, troas, philippi, thessalonica, berea, athens, corinth, cenchreae, ephesus, miletus, rome, malta, crete, patmos, galatia, colossae, laodicea, smyrna, pergamum, thyatira, sardis, philadelphia, alexandria, puteoli, ethiopia, arabia, macedonia, achaia, assos, mitylene, rhodes, patara, fair-havens, syracuse, rhegium, three-taverns, nicaea, constantinople, hippo, lyon, carthage, wittenberg, geneva

## House style for people (Person schema)
- `summary` (major: 2–3 paragraphs; secondary: 1 paragraph; minor: 2–3 sentences). `textSays` = what scripture actually states; `interpretations` = how traditions read them (Jewish, Catholic, Orthodox, Reformed, etc. as relevant).
- `events`: major 6–12, secondary 3–5, minor 1–2. `journey` (ordered placeIds) for anyone who travels.
- `born`/`died`/`active` with honest confidence; give alternative chronologies for debated dates (early vs late exodus etc.).
- `voice`: 1–2 sentences describing how this person would speak (temperament, idiom) — used by an AI "interview" feature.
- `family` lists person ids (only ids from the list above; omit relatives not in the list).
- `traditions` only for extra-biblical traditions, each with a source.

---
# Expansion round 2 (more people, study guides, plain-language layer)

All earlier rules apply. Existing people ids (people-1..6) are listed above and MUST NOT be redefined; link to them freely in `family` and relationships.
New writers: put relationships for your new people in your own `relationships-N.json` (same Relationship schema; family = from parent to child; skipped generations note "descendant (generations omitted)").
Write for a curious non-specialist: short sentences, define technical terms on first use, but keep the depth (refs, confidence labels, both sides).

**New people ids** (★ = give a full major profile, others secondary or minor as the text allows):
- people-7.json (genealogies & Genesis–Ruth extras): enosh, kenan, mahalalel, jared, lamech-father-of-noah, arphaxad, shelah, eber, peleg, reu, serug, nahor, nimrod, lamech-son-of-methuselah-line-cain (id: lamech-line-of-cain), jabal, tubal-cain, keturah, bilhah, zilpah, dinah, simeon-son-of-jacob, issachar, zebulun, gad-son-of-jacob, asher, naphtali, dan-son-of-jacob, ephraim, manasseh-son-of-joseph, potiphar, asenath, perez, hezron, ram, amminadab, nahshon, salmon, shiphrah, puah, bezalel, hur, nadab, abihu, ithamar, achan, daughters-of-zelophehad, og, sihon, balak, eglon, shamgar, sisera, tola, jair, ibzan, elon, abdon, manoah, micah-of-ephraim, abimelech-son-of-gideon, orpah, elimelech, mahlon, kilion
- people-8.json (Samuel–Kings extras): elkanah, peninnah, hophni, phinehas-son-of-eli, ichabod, kish, abner, ishbosheth, mephibosheth, ziba, merab, rizpah, ahinoam, maacah, amnon, tamar-daughter-of-david, adonijah, nathan-son-of-david, shimei, hushai, ahithophel, benaiah, zadok, abiathar, hiram, ahijah, abijah-of-judah, asa★, nadab-of-israel, baasha, omri, ahaziah-of-israel, jehoram-of-israel, jehoram-of-judah, ahaziah-of-judah, obadiah-steward, shunammite-woman, gehazi, widow-of-zarephath, hazael, ben-hadad, jehoiada, jeroboam-ii, menahem, pekah, hoshea-king, ahaz, amaziah, jotham, mesha
- people-9.json (late monarchy, exile, return, wisdom): jehoahaz-of-judah, jehoiakim, jehoiachin, gedaliah, ebed-melech, hananiah-false-prophet, pashhur, shaphan, hilkiah, belshazzar, darius-the-mede, darius-i, artaxerxes-i, ahasuerus, haman, vashti, sanballat, tobiah, sheshbazzar, uriah-son-of-shemaiah, iddo, nebuzaradan, merodach-baladan, tiglath-pileser-iii, shalmaneser-v, sargon-ii, evil-merodach, eliphaz, bildad, zophar, elihu, agur, lemuel, jabez, oded, hanani, jehu-son-of-hanani, azariah-son-of-oded, shemaiah, zechariah-son-of-jehoiada
- people-10.json (Gospels extras): jairus, bartimaeus, simon-of-cyrene, barabbas, malchus, joanna, susanna, salome-disciple, mary-wife-of-clopas, cleopas, samaritan-woman, simon-the-pharisee, simon-the-leper, herodias, salome-daughter-of-herodias, philip-the-tetrarch, archelaus, caesar-augustus, tiberius, quirinius, legion-demoniac, centurion-at-the-cross, levi-tax-collector (alias note: usually identified with matthew → make it minor with a note and family/relationship to matthew), nathanael (note identification with bartholomew), lazarus-of-the-parable, the-rich-young-ruler, widow-of-nain-son, syrophoenician-woman, woman-caught-in-adultery, centurion-of-capernaum
- people-11.json (Acts & letters extras): ananias-of-jerusalem, sapphira, ananias-of-damascus, ananias-high-priest, simon-magus, rhoda, eutychus, sergius-paulus, elymas, demetrius-silversmith, gallio, crispus, sosthenes, erastus, tychicus, trophimus, epaphras, epaphroditus, demas, archippus, aristarchus, gaius, diotrephes, demetrius-of-3-john, lois, eunice, onesiphorus, alexander-the-coppersmith, hymenaeus, nympha, chloe, stephanas, euodia, syntyche, clement-of-philippi, mnason, philippian-jailer, sceva, claudius, nero, drusilla, bernice, tertullus, julius-centurion, publius

## Study guides (guides-N.json, DeepDive schema)
Long-form, chaptered, easy to read. Each guide: `plainAnswer` (the honest short answer in everyday words, 3–6 sentences), `keyTakeaways` (4–7), 6–10 `sections` (each 2–5 short paragraphs, refs, sources where historical, a confidence label where the claim is contested, and an optional `callout` — kind "myth" for a common misunderstanding corrected, "debate" where scholars disagree, "tradition" for extra-biblical tradition), an optional comparison `table` (columns + rows of short cells), an optional `timeline`, `keyVerses`, `views` where there are camps, `related` in-app routes, and `furtherQuestions`.
Be even-handed: when a question is loaded (e.g. "how was the gospel corrupted"), say plainly that "corruption" is itself a judgement, show which changes historians agree happened, and give the main interpretations (decline, legitimate development, mixed), naming who holds each.
In-app routes you can link: /people/<id>, /debates/<id> (soteriology, cessationism, gender-roles, atonement, hell, heaven-new-creation, christocentric-hermeneutic, scripture-and-tradition, justice-of-god, eternal-security, sanctification, israel-and-church, baptism, lords-supper, creation, inspiration, millennium, rapture), /movements/<id> (dominion-theology, word-of-faith, prophetic-movement, divine-healing, hearing-gods-voice, tongues), /gospel-history, /afterlife, /timeline, /maps?journey=<id>, /rosters?r=<id> (prophets, apostles, judges, kings-israel, kings-judah, women-of-the-bible, authors), /work, /context/<id>, /guides/<id>.

## Plain-language layer (plain-N.json, PlainLayer schema)
An object keyed by debate id: { summary (3–4 sentences, everyday words), takeaway (one sentence: what the disagreement is really about), whyItMatters (2–3 sentences: how it changes how people pray, preach, live), positions: { <positionId>: { summary (2–3 sentences, no jargon), takeaway (one sentence), keyVerse (single ref), analogy (optional, one sentence illustration a teenager would get — fair to the view) } } }. Read the debate file to get exact debate and position ids. Every position of every debate must be present.

---
# Expansion round 3 (Reading the Bible: canon, paradoxes, history, types, symbols)
All earlier rules apply (strict ref format, confidence labels, even-handed, no invented quotes, plain words for non-specialists with depth kept).
Schemas: CanonBook, Paradox, BibleHistory, TypeLink, SymbolT_ in src/schemas/index.ts.
Write chunks under content/_parts/ with a prefix unique to you and merge with your OWN uniquely named script kept in the scratchpad (/tmp/claude-0/-home-user-Gospel-ed/d1bd6d71-36a3-59c2-9eec-83786dc7e324/scratchpad/), never in the repo and never a shared merge.mjs.
Validate: cd /home/user/Gospel-ed && npx tsx scripts/validate.ts <file> until "No errors.". Do not git commit.
Ref fields that must parse: refs, keyRefs, keyVerses, ref, keyVerse. Books outside the 66 cannot be cited as refs — name them in text instead.
Canon book status values: canon | deuterocanon | appendix | read-not-canon | rejected | lost | n/a. Use the tradition's own practice (e.g. Ethiopian Orthodox: 1 Enoch and Jubilees = canon; Catholic: Tobit = deuterocanon; Orthodox: 3 Maccabees = canon/deuterocanon (Orthodox say "anagignoskomena"), Prayer of Manasseh = appendix in Catholic Vulgate; Protestant: Apocrypha = read-not-canon (Article VI of the 39 Articles) or rejected). Mark disputed statuses in the `note`/summary and set confidence accordingly.
Paradox `related` and Symbol/Type `related` may contain in-app routes (/debates/<id>, /guides/<id>, /people/<id>) or ids of other symbols/types.

---
# Expansion round 4 (Gods of the Nations)
Read the source notes at /tmp/claude-0/-home-user-Gospel-ed/d1bd6d71-36a3-59c2-9eec-83786dc7e324/scratchpad/video-notes.md. They summarise a video's claims. NEVER name or credit the video's presenter. Use the content as a starting point only: verify each point against standard scholarship, correct anything inaccurate, and label debated points honestly (confidence). Add depth beyond it.
Schemas: God, GodsExtra in src/schemas/index.ts; Debate for debates-6.json; DeepDive for guides-7.json. God ids are kebab-case (e.g. baal-hadad, asherah, astarte, dagon, molech, milcom, chemosh, el, anat, yam, mot, resheph, kothar, baal-zebub, baal-peor, baal-berith, tammuz, queen-of-heaven, ptgyh, marduk, nabu, nergal, ishtar, shamash, sin-moon, sakkuth-kaiwan, nisroch, adrammelech-anammelech, succoth-benoth, ashima, nibhaz-tartak, rimmon, ra, osiris, hapi, heqet, apis, hathor, amun, zeus, hermes, artemis, castor-and-pollux, unknown-god, gad-and-meni, teraphim, golden-calf, nehushtan, azazel, lilith, shedim, sons-of-god). gods-1.json covers canaan/phoenicia/philistia/transjordan/aram; gods-2.json covers mesopotamia/egypt/greco-roman/israelite-folk/spirit-beings. Use these ids in godIds/related so links resolve.
Coordinates are [longitude, latitude].
The notes file also summarises a second video on the divine council. Same rules: never name the presenter; treat Heiser-style claims as one scholarly reading (present critiques and alternatives: classical monotheism, human-judges reading of Ps 82, Sethite reading of Gen 6, Trinitarian / plural-of-majesty readings of Gen 1:26, evolutionary-monotheism views of Mark Smith and others).

---
# Round 5: Book studies (study-*.json) and deep studies (deep-*.json)

Schemas: `BookStudy`, `ChapterStudy`, `DeepStudy`, `Misreading` in `src/schemas/index.ts` (read the field comments there — they are the spec).
**Book ids** (use exactly, for `id` and `connections[].bookId`):
OT: genesis exodus leviticus numbers deuteronomy joshua judges ruth 1-samuel 2-samuel 1-kings 2-kings 1-chronicles 2-chronicles ezra nehemiah esther job psalms proverbs ecclesiastes song-of-songs isaiah jeremiah lamentations ezekiel daniel hosea joel amos obadiah jonah micah nahum habakkuk zephaniah haggai zechariah malachi
NT: matthew mark luke john acts romans 1-corinthians 2-corinthians galatians ephesians philippians colossians 1-thessalonians 2-thessalonians 1-timothy 2-timothy titus philemon hebrews james 1-peter 2-peter 1-john 2-john 3-john jude revelation
(`content/books-ot.json` / `books-nt.json` already hold the basic outline, authorship and date for each book — read the entry for your book first, do not contradict it without reason, and do not repeat it; the study adds depth.)

## Research
Use WebSearch (load it with ToolSearch "select:WebSearch") to check scholarly positions, dates and archaeological facts you are not sure of — e.g. introductions in standard commentaries, the Jewish Study Bible / Jewish Annotated New Testament, the Bible Project, Bible Odyssey (SBL), Britannica. Do not copy text; summarise in your own words. Cite real works in `sources` (author, title, year). If unsure a work says something, mark the Source `confidence: "needs-verification"`.

## The lens the user wants
"The Jewish cultural and relational gospel lens": read each book as its first audience would — inside Israel's covenant story (election, Torah as gift within relationship, temple, feasts, exile and return, the hope of the kingdom), and the ancient Mediterranean world (honour and shame, kinship and household, patronage and gift — *charis* as gift that creates a relationship, *pistis* as trust/faithfulness/loyalty, collectivist identity, oral performance of texts). Emphasise God's faithful relationship with a people, not only individual transactions.

## Misreadings (the "differentials")
The user asked how evangelicals have misunderstood these books. Handle this fairly:
- `popular` = the common popular-level evangelical reading, stated in the way its holders would recognise (not a caricature).
- `inContext` = the reading from Jewish/first-century context, naming which scholars argue it (e.g. E. P. Sanders, James Dunn, N. T. Wright, Krister Stendahl, John Barclay, Matthew Bates, Mark Nanos, Pamela Eisenbaum, Amy-Jill Levine, David deSilva, Richard Hays, Scot McKnight, Craig Keener, Lois Tverberg, Marvin Wilson).
- `defence` = how careful traditional evangelical/Reformed scholars answer (e.g. D. A. Carson, Douglas Moo, Thomas Schreiner, Simon Gathercole, Stephen Westerholm, John Piper), so the reader sees both sides. Often the truth is "popular preaching flattened something; scholars on both sides agree it is richer" — say so.
- Distinguish *popular misunderstanding* from *scholarly disagreement*. Use confidence `debated` where scholars disagree.
- Never mock any tradition. No supersessionist put-downs of Judaism either ("legalistic Pharisees") — correct those where they appear.

## Visual fields — write them to be drawn
- `flow`: 4–8 steps, short `label` (≤ 6 words), `detail` 1–2 sentences. It becomes a flowchart.
- `mindmap`: 4–6 branches, each 2–5 items of ≤ 6 words. It becomes a radial mind map.
- `argument` (deep studies): 6–14 nodes; `next` lists ids of the nodes each one leads to (it may branch and rejoin); `chapters` like "1-4" or "9-11".
- `audienceMap.share` rough percentages that add to 100.
- `writtenFrom.coords` / `writtenTo.coords` = [longitude, latitude] (e.g. Rome [12.5, 41.9], Jerusalem [35.23, 31.78], Babylon [44.42, 32.54], Ephesus [27.34, 37.94], Corinth [22.88, 37.91]). Omit coords if wholly unknown.
- `worldEvents`: 3–6 dated events (negative years = BC) surrounding the writing.
- Plain language for a curious non-specialist: short sentences, define every technical term. Depth through specifics, not jargon.
