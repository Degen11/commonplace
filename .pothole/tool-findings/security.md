# Tool findings: security

Tools run: eslint-sonar (102 findings), jscpd (78 findings), gitleaks (0 findings), osv-scanner (0 findings), madge (0 findings), repowise-dead-code (8 findings), repowise-health (60 findings). Skipped (not measured): sonar — set SONAR_HOST_URL, SONAR_TOKEN, SONAR_PROJECT_KEY (or sonar-project.properties); semgrep — failed (exit 2; message withheld — tool output can echo repo contents); lcov — no coverage/lcov.info in the repo (Pothole never runs the target's tests, so it cannot produce one): coverage is not measured. Coverage notes: repowise-health — TRUNCATED at 60 of 136 health findings: coverage is partial.

## PH-002 Using pseudorandom number generators (PRNGs) is security-sensitive

```yaml
id: PH-002
category: security
title: Using pseudorandom number generators (PRNGs) is security-sensitive
severity: minor
traffic: 0.01832538687834203
confidence: tool-reported
evidence:
  - api/__tests__/security.test.js:67
source:
  - eslint-sonar
repair_cost: M
fingerprint: security:api/__tests__/security.test.js:sonarjs/pseudo-random
```

## PH-003 Using hardcoded IP addresses is security-sensitive (13× in file)

```yaml
id: PH-003
category: security
title: Using hardcoded IP addresses is security-sensitive (13× in file)
severity: minor
traffic: 0.01832538687834203
confidence: tool-reported
evidence:
  - api/__tests__/security.test.js:156
  - api/__tests__/security.test.js:156
  - api/__tests__/security.test.js:156
  - api/__tests__/security.test.js:156
  - api/__tests__/security.test.js:157
  - api/__tests__/security.test.js:157
  - api/__tests__/security.test.js:157
  - api/__tests__/security.test.js:157
  - api/__tests__/security.test.js:157
  - api/__tests__/security.test.js:163
  - api/__tests__/security.test.js:163
  - api/__tests__/security.test.js:163
  - api/__tests__/security.test.js:176
source:
  - eslint-sonar
repair_cost: M
fingerprint: security:api/__tests__/security.test.js:sonarjs/no-hardcoded-ip
```

## PH-004 Using slow regular expressions is security-sensitive

```yaml
id: PH-004
category: security
title: Using slow regular expressions is security-sensitive
severity: minor
traffic: 0.035944219344155634
confidence: tool-reported
evidence:
  - api/_schemas.js:5
source:
  - eslint-sonar
repair_cost: M
fingerprint: security:api/_schemas.js:sonarjs/slow-regex
```

## PH-006 Using hardcoded IP addresses is security-sensitive (13× in file)

```yaml
id: PH-006
category: security
title: Using hardcoded IP addresses is security-sensitive (13× in file)
severity: minor
traffic: 0.06340544648552357
confidence: tool-reported
evidence:
  - api/fetch-url.js:18
  - api/fetch-url.js:18
  - api/fetch-url.js:19
  - api/fetch-url.js:19
  - api/fetch-url.js:19
  - api/fetch-url.js:19
  - api/fetch-url.js:20
  - api/fetch-url.js:20
  - api/fetch-url.js:20
  - api/fetch-url.js:23
  - api/fetch-url.js:23
  - api/fetch-url.js:23
  - api/fetch-url.js:23
source:
  - eslint-sonar
repair_cost: M
fingerprint: security:api/fetch-url.js:sonarjs/no-hardcoded-ip
```

## PH-008 Using slow regular expressions is security-sensitive (2× in file)

```yaml
id: PH-008
category: security
title: Using slow regular expressions is security-sensitive (2× in file)
severity: minor
traffic: 0.06340544648552357
confidence: tool-reported
evidence:
  - api/fetch-url.js:265
  - api/fetch-url.js:296
source:
  - eslint-sonar
repair_cost: M
fingerprint: security:api/fetch-url.js:sonarjs/slow-regex
```

## PH-010 Using slow regular expressions is security-sensitive

```yaml
id: PH-010
category: security
title: Using slow regular expressions is security-sensitive
severity: minor
traffic: 0.08938780728535926
confidence: tool-reported
evidence:
  - api/lookup.js:52
source:
  - eslint-sonar
repair_cost: M
fingerprint: security:api/lookup.js:sonarjs/slow-regex
```

## PH-011 Using slow regular expressions is security-sensitive

```yaml
id: PH-011
category: security
title: Using slow regular expressions is security-sensitive
severity: minor
traffic: 0.07415300105742982
confidence: tool-reported
evidence:
  - api/og.js:42
source:
  - eslint-sonar
repair_cost: M
fingerprint: security:api/og.js:sonarjs/slow-regex
```

## PH-013 Using slow regular expressions is security-sensitive

```yaml
id: PH-013
category: security
title: Using slow regular expressions is security-sensitive
severity: minor
traffic: 0.018239588844717974
confidence: tool-reported
evidence:
  - api/share-page.js:35
source:
  - eslint-sonar
repair_cost: M
fingerprint: security:api/share-page.js:sonarjs/slow-regex
```

## PH-022 Dynamically executing code is security-sensitive

```yaml
id: PH-022
category: security
title: Dynamically executing code is security-sensitive
severity: minor
traffic: 0.018239588844717974
confidence: tool-reported
evidence:
  - src/__tests__/boot.test.js:10
source:
  - eslint-sonar
repair_cost: M
fingerprint: security:src/__tests__/boot.test.js:sonarjs/code-eval
```

## PH-030 Using slow regular expressions is security-sensitive

```yaml
id: PH-030
category: security
title: Using slow regular expressions is security-sensitive
severity: minor
traffic: 0.3129922719632555
confidence: tool-reported
evidence:
  - src/components/CardItem.jsx:116
source:
  - eslint-sonar
repair_cost: M
fingerprint: security:src/components/CardItem.jsx:sonarjs/slow-regex
```

## PH-051 Using slow regular expressions is security-sensitive

```yaml
id: PH-051
category: security
title: Using slow regular expressions is security-sensitive
severity: minor
traffic: 0.5664513387639842
confidence: tool-reported
evidence:
  - src/components/TableView.jsx:148
source:
  - eslint-sonar
repair_cost: M
fingerprint: security:src/components/TableView.jsx:sonarjs/slow-regex
```

## PH-063 Using slow regular expressions is security-sensitive

```yaml
id: PH-063
category: security
title: Using slow regular expressions is security-sensitive
severity: minor
traffic: 0.18109258775720635
confidence: tool-reported
evidence:
  - src/contexts/QuotesContext.jsx:32
source:
  - eslint-sonar
repair_cost: M
fingerprint: security:src/contexts/QuotesContext.jsx:sonarjs/slow-regex
```

## PH-093 Using slow regular expressions is security-sensitive

```yaml
id: PH-093
category: security
title: Using slow regular expressions is security-sensitive
severity: minor
traffic: 0.019102130751301752
confidence: tool-reported
evidence:
  - src/utils/parsers.js:33
source:
  - eslint-sonar
repair_cost: M
fingerprint: security:src/utils/parsers.js:sonarjs/slow-regex
```

## PH-099 Using slow regular expressions is security-sensitive (11× in file)

```yaml
id: PH-099
category: security
title: Using slow regular expressions is security-sensitive (11× in file)
severity: minor
traffic: 0.066302697349501
confidence: tool-reported
evidence:
  - src/utils/textFormatting.js:59
  - src/utils/textFormatting.js:207
  - src/utils/textFormatting.js:209
  - src/utils/textFormatting.js:210
  - src/utils/textFormatting.js:210
  - src/utils/textFormatting.js:210
  - src/utils/textFormatting.js:210
  - src/utils/textFormatting.js:210
  - src/utils/textFormatting.js:217
  - src/utils/textFormatting.js:217
  - src/utils/textFormatting.js:220
source:
  - eslint-sonar
repair_cost: M
fingerprint: security:src/utils/textFormatting.js:sonarjs/slow-regex
```

## PH-101 Searching OS commands in PATH is security-sensitive (2× in file)

```yaml
id: PH-101
category: security
title: Searching OS commands in PATH is security-sensitive (2× in file)
severity: minor
traffic: 0.10359896029435692
confidence: tool-reported
evidence:
  - vite.config.js:46
  - vite.config.js:50
source:
  - eslint-sonar
repair_cost: M
fingerprint: security:vite.config.js:sonarjs/no-os-command-from-path
```
