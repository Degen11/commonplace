# Findings: dependency

Detector: detect-dependency. Coverage: all 37 entries of package.json read and import-traced across src/, api/, scripts/, vite.config.js, eslint.config.js and CI; peer graph checked with npm ls; registry metadata (npm view) checked for quiet packages. osv-scanner ran with 0 findings, so no advisory reachability to judge. Unused-dependency and abandonment coverage is AI-only (knip, npm-check-updates and libyear not run). PARTIAL: abandonment check incomplete - @use-gesture/react (last publish 2024-03) and @dnd-kit/core + @dnd-kit/sortable (last publish 2024-12; upstream now ships @dnd-kit/react) are quiet, but GitHub repo pages were unreachable from this session (gh/api.github.com blocked), so archived status was not verified and nothing was filed; quiet is not abandoned. Not filed: babel-plugin-react-compiler exact pin 1.0.0 is the current npm latest, so it is not a fossil; vite-plugin-pwa sits in dependencies though build-only (no shipping effect). No credentials seen in package.json, .npmrc or lockfile. Out-of-category (signage): CLAUDE.md tech-stack line says @use-gesture/react powers useLongPress, but src/hooks/useLongPress.js uses raw touch events and only useSwipe imports @use-gesture. [coverage=partial]

## PH-649 legacy-peer-deps in .npmrc outlived its exit criterion and now masks an invalid peer on the React Compiler build path

```yaml
id: PH-649
category: dependency
title: legacy-peer-deps in .npmrc outlived its exit criterion and now masks an
  invalid peer on the React Compiler build path
severity: minor
traffic: 0.5119943795537377
confidence: ai-suspected
evidence:
  - .npmrc:1
  - package.json:55
  - package.json:58
  - vite.config.js:3
  - vite.config.js:81
  - 5b2f20c
source:
  - detect-dependency
repair_cost: S
fingerprint: dependency:.npmrc:stale-legacy-peer-deps-masks-peer-conflict
partial: true
```

Commit 5b2f20c added legacy-peer-deps=true only for vite-plugin-pwa's missing vite@8 peer, with a stated exit: remove once vite-plugin-pwa 1.3.0 ships. The installed vite-plugin-pwa is 1.3.0 and declares vite ^8, so the reason is gone, but the flag stayed and the reason lives only in a commit message. Meanwhile the flag hides a new conflict: npm ls reports @rolldown/plugin-babel@0.3.0 as invalid for @vitejs/plugin-react@6.1.2 (peer ^0.1.7 || ^0.2.0), and that exact pair is the pipeline that runs reactCompilerPreset in vite.config.js, which the whole codebase relies on for memoization. npm ci in CI never complains. Fix: bump @vitejs/plugin-react to a release accepting plugin-babel 0.3 (6.2.x does), delete .npmrc, regenerate the lockfile.

## PH-650 @babel/eslint-parser and @babel/preset-react are declared but nothing loads them

```yaml
id: PH-650
category: dependency
title: "@babel/eslint-parser and @babel/preset-react are declared but nothing
  loads them"
severity: minor
traffic: 0.5119943795537377
confidence: ai-suspected
evidence:
  - package.json:53
  - package.json:54
  - eslint.config.js:7
  - vite.config.js:82
  - c75536e
source:
  - detect-dependency
repair_cost: S
fingerprint: dependency:package.json:unused-babel-parser-and-preset
partial: true
```

Both were added in c75536e (for JSX linting support) while the compiler was wired through plugin-react's babel option. eslint.config.js never sets languageOptions.parser, so ESLint parses JSX with its default espree, and vite.config.js now passes only reactCompilerPreset() to @rolldown/plugin-babel, so no preset-react is loaded. No config file, script or package peer references either one. They cost Dependabot churn and suggest a Babel lint pipeline that does not exist. @babel/core stays, as a required peer of @rolldown/plugin-babel.
