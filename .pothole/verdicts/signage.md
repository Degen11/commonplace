# Verdicts: signage

Inspector: inspect-signage. Coverage: every finding judged; all evidence refs opened and resolved.

## PH-449 confirmed

```yaml
id: PH-449
verdict: confirmed
reason: "evidence resolves: CLAUDE.md:365 says manual memo/useCallback/useMemo
  have been stripped and :291 names only one surviving useMemo, yet
  TableView.jsx:107/:280 and CardItem.jsx:21 wrap in memo() and
  useSync.js:64/69/138/162 use useCallback; trap/documented checked: not jargon,
  not an ADR. Lowered major->minor: each memo() carries an adjacent 'React.memo
  is required' comment (TableView.jsx:103,276; CardItem.jsx:18), so the claimed
  harm of an agent stripping them as stragglers is mitigated in-file; the doc
  contradiction itself is real."
fingerprint: signage:CLAUDE.md:claude-md-memo-stripped-claim-false
severity: minor
severity_was: major
```

## PH-450 confirmed

```yaml
id: PH-450
verdict: confirmed
reason: "evidence resolves: README.md:88 labels QuotesContext.jsx 'Global state:
  quotes, collections, sync' and the README tree omits src/stores/;
  QuotesContext.jsx:1-2 says it is side-effects-only and state lives in
  useQuotesStore (quotesStore.js:1). Demonstrable doc/code contradiction; no
  trap, not marked future/optional."
fingerprint: signage:README.md:readme-quotes-context-global-state
```

## PH-451 confirmed

```yaml
id: PH-451
verdict: confirmed
reason: "evidence resolves: README.md:108 says Node.js 18+; package.json:64 pins
  vite ^8.3.5 whose installed engines field is ^20.19.0 || >=22.12.0; ci.yml:19
  uses Node 22. Stale prerequisite, no trap applies."
fingerprint: signage:README.md:readme-node-version-too-old
```

## PH-452 confirmed

```yaml
id: PH-452
verdict: confirmed
reason: "evidence resolves: CLAUDE.md:332 says eslint-plugin-react-hooks must be
  installed separately, but package.json:61 lists it as a devDependency (7.1.1
  installed) and eslint.config.js:1 imports it; npm install provides it. Stale
  note, no trap applies."
fingerprint: signage:CLAUDE.md:claude-md-react-hooks-plugin-install-note-stale
```
