# Logos Atlas

An interactive, animated atlas of the Bible: people, journeys, books, the master timeline, family trees, a relationship graph with path-finding, how the gospel was preached through history, afterlife and eschatology, and even-handed theological debates.

```bash
npm install
npm run dev        # local dev server
npm run validate   # schema, scripture-reference and cross-link checks for /content
npm run build      # single-file dist/index.html
```

Content lives in `/content/*.json`, validated by the Zod schemas in `src/schemas`. Add a debate by adding an object to any `debates-*.json` file; no code changes needed.
