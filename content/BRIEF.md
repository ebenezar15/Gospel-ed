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
