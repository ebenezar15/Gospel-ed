# Decisions

- **Single-file build.** The app is published as one HTML artifact, so Vite + `vite-plugin-singlefile` inlines all JS, CSS and content. Routing uses `HashRouter`.
- **Maps without a tile server.** Artifacts cannot fetch map tiles, so maps are drawn with `d3-geo` from Natural Earth land polygons clipped to the Bible lands, with hand-placed major rivers. Empires are drawn as approximate extent circles, clearly schematic.
- **KJV for verse text.** The only full public-domain text available offline; the validator uses its versification.
- **Exodus chronology toggle.** Early (c. 1446 BC) is the default because 1 Kgs 6:1 gives it directly; the toggle swaps any date that carries a "late" alternative.
- **Seed data.** Theographic and OpenBible datasets were not reachable from the build environment; people, places and relationships were written fresh against a shared id list (`content/BRIEF.md`) and checked by `npm run validate`.
- **Profiles.** 186 profiles (about 60 major) rather than the full ~3,000 — Phase 9 of the spec (minor-profile expansion) is open.
- **AI features.** "Interview a person", "Ask a tutor" on debates, and "Ask the Atlas" use the artifact runtime's `sample` capability, which runs on the viewer's own Claude account and asks consent first. They hide themselves when unavailable.
- **Genealogy shortcuts.** "Descendant (generations omitted)" links only join the tree when no recorded chain already connects the pair, so Adam → Jesus never bypasses the line.
