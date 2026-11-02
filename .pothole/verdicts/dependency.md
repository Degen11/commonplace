# Verdicts: dependency

Inspector: inspect-dependency. Coverage: every finding judged; all evidence refs opened, both commits read with git show, peer graph re-checked with npm ls and lockfile reverse-dependency scan.

## PH-649 confirmed

```yaml
id: PH-649
verdict: confirmed
reason: "All routes failed: commit 5b2f20c message states the exit criterion
  (remove once vite-plugin-pwa 1.3.0 ships vite@^8 peer); installed
  vite-plugin-pwa is 1.3.0 with vite ^8.0.0 peer; npm ls exits ELSPROBLEMS with
  @rolldown/plugin-babel@0.3.0 invalid for @vitejs/plugin-react@6.1.2 peer
  ^0.1.7||^0.2.0 (package.json:55/58, vite.config.js:3/81-82 is that pipeline).
  No trap matches; the reason is recorded only in a commit message, not in
  .npmrc, CLAUDE.md or the survey, and documented intent would not refute the
  masking cost anyway."
fingerprint: dependency:.npmrc:stale-legacy-peer-deps-masks-peer-conflict
```

## PH-650 confirmed

```yaml
id: PH-650
verdict: confirmed
reason: "All routes failed: eslint.config.js sets no languageOptions.parser
  (espree with ecmaFeatures.jsx); vite.config.js:82 passes only
  reactCompilerPreset(); grep of repo configs/scripts/CI finds no other
  reference besides package.json:53-54; lockfile scan shows no package depends
  on or peers either one; c75536e message confirms they were added for a
  JSX-linting role nothing now fills. Not a two-packages or pin trap; nothing
  documents keeping them."
fingerprint: dependency:package.json:unused-babel-parser-and-preset
```
