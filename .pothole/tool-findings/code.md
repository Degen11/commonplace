# Tool findings: code

Tools run: eslint-sonar (102 findings), jscpd (78 findings), gitleaks (0 findings), osv-scanner (0 findings), madge (0 findings), repowise-dead-code (8 findings), repowise-health (60 findings). Skipped (not measured): sonar — set SONAR_HOST_URL, SONAR_TOKEN, SONAR_PROJECT_KEY (or sonar-project.properties); semgrep — failed (exit 2; message withheld — tool output can echo repo contents); lcov — no coverage/lcov.info in the repo (Pothole never runs the target's tests, so it cannot produce one): coverage is not measured. Coverage notes: repowise-health — TRUNCATED at 60 of 136 health findings: coverage is partial.

## PH-001 Refactor this code to not nest functions more than 4 levels deep.

```yaml
id: PH-001
category: code
title: Refactor this code to not nest functions more than 4 levels deep.
severity: minor
traffic: 0.01832538687834203
confidence: tool-reported
evidence:
  - api/__tests__/security.test.js:13
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:api/__tests__/security.test.js:sonarjs/no-nested-functions
```

## PH-005 Refactor this function to reduce its Cognitive Complexity from 20 to the 15 allowed.

```yaml
id: PH-005
category: code
title: Refactor this function to reduce its Cognitive Complexity from 20 to the
  15 allowed.
severity: minor
traffic: 0.0914958755602203
confidence: tool-reported
evidence:
  - api/_shared.js:246
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:api/_shared.js:sonarjs/cognitive-complexity
```

## PH-007 Refactor this function to reduce its Cognitive Complexity from 29 to the 15 allowed.

```yaml
id: PH-007
category: code
title: Refactor this function to reduce its Cognitive Complexity from 29 to the
  15 allowed.
severity: minor
traffic: 0.06340544648552357
confidence: tool-reported
evidence:
  - api/fetch-url.js:56
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:api/fetch-url.js:sonarjs/cognitive-complexity
```

## PH-009 Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed.

```yaml
id: PH-009
category: code
title: Refactor this function to reduce its Cognitive Complexity from 18 to the
  15 allowed.
severity: minor
traffic: 0.12881854052041353
confidence: tool-reported
evidence:
  - api/identify.js:93
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:api/identify.js:sonarjs/cognitive-complexity
```

## PH-012 Extract this nested ternary operation into an independent statement. (2× in file)

```yaml
id: PH-012
category: code
title: Extract this nested ternary operation into an independent statement. (2×
  in file)
severity: minor
traffic: 0.07415300105742982
confidence: tool-reported
evidence:
  - api/og.js:51
  - api/og.js:56
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:api/og.js:sonarjs/no-nested-conditional
```

## PH-014 Simplify this regular expression to reduce its complexity from 24 to the 20 allowed.

```yaml
id: PH-014
category: code
title: Simplify this regular expression to reduce its complexity from 24 to the
  20 allowed.
severity: minor
traffic: 0.018239588844717974
confidence: tool-reported
evidence:
  - api/share-page.js:35
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:api/share-page.js:sonarjs/regex-complexity
```

## PH-015 Extract this nested ternary operation into an independent statement. (4× in file)

```yaml
id: PH-015
category: code
title: Extract this nested ternary operation into an independent statement. (4×
  in file)
severity: minor
traffic: 0.018239588844717974
confidence: tool-reported
evidence:
  - api/share-page.js:65
  - api/share-page.js:72
  - api/share-page.js:142
  - api/share-page.js:153
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:api/share-page.js:sonarjs/no-nested-conditional
```

## PH-016 Refactor this code to not use nested template literals. (2× in file)

```yaml
id: PH-016
category: code
title: Refactor this code to not use nested template literals. (2× in file)
severity: minor
traffic: 0.018239588844717974
confidence: tool-reported
evidence:
  - api/share-page.js:65
  - api/share-page.js:72
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:api/share-page.js:sonarjs/no-nested-template-literals
```

## PH-017 Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.

```yaml
id: PH-017
category: code
title: Refactor this function to reduce its Cognitive Complexity from 16 to the
  15 allowed.
severity: minor
traffic: 0.018239588844717974
confidence: tool-reported
evidence:
  - api/share-page.js:112
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:api/share-page.js:sonarjs/cognitive-complexity
```

## PH-018 Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed.

```yaml
id: PH-018
category: code
title: Refactor this function to reduce its Cognitive Complexity from 18 to the
  15 allowed.
severity: minor
traffic: 0.06578878559825872
confidence: tool-reported
evidence:
  - api/share.js:18
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:api/share.js:sonarjs/cognitive-complexity
```

## PH-019 Refactor this function to reduce its Cognitive Complexity from 22 to the 15 allowed. (2× in file)

```yaml
id: PH-019
category: code
title: Refactor this function to reduce its Cognitive Complexity from 22 to the
  15 allowed. (2× in file)
severity: minor
traffic: 0.07038251338668261
confidence: tool-reported
evidence:
  - api/sync.js:5
  - api/sync.js:34
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:api/sync.js:sonarjs/cognitive-complexity
```

## PH-020 Remove the declaration of the unused '_' variable.

```yaml
id: PH-020
category: code
title: Remove the declaration of the unused '_' variable.
severity: minor
traffic: 0.07038251338668261
confidence: tool-reported
evidence:
  - api/sync.js:106
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:api/sync.js:sonarjs/no-unused-vars
```

## PH-021 Handle this exception or don't catch it at all.

```yaml
id: PH-021
category: code
title: Handle this exception or don't catch it at all.
severity: minor
traffic: 0.018239588844717974
confidence: tool-reported
evidence:
  - public/boot.js:15
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:public/boot.js:sonarjs/no-ignored-exceptions
```

## PH-023 Remove this unused import of 'Link'.

```yaml
id: PH-023
category: code
title: Remove this unused import of 'Link'.
severity: minor
traffic: 0.17876465276882947
confidence: tool-reported
evidence:
  - src/components/AddMorePanel.jsx:9
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/AddMorePanel.jsx:sonarjs/unused-import
```

## PH-024 Refactor this function to reduce its Cognitive Complexity from 32 to the 15 allowed.

```yaml
id: PH-024
category: code
title: Refactor this function to reduce its Cognitive Complexity from 32 to the
  15 allowed.
severity: minor
traffic: 0.17876465276882947
confidence: tool-reported
evidence:
  - src/components/AddMorePanel.jsx:13
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/components/AddMorePanel.jsx:sonarjs/cognitive-complexity
```

## PH-025 Extract this nested ternary operation into an independent statement.

```yaml
id: PH-025
category: code
title: Extract this nested ternary operation into an independent statement.
severity: minor
traffic: 0.17876465276882947
confidence: tool-reported
evidence:
  - src/components/AddMorePanel.jsx:160
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/AddMorePanel.jsx:sonarjs/no-nested-conditional
```

## PH-026 Remove the declaration of the unused 'setCustomCats' variable. (2× in file)

```yaml
id: PH-026
category: code
title: Remove the declaration of the unused 'setCustomCats' variable. (2× in file)
severity: minor
traffic: 0.75153996915182
confidence: tool-reported
evidence:
  - src/components/App.jsx:39
  - src/components/App.jsx:46
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/App.jsx:sonarjs/no-unused-vars
```

## PH-027 Remove this useless assignment to variable "setCustomCats". (2× in file)

```yaml
id: PH-027
category: code
title: Remove this useless assignment to variable "setCustomCats". (2× in file)
severity: minor
traffic: 0.75153996915182
confidence: tool-reported
evidence:
  - src/components/App.jsx:39
  - src/components/App.jsx:46
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/App.jsx:sonarjs/no-dead-store
```

## PH-028 Refactor this function to reduce its Cognitive Complexity from 50 to the 15 allowed.

```yaml
id: PH-028
category: code
title: Refactor this function to reduce its Cognitive Complexity from 50 to the
  15 allowed.
severity: minor
traffic: 0.3129922719632555
confidence: tool-reported
evidence:
  - src/components/CardItem.jsx:21
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/components/CardItem.jsx:sonarjs/cognitive-complexity
```

## PH-029 Extract this nested ternary operation into an independent statement. (2× in file)

```yaml
id: PH-029
category: code
title: Extract this nested ternary operation into an independent statement. (2×
  in file)
severity: minor
traffic: 0.3129922719632555
confidence: tool-reported
evidence:
  - src/components/CardItem.jsx:108
  - src/components/CardItem.jsx:121
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/CardItem.jsx:sonarjs/no-nested-conditional
```

## PH-031 Remove this unused import of 'AnimatePresence'. (3× in file)

```yaml
id: PH-031
category: code
title: Remove this unused import of 'AnimatePresence'. (3× in file)
severity: minor
traffic: 0.32016782885685596
confidence: tool-reported
evidence:
  - src/components/CollectionsSidebar.jsx:2
  - src/components/CollectionsSidebar.jsx:2
  - src/components/CollectionsSidebar.jsx:2
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/CollectionsSidebar.jsx:sonarjs/unused-import
```

## PH-032 This statement will not be executed conditionally; only the first statement will be. The rest will execute unconditionally. (2× in file)

```yaml
id: PH-032
category: code
title: This statement will not be executed conditionally; only the first
  statement will be. The rest will execute unconditionally. (2× in file)
severity: minor
traffic: 0.32016782885685596
confidence: tool-reported
evidence:
  - src/components/CollectionsSidebar.jsx:88
  - src/components/CollectionsSidebar.jsx:471
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/CollectionsSidebar.jsx:sonarjs/no-unenclosed-multiline-block
```

## PH-033 Extract this nested ternary operation into an independent statement. (3× in file)

```yaml
id: PH-033
category: code
title: Extract this nested ternary operation into an independent statement. (3×
  in file)
severity: minor
traffic: 0.32016782885685596
confidence: tool-reported
evidence:
  - src/components/CollectionsSidebar.jsx:112
  - src/components/CollectionsSidebar.jsx:168
  - src/components/CollectionsSidebar.jsx:231
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/CollectionsSidebar.jsx:sonarjs/no-nested-conditional
```

## PH-034 Refactor this function to reduce its Cognitive Complexity from 31 to the 15 allowed.

```yaml
id: PH-034
category: code
title: Refactor this function to reduce its Cognitive Complexity from 31 to the
  15 allowed.
severity: minor
traffic: 0.32016782885685596
confidence: tool-reported
evidence:
  - src/components/CollectionsSidebar.jsx:244
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/components/CollectionsSidebar.jsx:sonarjs/cognitive-complexity
```

## PH-035 Refactor this code to not nest functions more than 4 levels deep. (2× in file)

```yaml
id: PH-035
category: code
title: Refactor this code to not nest functions more than 4 levels deep. (2× in file)
severity: minor
traffic: 0.19453210748037558
confidence: tool-reported
evidence:
  - src/components/ExportDropdown.jsx:96
  - src/components/ExportDropdown.jsx:97
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/ExportDropdown.jsx:sonarjs/no-nested-functions
```

## PH-036 Extract this nested ternary operation into an independent statement.

```yaml
id: PH-036
category: code
title: Extract this nested ternary operation into an independent statement.
severity: minor
traffic: 0.027631392716004493
confidence: tool-reported
evidence:
  - src/components/HeaderControls.jsx:27
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/HeaderControls.jsx:sonarjs/no-nested-conditional
```

## PH-037 Extract this nested ternary operation into an independent statement. (3× in file)

```yaml
id: PH-037
category: code
title: Extract this nested ternary operation into an independent statement. (3×
  in file)
severity: minor
traffic: 0.06895605931270264
confidence: tool-reported
evidence:
  - src/components/HowItWorksAnimation.jsx:52
  - src/components/HowItWorksAnimation.jsx:89
  - src/components/HowItWorksAnimation.jsx:101
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/HowItWorksAnimation.jsx:sonarjs/no-nested-conditional
```

## PH-038 Refactor this code to not nest functions more than 4 levels deep.

```yaml
id: PH-038
category: code
title: Refactor this code to not nest functions more than 4 levels deep.
severity: minor
traffic: 0.06895605931270264
confidence: tool-reported
evidence:
  - src/components/HowItWorksAnimation.jsx:220
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/HowItWorksAnimation.jsx:sonarjs/no-nested-functions
```

## PH-039 Remove this unused import of 'ChevronDown'.

```yaml
id: PH-039
category: code
title: Remove this unused import of 'ChevronDown'.
severity: minor
traffic: 0.09592243048378687
confidence: tool-reported
evidence:
  - src/components/InlineEditors.jsx:4
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/InlineEditors.jsx:sonarjs/unused-import
```

## PH-040 Use the opposite operator (<=) instead.

```yaml
id: PH-040
category: code
title: Use the opposite operator (<=) instead.
severity: minor
traffic: 0.19370146624411652
confidence: tool-reported
evidence:
  - src/components/ProcessingPhase.jsx:79
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/ProcessingPhase.jsx:sonarjs/no-inverted-boolean-check
```

## PH-041 Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.

```yaml
id: PH-041
category: code
title: Refactor this function to reduce its Cognitive Complexity from 16 to the
  15 allowed.
severity: minor
traffic: 0.19370146624411652
confidence: tool-reported
evidence:
  - src/components/ProcessingPhase.jsx:104
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/components/ProcessingPhase.jsx:sonarjs/cognitive-complexity
```

## PH-042 Refactor this function to reduce its Cognitive Complexity from 21 to the 15 allowed.

```yaml
id: PH-042
category: code
title: Refactor this function to reduce its Cognitive Complexity from 21 to the
  15 allowed.
severity: minor
traffic: 0.11527756634140444
confidence: tool-reported
evidence:
  - src/components/QuickAddBar.jsx:10
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/components/QuickAddBar.jsx:sonarjs/cognitive-complexity
```

## PH-043 Remove this use of the "void" operator.

```yaml
id: PH-043
category: code
title: Remove this use of the "void" operator.
severity: minor
traffic: 0.42808818545053934
confidence: tool-reported
evidence:
  - src/components/ResultsPhase.jsx:90
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/ResultsPhase.jsx:sonarjs/void-use
```

## PH-044 Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed.

```yaml
id: PH-044
category: code
title: Refactor this function to reduce its Cognitive Complexity from 18 to the
  15 allowed.
severity: minor
traffic: 0.42808818545053934
confidence: tool-reported
evidence:
  - src/components/ResultsPhase.jsx:175
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/components/ResultsPhase.jsx:sonarjs/cognitive-complexity
```

## PH-045 Refactor this code to not nest functions more than 4 levels deep. (3× in file)

```yaml
id: PH-045
category: code
title: Refactor this code to not nest functions more than 4 levels deep. (3× in file)
severity: minor
traffic: 0.42808818545053934
confidence: tool-reported
evidence:
  - src/components/ResultsPhase.jsx:406
  - src/components/ResultsPhase.jsx:504
  - src/components/ResultsPhase.jsx:505
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/ResultsPhase.jsx:sonarjs/no-nested-functions
```

## PH-046 Extract this nested ternary operation into an independent statement.

```yaml
id: PH-046
category: code
title: Extract this nested ternary operation into an independent statement.
severity: minor
traffic: 0.42808818545053934
confidence: tool-reported
evidence:
  - src/components/ResultsPhase.jsx:589
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/ResultsPhase.jsx:sonarjs/no-nested-conditional
```

## PH-047 Extract this nested ternary operation into an independent statement.

```yaml
id: PH-047
category: code
title: Extract this nested ternary operation into an independent statement.
severity: minor
traffic: 0.09027476737127609
confidence: tool-reported
evidence:
  - src/components/ShareImageModal.jsx:82
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/ShareImageModal.jsx:sonarjs/no-nested-conditional
```

## PH-048 Refactor this function to reduce its Cognitive Complexity from 28 to the 15 allowed.

```yaml
id: PH-048
category: code
title: Refactor this function to reduce its Cognitive Complexity from 28 to the
  15 allowed.
severity: minor
traffic: 0.11219181832557006
confidence: tool-reported
evidence:
  - src/components/SyncPill.jsx:19
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/components/SyncPill.jsx:sonarjs/cognitive-complexity
```

## PH-049 Extract this nested ternary operation into an independent statement. (7× in file)

```yaml
id: PH-049
category: code
title: Extract this nested ternary operation into an independent statement. (7×
  in file)
severity: minor
traffic: 0.11219181832557006
confidence: tool-reported
evidence:
  - src/components/SyncPill.jsx:42
  - src/components/SyncPill.jsx:55
  - src/components/SyncPill.jsx:59
  - src/components/SyncPill.jsx:60
  - src/components/SyncPill.jsx:62
  - src/components/SyncPill.jsx:64
  - src/components/SyncPill.jsx:72
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/SyncPill.jsx:sonarjs/no-nested-conditional
```

## PH-050 Refactor this function to reduce its Cognitive Complexity from 42 to the 15 allowed.

```yaml
id: PH-050
category: code
title: Refactor this function to reduce its Cognitive Complexity from 42 to the
  15 allowed.
severity: minor
traffic: 0.5664513387639842
confidence: tool-reported
evidence:
  - src/components/TableView.jsx:142
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/components/TableView.jsx:sonarjs/cognitive-complexity
```

## PH-052 Extract this nested ternary operation into an independent statement. (3× in file)

```yaml
id: PH-052
category: code
title: Extract this nested ternary operation into an independent statement. (3×
  in file)
severity: minor
traffic: 0.5664513387639842
confidence: tool-reported
evidence:
  - src/components/TableView.jsx:155
  - src/components/TableView.jsx:181
  - src/components/TableView.jsx:185
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/TableView.jsx:sonarjs/no-nested-conditional
```

## PH-053 Remove this use of the "void" operator.

```yaml
id: PH-053
category: code
title: Remove this use of the "void" operator.
severity: minor
traffic: 0.5664513387639842
confidence: tool-reported
evidence:
  - src/components/TableView.jsx:332
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/TableView.jsx:sonarjs/void-use
```

## PH-054 Extract this nested ternary operation into an independent statement. (2× in file)

```yaml
id: PH-054
category: code
title: Extract this nested ternary operation into an independent statement. (2×
  in file)
severity: minor
traffic: 0.018239588844717974
confidence: tool-reported
evidence:
  - src/components/ThemeToggleButton.jsx:12
  - src/components/ThemeToggleButton.jsx:17
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/ThemeToggleButton.jsx:sonarjs/no-nested-conditional
```

## PH-055 Remove this unused import of 'pluralize'.

```yaml
id: PH-055
category: code
title: Remove this unused import of 'pluralize'.
severity: minor
traffic: 0.2658406477038537
confidence: tool-reported
evidence:
  - src/components/ToolbarSection.jsx:5
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/ToolbarSection.jsx:sonarjs/unused-import
```

## PH-056 Refactor this function to reduce its Cognitive Complexity from 32 to the 15 allowed.

```yaml
id: PH-056
category: code
title: Refactor this function to reduce its Cognitive Complexity from 32 to the
  15 allowed.
severity: minor
traffic: 0.2658406477038537
confidence: tool-reported
evidence:
  - src/components/ToolbarSection.jsx:22
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/components/ToolbarSection.jsx:sonarjs/cognitive-complexity
```

## PH-057 This statement will not be executed conditionally; only the first statement will be. The rest will execute unconditionally.

```yaml
id: PH-057
category: code
title: This statement will not be executed conditionally; only the first
  statement will be. The rest will execute unconditionally.
severity: minor
traffic: 0.2658406477038537
confidence: tool-reported
evidence:
  - src/components/ToolbarSection.jsx:154
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/ToolbarSection.jsx:sonarjs/no-unenclosed-multiline-block
```

## PH-058 Extract this nested ternary operation into an independent statement.

```yaml
id: PH-058
category: code
title: Extract this nested ternary operation into an independent statement.
severity: minor
traffic: 0.09044540289132785
confidence: tool-reported
evidence:
  - src/components/UrlPreviewModal.jsx:111
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/UrlPreviewModal.jsx:sonarjs/no-nested-conditional
```

## PH-059 Remove the declaration of the unused 'Component' variable.

```yaml
id: PH-059
category: code
title: Remove the declaration of the unused 'Component' variable.
severity: minor
traffic: 0.0046501728851701726
confidence: tool-reported
evidence:
  - src/components/__tests__/CollectionDupeModal.test.js:18
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/__tests__/CollectionDupeModal.test.js:sonarjs/no-unused-vars
```

## PH-060 Remove this useless assignment to variable "Component".

```yaml
id: PH-060
category: code
title: Remove this useless assignment to variable "Component".
severity: minor
traffic: 0.0046501728851701726
confidence: tool-reported
evidence:
  - src/components/__tests__/CollectionDupeModal.test.js:18
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/__tests__/CollectionDupeModal.test.js:sonarjs/no-dead-store
```

## PH-061 Remove this unused import of 'fireEvent'.

```yaml
id: PH-061
category: code
title: Remove this unused import of 'fireEvent'.
severity: minor
traffic: 0.024705997599039173
confidence: tool-reported
evidence:
  - src/components/__tests__/ResultsPhase.test.jsx:4
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/__tests__/ResultsPhase.test.jsx:sonarjs/unused-import
```

## PH-062 Extract this nested ternary operation into an independent statement.

```yaml
id: PH-062
category: code
title: Extract this nested ternary operation into an independent statement.
severity: minor
traffic: 0.0046501728851701726
confidence: tool-reported
evidence:
  - src/components/__tests__/ShareImageModal.test.js:8
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/__tests__/ShareImageModal.test.js:sonarjs/no-nested-conditional
```

## PH-064 Refactor this function to reduce its Cognitive Complexity from 22 to the 15 allowed.

```yaml
id: PH-064
category: code
title: Refactor this function to reduce its Cognitive Complexity from 22 to the
  15 allowed.
severity: minor
traffic: 0.18109258775720635
confidence: tool-reported
evidence:
  - src/contexts/QuotesContext.jsx:119
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/contexts/QuotesContext.jsx:sonarjs/cognitive-complexity
```

## PH-065 Extract this nested ternary operation into an independent statement. (3× in file)

```yaml
id: PH-065
category: code
title: Extract this nested ternary operation into an independent statement. (3×
  in file)
severity: minor
traffic: 0.18109258775720635
confidence: tool-reported
evidence:
  - src/contexts/QuotesContext.jsx:136
  - src/contexts/QuotesContext.jsx:153
  - src/contexts/QuotesContext.jsx:155
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/contexts/QuotesContext.jsx:sonarjs/no-nested-conditional
```

## PH-066 Refactor this function to reduce its Cognitive Complexity from 48 to the 15 allowed.

```yaml
id: PH-066
category: code
title: Refactor this function to reduce its Cognitive Complexity from 48 to the
  15 allowed.
severity: minor
traffic: 0.08245855696719873
confidence: tool-reported
evidence:
  - src/data/localQuotes.js:3831
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/data/localQuotes.js:sonarjs/cognitive-complexity
```

## PH-067 Remove this unused import of 'waitFor'.

```yaml
id: PH-067
category: code
title: Remove this unused import of 'waitFor'.
severity: minor
traffic: 0.015986939294133067
confidence: tool-reported
evidence:
  - src/hooks/__tests__/processingErrors.test.js:3
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/hooks/__tests__/processingErrors.test.js:sonarjs/unused-import
```

## PH-068 Refactor this function to reduce its Cognitive Complexity from 22 to the 15 allowed.

```yaml
id: PH-068
category: code
title: Refactor this function to reduce its Cognitive Complexity from 22 to the
  15 allowed.
severity: minor
traffic: 0.01734470231239875
confidence: tool-reported
evidence:
  - src/hooks/useDndQuotes.js:41
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/hooks/useDndQuotes.js:sonarjs/cognitive-complexity
```

## PH-069 Extract this nested ternary operation into an independent statement.

```yaml
id: PH-069
category: code
title: Extract this nested ternary operation into an independent statement.
severity: minor
traffic: 0.01734470231239875
confidence: tool-reported
evidence:
  - src/hooks/useDndQuotes.js:58
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/hooks/useDndQuotes.js:sonarjs/no-nested-conditional
```

## PH-070 Refactor this function to reduce its Cognitive Complexity from 23 to the 15 allowed.

```yaml
id: PH-070
category: code
title: Refactor this function to reduce its Cognitive Complexity from 23 to the
  15 allowed.
severity: minor
traffic: 0.17224644681699114
confidence: tool-reported
evidence:
  - src/hooks/useEditState.js:6
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/hooks/useEditState.js:sonarjs/cognitive-complexity
```

## PH-071 Refactor this code to not nest functions more than 4 levels deep. (3× in file)

```yaml
id: PH-071
category: code
title: Refactor this code to not nest functions more than 4 levels deep. (3× in file)
severity: minor
traffic: 0.17224644681699114
confidence: tool-reported
evidence:
  - src/hooks/useEditState.js:173
  - src/hooks/useEditState.js:201
  - src/hooks/useEditState.js:202
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/hooks/useEditState.js:sonarjs/no-nested-functions
```

## PH-072 Remove this unused import of 'useEffect'.

```yaml
id: PH-072
category: code
title: Remove this unused import of 'useEffect'.
severity: minor
traffic: 0.03653667699137501
confidence: tool-reported
evidence:
  - src/hooks/useInfiniteScroll.js:1
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/hooks/useInfiniteScroll.js:sonarjs/unused-import
```

## PH-073 Refactor this function to reduce its Cognitive Complexity from 58 to the 15 allowed.

```yaml
id: PH-073
category: code
title: Refactor this function to reduce its Cognitive Complexity from 58 to the
  15 allowed.
severity: minor
traffic: 0.036089595561323934
confidence: tool-reported
evidence:
  - src/hooks/useKeyboardShortcuts.js:40
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/hooks/useKeyboardShortcuts.js:sonarjs/cognitive-complexity
```

## PH-074 Remove this redundant jump.

```yaml
id: PH-074
category: code
title: Remove this redundant jump.
severity: minor
traffic: 0.036089595561323934
confidence: tool-reported
evidence:
  - src/hooks/useKeyboardShortcuts.js:148
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/hooks/useKeyboardShortcuts.js:sonarjs/no-redundant-jump
```

## PH-075 Remove this unused import of 'buildValidCats'.

```yaml
id: PH-075
category: code
title: Remove this unused import of 'buildValidCats'.
severity: minor
traffic: 0.22087729473158527
confidence: tool-reported
evidence:
  - src/hooks/useProcessing.js:4
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/hooks/useProcessing.js:sonarjs/unused-import
```

## PH-076 Refactor this function to reduce its Cognitive Complexity from 33 to the 15 allowed.

```yaml
id: PH-076
category: code
title: Refactor this function to reduce its Cognitive Complexity from 33 to the
  15 allowed.
severity: minor
traffic: 0.22087729473158527
confidence: tool-reported
evidence:
  - src/hooks/useProcessing.js:223
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/hooks/useProcessing.js:sonarjs/cognitive-complexity
```

## PH-077 Refactor this code to not use nested template literals.

```yaml
id: PH-077
category: code
title: Refactor this code to not use nested template literals.
severity: minor
traffic: 0.22087729473158527
confidence: tool-reported
evidence:
  - src/hooks/useProcessing.js:446
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/hooks/useProcessing.js:sonarjs/no-nested-template-literals
```

## PH-078 Handle this exception or don't catch it at all.

```yaml
id: PH-078
category: code
title: Handle this exception or don't catch it at all.
severity: minor
traffic: 0.22087729473158527
confidence: tool-reported
evidence:
  - src/hooks/useProcessing.js:451
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/hooks/useProcessing.js:sonarjs/no-ignored-exceptions
```

## PH-079 This statement will not be executed in a loop; only the first statement will be. The rest will execute only once.

```yaml
id: PH-079
category: code
title: This statement will not be executed in a loop; only the first statement
  will be. The rest will execute only once.
severity: minor
traffic: 0.12984196531736986
confidence: tool-reported
evidence:
  - src/hooks/useQuoteActions.js:25
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/hooks/useQuoteActions.js:sonarjs/no-unenclosed-multiline-block
```

## PH-080 Refactor this code to not nest functions more than 4 levels deep. (9× in file)

```yaml
id: PH-080
category: code
title: Refactor this code to not nest functions more than 4 levels deep. (9× in file)
severity: minor
traffic: 0.12984196531736986
confidence: tool-reported
evidence:
  - src/hooks/useQuoteActions.js:45
  - src/hooks/useQuoteActions.js:49
  - src/hooks/useQuoteActions.js:57
  - src/hooks/useQuoteActions.js:70
  - src/hooks/useQuoteActions.js:119
  - src/hooks/useQuoteActions.js:141
  - src/hooks/useQuoteActions.js:182
  - src/hooks/useQuoteActions.js:205
  - src/hooks/useQuoteActions.js:220
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/hooks/useQuoteActions.js:sonarjs/no-nested-functions
```

## PH-081 Remove the declaration of the unused 'shareAsImage' variable.

```yaml
id: PH-081
category: code
title: Remove the declaration of the unused 'shareAsImage' variable.
severity: minor
traffic: 0.12984196531736986
confidence: tool-reported
evidence:
  - src/hooks/useQuoteActions.js:75
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/hooks/useQuoteActions.js:sonarjs/no-unused-vars
```

## PH-082 Remove this useless assignment to variable "shareAsImage".

```yaml
id: PH-082
category: code
title: Remove this useless assignment to variable "shareAsImage".
severity: minor
traffic: 0.12984196531736986
confidence: tool-reported
evidence:
  - src/hooks/useQuoteActions.js:75
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/hooks/useQuoteActions.js:sonarjs/no-dead-store
```

## PH-083 Refactor this function to reduce its Cognitive Complexity from 22 to the 15 allowed. (2× in file)

```yaml
id: PH-083
category: code
title: Refactor this function to reduce its Cognitive Complexity from 22 to the
  15 allowed. (2× in file)
severity: minor
traffic: 0.12984196531736986
confidence: tool-reported
evidence:
  - src/hooks/useQuoteActions.js:152
  - src/hooks/useQuoteActions.js:246
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/hooks/useQuoteActions.js:sonarjs/cognitive-complexity
```

## PH-084 Remove this unused import of 'useState'.

```yaml
id: PH-084
category: code
title: Remove this unused import of 'useState'.
severity: minor
traffic: 0.1728413322246163
confidence: tool-reported
evidence:
  - src/hooks/useSync.js:9
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/hooks/useSync.js:sonarjs/unused-import
```

## PH-085 Extract this nested ternary operation into an independent statement.

```yaml
id: PH-085
category: code
title: Extract this nested ternary operation into an independent statement.
severity: minor
traffic: 0.08079818555604534
confidence: tool-reported
evidence:
  - src/hooks/useTheme.js:110
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/hooks/useTheme.js:sonarjs/no-nested-conditional
```

## PH-086 Remove this unused import of 'MAX_QUOTE_TEXT_LENGTH'. (3× in file)

```yaml
id: PH-086
category: code
title: Remove this unused import of 'MAX_QUOTE_TEXT_LENGTH'. (3× in file)
severity: minor
traffic: 0.08799019219292169
confidence: tool-reported
evidence:
  - src/stores/quotesStore.js:17
  - src/stores/quotesStore.js:17
  - src/stores/quotesStore.js:17
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/stores/quotesStore.js:sonarjs/unused-import
```

## PH-087 Refactor this code to not nest functions more than 4 levels deep. (2× in file)

```yaml
id: PH-087
category: code
title: Refactor this code to not nest functions more than 4 levels deep. (2× in file)
severity: minor
traffic: 0.08799019219292169
confidence: tool-reported
evidence:
  - src/stores/quotesStore.js:279
  - src/stores/quotesStore.js:295
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/stores/quotesStore.js:sonarjs/no-nested-functions
```

## PH-088 Refactor this function to reduce its Cognitive Complexity from 20 to the 15 allowed.

```yaml
id: PH-088
category: code
title: Refactor this function to reduce its Cognitive Complexity from 20 to the
  15 allowed.
severity: minor
traffic: 0.08799019219292169
confidence: tool-reported
evidence:
  - src/stores/quotesStore.js:324
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/stores/quotesStore.js:sonarjs/cognitive-complexity
```

## PH-089 Remove this unused import of 'afterAll'.

```yaml
id: PH-089
category: code
title: Remove this unused import of 'afterAll'.
severity: minor
traffic: 0.004057587450102813
confidence: tool-reported
evidence:
  - src/utils/__tests__/storage.test.js:1
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/utils/__tests__/storage.test.js:sonarjs/unused-import
```

## PH-090 Extract the assignment of "md" from this expression. (6× in file)

```yaml
id: PH-090
category: code
title: Extract the assignment of "md" from this expression. (6× in file)
severity: minor
traffic: 0.07927128382516026
confidence: tool-reported
evidence:
  - src/utils/export.js:94
  - src/utils/export.js:95
  - src/utils/export.js:131
  - src/utils/export.js:131
  - src/utils/export.js:161
  - src/utils/export.js:161
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/utils/export.js:sonarjs/no-nested-assignment
```

## PH-091 Extract the assignment of "grouped[k]" from this expression.

```yaml
id: PH-091
category: code
title: Extract the assignment of "grouped[k]" from this expression.
severity: minor
traffic: 0.11158162509195371
confidence: tool-reported
evidence:
  - src/utils/helpers.js:30
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/utils/helpers.js:sonarjs/no-nested-assignment
```

## PH-092 This statement will not be executed in a loop; only the first statement will be. The rest will execute only once. (2× in file)

```yaml
id: PH-092
category: code
title: This statement will not be executed in a loop; only the first statement
  will be. The rest will execute only once. (2× in file)
severity: minor
traffic: 0.11158162509195371
confidence: tool-reported
evidence:
  - src/utils/helpers.js:61
  - src/utils/helpers.js:64
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/utils/helpers.js:sonarjs/no-unenclosed-multiline-block
```

## PH-094 Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed. (3× in file)

```yaml
id: PH-094
category: code
title: Refactor this function to reduce its Cognitive Complexity from 16 to the
  15 allowed. (3× in file)
severity: minor
traffic: 0.019102130751301752
confidence: tool-reported
evidence:
  - src/utils/parsers.js:86
  - src/utils/parsers.js:112
  - src/utils/parsers.js:151
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/utils/parsers.js:sonarjs/cognitive-complexity
```

## PH-095 Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed. (2× in file)

```yaml
id: PH-095
category: code
title: Refactor this function to reduce its Cognitive Complexity from 18 to the
  15 allowed. (2× in file)
severity: minor
traffic: 0.043499440247911254
confidence: tool-reported
evidence:
  - src/utils/quotes.js:31
  - src/utils/quotes.js:106
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/utils/quotes.js:sonarjs/cognitive-complexity
```

## PH-096 This branch's code block is the same as the block for the branch on line 115.

```yaml
id: PH-096
category: code
title: This branch's code block is the same as the block for the branch on line 115.
severity: minor
traffic: 0.043499440247911254
confidence: tool-reported
evidence:
  - src/utils/quotes.js:116
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/utils/quotes.js:sonarjs/no-duplicated-branches
```

## PH-097 Extract this nested ternary operation into an independent statement. (2× in file)

```yaml
id: PH-097
category: code
title: Extract this nested ternary operation into an independent statement. (2×
  in file)
severity: minor
traffic: 0.031266030918961296
confidence: tool-reported
evidence:
  - src/utils/shareImage.js:70
  - src/utils/shareImage.js:70
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/utils/shareImage.js:sonarjs/no-nested-conditional
```

## PH-098 Refactor this function to reduce its Cognitive Complexity from 33 to the 15 allowed.

```yaml
id: PH-098
category: code
title: Refactor this function to reduce its Cognitive Complexity from 33 to the
  15 allowed.
severity: minor
traffic: 0.02817701579309893
confidence: tool-reported
evidence:
  - src/utils/smartRestore.js:45
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/utils/smartRestore.js:sonarjs/cognitive-complexity
```

## PH-100 If multiple spaces are required here, use number quantifier ({2}).

```yaml
id: PH-100
category: code
title: If multiple spaces are required here, use number quantifier ({2}).
severity: minor
traffic: 0.066302697349501
confidence: tool-reported
evidence:
  - src/utils/textFormatting.js:109
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/utils/textFormatting.js:sonarjs/no-regex-spaces
```

## PH-102 Refactor this code to not use nested template literals.

```yaml
id: PH-102
category: code
title: Refactor this code to not use nested template literals.
severity: minor
traffic: 0.10359896029435692
confidence: tool-reported
evidence:
  - vite.config.js:65
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:vite.config.js:sonarjs/no-nested-template-literals
```

## PH-103 Identical block (14 lines) copied between api/fetch-url.js and api/fetch-url.js

```yaml
id: PH-103
category: code
title: Identical block (14 lines) copied between api/fetch-url.js and api/fetch-url.js
severity: minor
traffic: 0.06340544648552357
confidence: tool-reported
evidence:
  - api/fetch-url.js:266
  - api/fetch-url.js:299
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:api/fetch-url.js:dup-api/fetch-url.js-14
```

## PH-104 Identical block (8 lines) copied between index.html and public/privacy.html

```yaml
id: PH-104
category: code
title: Identical block (8 lines) copied between index.html and public/privacy.html
severity: minor
traffic: 0.11508057391848683
confidence: tool-reported
evidence:
  - index.html:19
  - public/privacy.html:15
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:index.html:dup-public/privacy.html-8
```

## PH-105 Identical block (8 lines) copied between index.html and public/terms.html

```yaml
id: PH-105
category: code
title: Identical block (8 lines) copied between index.html and public/terms.html
severity: minor
traffic: 0.11508057391848683
confidence: tool-reported
evidence:
  - index.html:19
  - public/terms.html:15
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:index.html:dup-public/terms.html-8
```

## PH-106 Identical block (7 lines) copied between public/404.html and public/privacy.html

```yaml
id: PH-106
category: code
title: Identical block (7 lines) copied between public/404.html and
  public/privacy.html
severity: minor
traffic: 0.05120763457403553
confidence: tool-reported
evidence:
  - public/404.html:8
  - public/privacy.html:25
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:public/404.html:dup-public/privacy.html-7
```

## PH-107 Identical block (14 lines) copied between public/404.html and public/privacy.html

```yaml
id: PH-107
category: code
title: Identical block (14 lines) copied between public/404.html and
  public/privacy.html
severity: minor
traffic: 0.05120763457403553
confidence: tool-reported
evidence:
  - public/404.html:17
  - public/privacy.html:34
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:public/404.html:dup-public/privacy.html-14
```

## PH-108 Identical block (36 lines) copied between public/privacy.html and public/terms.html

```yaml
id: PH-108
category: code
title: Identical block (36 lines) copied between public/privacy.html and
  public/terms.html
severity: minor
traffic: 0.05120763457403553
confidence: tool-reported
evidence:
  - public/privacy.html:23
  - public/terms.html:23
source:
  - jscpd
repair_cost: M
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:public/privacy.html:dup-public/terms.html-36
```

## PH-109 Identical block (9 lines) copied between public/privacy.html and public/terms.html

```yaml
id: PH-109
category: code
title: Identical block (9 lines) copied between public/privacy.html and
  public/terms.html
severity: minor
traffic: 0.05120763457403553
confidence: tool-reported
evidence:
  - public/privacy.html:51
  - public/terms.html:51
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:public/privacy.html:dup-public/terms.html-9
```

## PH-110 Identical block (9 lines) copied between src/components/App.jsx and src/components/ResultsPhase.jsx

```yaml
id: PH-110
category: code
title: Identical block (9 lines) copied between src/components/App.jsx and
  src/components/ResultsPhase.jsx
severity: minor
traffic: 0.75153996915182
confidence: tool-reported
evidence:
  - src/components/App.jsx:32
  - src/components/ResultsPhase.jsx:188
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/App.jsx:dup-src/components/ResultsPhase.jsx-9
```

## PH-111 Identical block (6 lines) copied between src/components/App.jsx and src/components/ResultsPhase.jsx

```yaml
id: PH-111
category: code
title: Identical block (6 lines) copied between src/components/App.jsx and
  src/components/ResultsPhase.jsx
severity: minor
traffic: 0.75153996915182
confidence: tool-reported
evidence:
  - src/components/App.jsx:44
  - src/components/ResultsPhase.jsx:210
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/App.jsx:dup-src/components/ResultsPhase.jsx-6
```

## PH-112 Identical block (8 lines) copied between src/components/CardItem.jsx and src/components/TableView.jsx

```yaml
id: PH-112
category: code
title: Identical block (8 lines) copied between src/components/CardItem.jsx and
  src/components/TableView.jsx
severity: minor
traffic: 0.5664513387639842
confidence: tool-reported
evidence:
  - src/components/CardItem.jsx:126
  - src/components/TableView.jsx:191
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/CardItem.jsx:dup-src/components/TableView.jsx-8
```

## PH-113 Identical block (6 lines) copied between src/components/CollectionDupeModal.jsx and src/components/DupeModal.jsx

```yaml
id: PH-113
category: code
title: Identical block (6 lines) copied between
  src/components/CollectionDupeModal.jsx and src/components/DupeModal.jsx
severity: minor
traffic: 0.10900856872698018
confidence: tool-reported
evidence:
  - src/components/CollectionDupeModal.jsx:76
  - src/components/DupeModal.jsx:19
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/CollectionDupeModal.jsx:dup-src/components/DupeModal.jsx-6
```

## PH-114 Identical block (21 lines) copied between src/components/CollectionDupeModal.jsx and src/components/DupeModal.jsx

```yaml
id: PH-114
category: code
title: Identical block (21 lines) copied between
  src/components/CollectionDupeModal.jsx and src/components/DupeModal.jsx
severity: minor
traffic: 0.10900856872698018
confidence: tool-reported
evidence:
  - src/components/CollectionDupeModal.jsx:185
  - src/components/DupeModal.jsx:171
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/CollectionDupeModal.jsx:dup-src/components/DupeModal.jsx-21
```

## PH-115 Identical block (12 lines) copied between src/components/EmptyState.jsx and src/components/EmptyState.jsx

```yaml
id: PH-115
category: code
title: Identical block (12 lines) copied between src/components/EmptyState.jsx
  and src/components/EmptyState.jsx
severity: minor
traffic: 0.07329972781318894
confidence: tool-reported
evidence:
  - src/components/EmptyState.jsx:81
  - src/components/EmptyState.jsx:133
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/EmptyState.jsx:dup-src/components/EmptyState.jsx-12
```

## PH-116 Identical block (9 lines) copied between src/components/EntryReviewModal.jsx and src/components/UrlPreviewModal.jsx

```yaml
id: PH-116
category: code
title: Identical block (9 lines) copied between
  src/components/EntryReviewModal.jsx and src/components/UrlPreviewModal.jsx
severity: minor
traffic: 0.09044540289132785
confidence: tool-reported
evidence:
  - src/components/EntryReviewModal.jsx:13
  - src/components/UrlPreviewModal.jsx:22
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/EntryReviewModal.jsx:dup-src/components/UrlPreviewModal.jsx-9
```

## PH-117 Identical block (10 lines) copied between src/components/EntryReviewModal.jsx and src/components/UrlPreviewModal.jsx

```yaml
id: PH-117
category: code
title: Identical block (10 lines) copied between
  src/components/EntryReviewModal.jsx and src/components/UrlPreviewModal.jsx
severity: minor
traffic: 0.09044540289132785
confidence: tool-reported
evidence:
  - src/components/EntryReviewModal.jsx:24
  - src/components/UrlPreviewModal.jsx:44
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/EntryReviewModal.jsx:dup-src/components/UrlPreviewModal.jsx-10
```

## PH-118 Identical block (18 lines) copied between src/components/ErrorBoundary.jsx and src/components/SectionErrorBoundary.jsx

```yaml
id: PH-118
category: code
title: Identical block (18 lines) copied between
  src/components/ErrorBoundary.jsx and src/components/SectionErrorBoundary.jsx
severity: minor
traffic: 0.015437885461966174
confidence: tool-reported
evidence:
  - src/components/ErrorBoundary.jsx:3
  - src/components/SectionErrorBoundary.jsx:3
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/ErrorBoundary.jsx:dup-src/components/SectionErrorBoundary.jsx-18
```

## PH-119 Identical block (6 lines) copied between src/components/ExportDropdown.jsx and src/components/HeaderControls.jsx

```yaml
id: PH-119
category: code
title: Identical block (6 lines) copied between
  src/components/ExportDropdown.jsx and src/components/HeaderControls.jsx
severity: minor
traffic: 0.19453210748037558
confidence: tool-reported
evidence:
  - src/components/ExportDropdown.jsx:126
  - src/components/HeaderControls.jsx:69
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/ExportDropdown.jsx:dup-src/components/HeaderControls.jsx-6
```

## PH-120 Identical block (6 lines) copied between src/components/QuickAddBar.jsx and src/components/QuickAddBar.jsx

```yaml
id: PH-120
category: code
title: Identical block (6 lines) copied between src/components/QuickAddBar.jsx
  and src/components/QuickAddBar.jsx
severity: minor
traffic: 0.11527756634140444
confidence: tool-reported
evidence:
  - src/components/QuickAddBar.jsx:62
  - src/components/QuickAddBar.jsx:80
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/QuickAddBar.jsx:dup-src/components/QuickAddBar.jsx-6
```

## PH-121 Identical block (14 lines) copied between src/components/QuoteActions.jsx and src/components/TableView.jsx

```yaml
id: PH-121
category: code
title: Identical block (14 lines) copied between src/components/QuoteActions.jsx
  and src/components/TableView.jsx
severity: minor
traffic: 0.5664513387639842
confidence: tool-reported
evidence:
  - src/components/QuoteActions.jsx:47
  - src/components/TableView.jsx:41
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/QuoteActions.jsx:dup-src/components/TableView.jsx-14
```

## PH-122 Identical block (11 lines) copied between src/components/QuoteActions.jsx and src/components/TableView.jsx

```yaml
id: PH-122
category: code
title: Identical block (11 lines) copied between src/components/QuoteActions.jsx
  and src/components/TableView.jsx
severity: minor
traffic: 0.5664513387639842
confidence: tool-reported
evidence:
  - src/components/QuoteActions.jsx:73
  - src/components/TableView.jsx:61
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/QuoteActions.jsx:dup-src/components/TableView.jsx-11
```

## PH-123 Identical block (8 lines) copied between src/components/ResultsPhase.jsx and src/components/TableView.jsx

```yaml
id: PH-123
category: code
title: Identical block (8 lines) copied between src/components/ResultsPhase.jsx
  and src/components/TableView.jsx
severity: minor
traffic: 0.5664513387639842
confidence: tool-reported
evidence:
  - src/components/ResultsPhase.jsx:87
  - src/components/TableView.jsx:328
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/ResultsPhase.jsx:dup-src/components/TableView.jsx-8
```

## PH-124 Identical block (13 lines) copied between src/components/ResultsPhase.jsx and src/components/TableView.jsx

```yaml
id: PH-124
category: code
title: Identical block (13 lines) copied between src/components/ResultsPhase.jsx
  and src/components/TableView.jsx
severity: minor
traffic: 0.5664513387639842
confidence: tool-reported
evidence:
  - src/components/ResultsPhase.jsx:94
  - src/components/TableView.jsx:379
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/ResultsPhase.jsx:dup-src/components/TableView.jsx-13
```

## PH-125 Identical block (11 lines) copied between src/components/ResultsPhase.jsx and src/components/TableView.jsx

```yaml
id: PH-125
category: code
title: Identical block (11 lines) copied between src/components/ResultsPhase.jsx
  and src/components/TableView.jsx
severity: minor
traffic: 0.5664513387639842
confidence: tool-reported
evidence:
  - src/components/ResultsPhase.jsx:108
  - src/components/TableView.jsx:395
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/ResultsPhase.jsx:dup-src/components/TableView.jsx-11
```

## PH-126 Identical block (12 lines) copied between src/components/ResultsPhase.jsx and src/components/ResultsPhase.jsx

```yaml
id: PH-126
category: code
title: Identical block (12 lines) copied between src/components/ResultsPhase.jsx
  and src/components/ResultsPhase.jsx
severity: minor
traffic: 0.42808818545053934
confidence: tool-reported
evidence:
  - src/components/ResultsPhase.jsx:126
  - src/components/ResultsPhase.jsx:1046
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/ResultsPhase.jsx:dup-src/components/ResultsPhase.jsx-12
```

## PH-127 Identical block (10 lines) copied between src/components/ResultsPhase.jsx and src/components/TableView.jsx

```yaml
id: PH-127
category: code
title: Identical block (10 lines) copied between src/components/ResultsPhase.jsx
  and src/components/TableView.jsx
severity: minor
traffic: 0.5664513387639842
confidence: tool-reported
evidence:
  - src/components/ResultsPhase.jsx:126
  - src/components/TableView.jsx:468
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/ResultsPhase.jsx:dup-src/components/TableView.jsx-10
```

## PH-128 Identical block (17 lines) copied between src/components/ResultsPhase.jsx and src/components/ResultsPhase.jsx

```yaml
id: PH-128
category: code
title: Identical block (17 lines) copied between src/components/ResultsPhase.jsx
  and src/components/ResultsPhase.jsx
severity: minor
traffic: 0.42808818545053934
confidence: tool-reported
evidence:
  - src/components/ResultsPhase.jsx:146
  - src/components/ResultsPhase.jsx:1066
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/ResultsPhase.jsx:dup-src/components/ResultsPhase.jsx-17
```

## PH-129 Identical block (10 lines) copied between src/components/ResultsPhase.jsx and src/components/ResultsPhase.jsx

```yaml
id: PH-129
category: code
title: Identical block (10 lines) copied between src/components/ResultsPhase.jsx
  and src/components/ResultsPhase.jsx
severity: minor
traffic: 0.42808818545053934
confidence: tool-reported
evidence:
  - src/components/ResultsPhase.jsx:754
  - src/components/ResultsPhase.jsx:787
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/ResultsPhase.jsx:dup-src/components/ResultsPhase.jsx-10
```

## PH-130 Identical block (8 lines) copied between src/components/ResultsPhase.jsx and src/components/ResultsPhase.jsx

```yaml
id: PH-130
category: code
title: Identical block (8 lines) copied between src/components/ResultsPhase.jsx
  and src/components/ResultsPhase.jsx
severity: minor
traffic: 0.42808818545053934
confidence: tool-reported
evidence:
  - src/components/ResultsPhase.jsx:827
  - src/components/ResultsPhase.jsx:855
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/ResultsPhase.jsx:dup-src/components/ResultsPhase.jsx-8
```

## PH-131 Identical block (6 lines) copied between src/components/ResultsPhase.jsx and src/components/ScrollTopButton.jsx

```yaml
id: PH-131
category: code
title: Identical block (6 lines) copied between src/components/ResultsPhase.jsx
  and src/components/ScrollTopButton.jsx
severity: minor
traffic: 0.42808818545053934
confidence: tool-reported
evidence:
  - src/components/ResultsPhase.jsx:1154
  - src/components/ScrollTopButton.jsx:36
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/ResultsPhase.jsx:dup-src/components/ScrollTopButton.jsx-6
```

## PH-132 Identical block (8 lines) copied between src/components/ShareImageModal.jsx and src/components/ShortcutsModal.jsx

```yaml
id: PH-132
category: code
title: Identical block (8 lines) copied between
  src/components/ShareImageModal.jsx and src/components/ShortcutsModal.jsx
severity: minor
traffic: 0.09027476737127609
confidence: tool-reported
evidence:
  - src/components/ShareImageModal.jsx:51
  - src/components/ShortcutsModal.jsx:33
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/ShareImageModal.jsx:dup-src/components/ShortcutsModal.jsx-8
```

## PH-133 Identical block (9 lines) copied between src/components/ShareImageModal.jsx and src/components/ShortcutsModal.jsx

```yaml
id: PH-133
category: code
title: Identical block (9 lines) copied between
  src/components/ShareImageModal.jsx and src/components/ShortcutsModal.jsx
severity: minor
traffic: 0.09027476737127609
confidence: tool-reported
evidence:
  - src/components/ShareImageModal.jsx:60
  - src/components/ShortcutsModal.jsx:42
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/ShareImageModal.jsx:dup-src/components/ShortcutsModal.jsx-9
```

## PH-134 Identical block (7 lines) copied between src/components/StatsPanel.jsx and src/components/StatsPanel.jsx

```yaml
id: PH-134
category: code
title: Identical block (7 lines) copied between src/components/StatsPanel.jsx
  and src/components/StatsPanel.jsx
severity: minor
traffic: 0.12211725375102825
confidence: tool-reported
evidence:
  - src/components/StatsPanel.jsx:18
  - src/components/StatsPanel.jsx:128
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/StatsPanel.jsx:dup-src/components/StatsPanel.jsx-7
```

## PH-135 Identical block (19 lines) copied between src/components/__tests__/App.test.jsx and src/components/__tests__/InputPhase.test.jsx

```yaml
id: PH-135
category: code
title: Identical block (19 lines) copied between
  src/components/__tests__/App.test.jsx and
  src/components/__tests__/InputPhase.test.jsx
severity: minor
traffic: 0.04419760466101544
confidence: tool-reported
evidence:
  - src/components/__tests__/App.test.jsx:4
  - src/components/__tests__/InputPhase.test.jsx:5
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/__tests__/App.test.jsx:dup-src/components/__tests__/InputPhase.test.jsx-19
```

## PH-136 Identical block (10 lines) copied between src/components/__tests__/App.test.jsx and src/components/__tests__/HeaderControls.test.jsx

```yaml
id: PH-136
category: code
title: Identical block (10 lines) copied between
  src/components/__tests__/App.test.jsx and
  src/components/__tests__/HeaderControls.test.jsx
severity: minor
traffic: 0.028873634449044273
confidence: tool-reported
evidence:
  - src/components/__tests__/App.test.jsx:13
  - src/components/__tests__/HeaderControls.test.jsx:7
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/__tests__/App.test.jsx:dup-src/components/__tests__/HeaderControls.test.jsx-10
```

## PH-137 Identical block (10 lines) copied between src/components/__tests__/App.test.jsx and src/components/__tests__/ResultsPhase.test.jsx

```yaml
id: PH-137
category: code
title: Identical block (10 lines) copied between
  src/components/__tests__/App.test.jsx and
  src/components/__tests__/ResultsPhase.test.jsx
severity: minor
traffic: 0.028873634449044273
confidence: tool-reported
evidence:
  - src/components/__tests__/App.test.jsx:13
  - src/components/__tests__/ResultsPhase.test.jsx:21
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/__tests__/App.test.jsx:dup-src/components/__tests__/ResultsPhase.test.jsx-10
```

## PH-138 Identical block (9 lines) copied between src/components/__tests__/App.test.jsx and src/components/__tests__/ResultsPhase.test.jsx

```yaml
id: PH-138
category: code
title: Identical block (9 lines) copied between
  src/components/__tests__/App.test.jsx and
  src/components/__tests__/ResultsPhase.test.jsx
severity: minor
traffic: 0.028873634449044273
confidence: tool-reported
evidence:
  - src/components/__tests__/App.test.jsx:97
  - src/components/__tests__/ResultsPhase.test.jsx:166
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/__tests__/App.test.jsx:dup-src/components/__tests__/ResultsPhase.test.jsx-9
```

## PH-139 Identical block (8 lines) copied between src/components/__tests__/App.test.jsx and src/components/__tests__/ResultsPhase.test.jsx

```yaml
id: PH-139
category: code
title: Identical block (8 lines) copied between
  src/components/__tests__/App.test.jsx and
  src/components/__tests__/ResultsPhase.test.jsx
severity: minor
traffic: 0.028873634449044273
confidence: tool-reported
evidence:
  - src/components/__tests__/App.test.jsx:137
  - src/components/__tests__/ResultsPhase.test.jsx:188
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/__tests__/App.test.jsx:dup-src/components/__tests__/ResultsPhase.test.jsx-8
```

## PH-140 Identical block (11 lines) copied between src/components/__tests__/CollectionDupeModal.test.js and src/components/__tests__/CollectionDupeModal.test.js

```yaml
id: PH-140
category: code
title: Identical block (11 lines) copied between
  src/components/__tests__/CollectionDupeModal.test.js and
  src/components/__tests__/CollectionDupeModal.test.js
severity: minor
traffic: 0.0046501728851701726
confidence: tool-reported
evidence:
  - src/components/__tests__/CollectionDupeModal.test.js:31
  - src/components/__tests__/CollectionDupeModal.test.js:47
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/__tests__/CollectionDupeModal.test.js:dup-src/components/__tests__/CollectionDupeModal.test.js-11
```

## PH-141 Identical block (11 lines) copied between src/components/__tests__/HeaderControls.test.jsx and src/components/__tests__/InputPhase.test.jsx

```yaml
id: PH-141
category: code
title: Identical block (11 lines) copied between
  src/components/__tests__/HeaderControls.test.jsx and
  src/components/__tests__/InputPhase.test.jsx
severity: minor
traffic: 0.04419760466101544
confidence: tool-reported
evidence:
  - src/components/__tests__/HeaderControls.test.jsx:9
  - src/components/__tests__/InputPhase.test.jsx:19
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/__tests__/HeaderControls.test.jsx:dup-src/components/__tests__/InputPhase.test.jsx-11
```

## PH-142 Identical block (11 lines) copied between src/components/__tests__/HeaderControls.test.jsx and src/components/__tests__/ResultsPhase.test.jsx

```yaml
id: PH-142
category: code
title: Identical block (11 lines) copied between
  src/components/__tests__/HeaderControls.test.jsx and
  src/components/__tests__/ResultsPhase.test.jsx
severity: minor
traffic: 0.028795334982161476
confidence: tool-reported
evidence:
  - src/components/__tests__/HeaderControls.test.jsx:9
  - src/components/__tests__/ResultsPhase.test.jsx:25
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/__tests__/HeaderControls.test.jsx:dup-src/components/__tests__/ResultsPhase.test.jsx-11
```

## PH-143 Identical block (11 lines) copied between src/components/__tests__/InputPhase.test.jsx and src/components/__tests__/ResultsPhase.test.jsx

```yaml
id: PH-143
category: code
title: Identical block (11 lines) copied between
  src/components/__tests__/InputPhase.test.jsx and
  src/components/__tests__/ResultsPhase.test.jsx
severity: minor
traffic: 0.04419760466101544
confidence: tool-reported
evidence:
  - src/components/__tests__/InputPhase.test.jsx:24
  - src/components/__tests__/ResultsPhase.test.jsx:30
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/__tests__/InputPhase.test.jsx:dup-src/components/__tests__/ResultsPhase.test.jsx-11
```

## PH-144 Identical block (6 lines) copied between src/components/__tests__/InputPhase.test.jsx and src/components/__tests__/InputPhase.test.jsx

```yaml
id: PH-144
category: code
title: Identical block (6 lines) copied between
  src/components/__tests__/InputPhase.test.jsx and
  src/components/__tests__/InputPhase.test.jsx
severity: minor
traffic: 0.04419760466101544
confidence: tool-reported
evidence:
  - src/components/__tests__/InputPhase.test.jsx:268
  - src/components/__tests__/InputPhase.test.jsx:288
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/__tests__/InputPhase.test.jsx:dup-src/components/__tests__/InputPhase.test.jsx-6
```

## PH-145 Identical block (22 lines) copied between src/hooks/__tests__/lookupConfidence.test.js and src/hooks/__tests__/processingErrors.test.js

```yaml
id: PH-145
category: code
title: Identical block (22 lines) copied between
  src/hooks/__tests__/lookupConfidence.test.js and
  src/hooks/__tests__/processingErrors.test.js
severity: minor
traffic: 0.03468291664444509
confidence: tool-reported
evidence:
  - src/hooks/__tests__/lookupConfidence.test.js:3
  - src/hooks/__tests__/processingErrors.test.js:3
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/hooks/__tests__/lookupConfidence.test.js:dup-src/hooks/__tests__/processingErrors.test.js-22
```

## PH-146 Identical block (23 lines) copied between src/hooks/__tests__/lookupConfidence.test.js and src/hooks/__tests__/processingErrors.test.js

```yaml
id: PH-146
category: code
title: Identical block (23 lines) copied between
  src/hooks/__tests__/lookupConfidence.test.js and
  src/hooks/__tests__/processingErrors.test.js
severity: minor
traffic: 0.03468291664444509
confidence: tool-reported
evidence:
  - src/hooks/__tests__/lookupConfidence.test.js:27
  - src/hooks/__tests__/processingErrors.test.js:41
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/hooks/__tests__/lookupConfidence.test.js:dup-src/hooks/__tests__/processingErrors.test.js-23
```

## PH-147 Identical block (15 lines) copied between src/hooks/__tests__/lookupConfidence.test.js and src/hooks/__tests__/processingErrors.test.js

```yaml
id: PH-147
category: code
title: Identical block (15 lines) copied between
  src/hooks/__tests__/lookupConfidence.test.js and
  src/hooks/__tests__/processingErrors.test.js
severity: minor
traffic: 0.03468291664444509
confidence: tool-reported
evidence:
  - src/hooks/__tests__/lookupConfidence.test.js:49
  - src/hooks/__tests__/processingErrors.test.js:60
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/hooks/__tests__/lookupConfidence.test.js:dup-src/hooks/__tests__/processingErrors.test.js-15
```

## PH-148 Identical block (8 lines) copied between src/hooks/__tests__/lookupConfidence.test.js and src/hooks/__tests__/processingErrors.test.js

```yaml
id: PH-148
category: code
title: Identical block (8 lines) copied between
  src/hooks/__tests__/lookupConfidence.test.js and
  src/hooks/__tests__/processingErrors.test.js
severity: minor
traffic: 0.03468291664444509
confidence: tool-reported
evidence:
  - src/hooks/__tests__/lookupConfidence.test.js:63
  - src/hooks/__tests__/processingErrors.test.js:74
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/hooks/__tests__/lookupConfidence.test.js:dup-src/hooks/__tests__/processingErrors.test.js-8
```

## PH-149 Identical block (6 lines) copied between src/hooks/__tests__/lookupConfidence.test.js and src/hooks/__tests__/lookupConfidence.test.js

```yaml
id: PH-149
category: code
title: Identical block (6 lines) copied between
  src/hooks/__tests__/lookupConfidence.test.js and
  src/hooks/__tests__/lookupConfidence.test.js
severity: minor
traffic: 0.03468291664444509
confidence: tool-reported
evidence:
  - src/hooks/__tests__/lookupConfidence.test.js:65
  - src/hooks/__tests__/lookupConfidence.test.js:139
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/hooks/__tests__/lookupConfidence.test.js:dup-src/hooks/__tests__/lookupConfidence.test.js-6
```

## PH-150 Identical block (16 lines) copied between src/hooks/__tests__/lookupConfidence.test.js and src/hooks/__tests__/lookupConfidence.test.js

```yaml
id: PH-150
category: code
title: Identical block (16 lines) copied between
  src/hooks/__tests__/lookupConfidence.test.js and
  src/hooks/__tests__/lookupConfidence.test.js
severity: minor
traffic: 0.03468291664444509
confidence: tool-reported
evidence:
  - src/hooks/__tests__/lookupConfidence.test.js:76
  - src/hooks/__tests__/lookupConfidence.test.js:113
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/hooks/__tests__/lookupConfidence.test.js:dup-src/hooks/__tests__/lookupConfidence.test.js-16
```

## PH-151 Identical block (10 lines) copied between src/hooks/__tests__/lookupConfidence.test.js and src/hooks/__tests__/processingErrors.test.js

```yaml
id: PH-151
category: code
title: Identical block (10 lines) copied between
  src/hooks/__tests__/lookupConfidence.test.js and
  src/hooks/__tests__/processingErrors.test.js
severity: minor
traffic: 0.03468291664444509
confidence: tool-reported
evidence:
  - src/hooks/__tests__/lookupConfidence.test.js:76
  - src/hooks/__tests__/processingErrors.test.js:84
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/hooks/__tests__/lookupConfidence.test.js:dup-src/hooks/__tests__/processingErrors.test.js-10
```

## PH-152 Identical block (9 lines) copied between src/hooks/__tests__/lookupConfidence.test.js and src/hooks/__tests__/processingErrors.test.js

```yaml
id: PH-152
category: code
title: Identical block (9 lines) copied between
  src/hooks/__tests__/lookupConfidence.test.js and
  src/hooks/__tests__/processingErrors.test.js
severity: minor
traffic: 0.03468291664444509
confidence: tool-reported
evidence:
  - src/hooks/__tests__/lookupConfidence.test.js:76
  - src/hooks/__tests__/processingErrors.test.js:152
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/hooks/__tests__/lookupConfidence.test.js:dup-src/hooks/__tests__/processingErrors.test.js-9
```

## PH-153 Identical block (12 lines) copied between src/hooks/__tests__/lookupConfidence.test.js and src/hooks/__tests__/lookupConfidence.test.js

```yaml
id: PH-153
category: code
title: Identical block (12 lines) copied between
  src/hooks/__tests__/lookupConfidence.test.js and
  src/hooks/__tests__/lookupConfidence.test.js
severity: minor
traffic: 0.03468291664444509
confidence: tool-reported
evidence:
  - src/hooks/__tests__/lookupConfidence.test.js:78
  - src/hooks/__tests__/lookupConfidence.test.js:149
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/hooks/__tests__/lookupConfidence.test.js:dup-src/hooks/__tests__/lookupConfidence.test.js-12
```

## PH-154 Identical block (7 lines) copied between src/hooks/__tests__/lookupConfidence.test.js and src/hooks/__tests__/processingErrors.test.js

```yaml
id: PH-154
category: code
title: Identical block (7 lines) copied between
  src/hooks/__tests__/lookupConfidence.test.js and
  src/hooks/__tests__/processingErrors.test.js
severity: minor
traffic: 0.03468291664444509
confidence: tool-reported
evidence:
  - src/hooks/__tests__/lookupConfidence.test.js:99
  - src/hooks/__tests__/processingErrors.test.js:141
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/hooks/__tests__/lookupConfidence.test.js:dup-src/hooks/__tests__/processingErrors.test.js-7
```

## PH-155 Identical block (10 lines) copied between src/hooks/__tests__/lookupConfidence.test.js and src/hooks/__tests__/lookupConfidence.test.js

```yaml
id: PH-155
category: code
title: Identical block (10 lines) copied between
  src/hooks/__tests__/lookupConfidence.test.js and
  src/hooks/__tests__/lookupConfidence.test.js
severity: minor
traffic: 0.03468291664444509
confidence: tool-reported
evidence:
  - src/hooks/__tests__/lookupConfidence.test.js:100
  - src/hooks/__tests__/lookupConfidence.test.js:139
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/hooks/__tests__/lookupConfidence.test.js:dup-src/hooks/__tests__/lookupConfidence.test.js-10
```

## PH-156 Identical block (7 lines) copied between src/hooks/__tests__/lookupConfidence.test.js and src/hooks/__tests__/processingErrors.test.js

```yaml
id: PH-156
category: code
title: Identical block (7 lines) copied between
  src/hooks/__tests__/lookupConfidence.test.js and
  src/hooks/__tests__/processingErrors.test.js
severity: minor
traffic: 0.03468291664444509
confidence: tool-reported
evidence:
  - src/hooks/__tests__/lookupConfidence.test.js:138
  - src/hooks/__tests__/processingErrors.test.js:109
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/hooks/__tests__/lookupConfidence.test.js:dup-src/hooks/__tests__/processingErrors.test.js-7
```

## PH-157 Identical block (7 lines) copied between src/hooks/__tests__/lookupConfidence.test.js and src/hooks/__tests__/processingErrors.test.js

```yaml
id: PH-157
category: code
title: Identical block (7 lines) copied between
  src/hooks/__tests__/lookupConfidence.test.js and
  src/hooks/__tests__/processingErrors.test.js
severity: minor
traffic: 0.03468291664444509
confidence: tool-reported
evidence:
  - src/hooks/__tests__/lookupConfidence.test.js:138
  - src/hooks/__tests__/processingErrors.test.js:178
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/hooks/__tests__/lookupConfidence.test.js:dup-src/hooks/__tests__/processingErrors.test.js-7
```

## PH-158 Identical block (8 lines) copied between src/hooks/__tests__/lookupConfidence.test.js and src/hooks/__tests__/processingErrors.test.js

```yaml
id: PH-158
category: code
title: Identical block (8 lines) copied between
  src/hooks/__tests__/lookupConfidence.test.js and
  src/hooks/__tests__/processingErrors.test.js
severity: minor
traffic: 0.03468291664444509
confidence: tool-reported
evidence:
  - src/hooks/__tests__/lookupConfidence.test.js:146
  - src/hooks/__tests__/processingErrors.test.js:112
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/hooks/__tests__/lookupConfidence.test.js:dup-src/hooks/__tests__/processingErrors.test.js-8
```

## PH-159 Identical block (13 lines) copied between src/hooks/__tests__/processingErrors.test.js and src/hooks/__tests__/processingErrors.test.js

```yaml
id: PH-159
category: code
title: Identical block (13 lines) copied between
  src/hooks/__tests__/processingErrors.test.js and
  src/hooks/__tests__/processingErrors.test.js
severity: minor
traffic: 0.015986939294133067
confidence: tool-reported
evidence:
  - src/hooks/__tests__/processingErrors.test.js:109
  - src/hooks/__tests__/processingErrors.test.js:178
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/hooks/__tests__/processingErrors.test.js:dup-src/hooks/__tests__/processingErrors.test.js-13
```

## PH-160 Identical block (8 lines) copied between src/hooks/__tests__/processingErrors.test.js and src/hooks/__tests__/processingErrors.test.js

```yaml
id: PH-160
category: code
title: Identical block (8 lines) copied between
  src/hooks/__tests__/processingErrors.test.js and
  src/hooks/__tests__/processingErrors.test.js
severity: minor
traffic: 0.015986939294133067
confidence: tool-reported
evidence:
  - src/hooks/__tests__/processingErrors.test.js:115
  - src/hooks/__tests__/processingErrors.test.js:184
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/hooks/__tests__/processingErrors.test.js:dup-src/hooks/__tests__/processingErrors.test.js-8
```

## PH-161 Identical block (10 lines) copied between src/hooks/__tests__/useEditState.test.js and src/hooks/__tests__/useEditState.test.js

```yaml
id: PH-161
category: code
title: Identical block (10 lines) copied between
  src/hooks/__tests__/useEditState.test.js and
  src/hooks/__tests__/useEditState.test.js
severity: minor
traffic: 0.04315466361411568
confidence: tool-reported
evidence:
  - src/hooks/__tests__/useEditState.test.js:134
  - src/hooks/__tests__/useEditState.test.js:600
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/hooks/__tests__/useEditState.test.js:dup-src/hooks/__tests__/useEditState.test.js-10
```

## PH-162 Identical block (8 lines) copied between src/hooks/__tests__/useEditState.test.js and src/hooks/__tests__/useEditState.test.js

```yaml
id: PH-162
category: code
title: Identical block (8 lines) copied between
  src/hooks/__tests__/useEditState.test.js and
  src/hooks/__tests__/useEditState.test.js
severity: minor
traffic: 0.04315466361411568
confidence: tool-reported
evidence:
  - src/hooks/__tests__/useEditState.test.js:269
  - src/hooks/__tests__/useEditState.test.js:305
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/hooks/__tests__/useEditState.test.js:dup-src/hooks/__tests__/useEditState.test.js-8
```

## PH-163 Identical block (6 lines) copied between src/hooks/__tests__/useEditState.test.js and src/hooks/__tests__/useEditState.test.js

```yaml
id: PH-163
category: code
title: Identical block (6 lines) copied between
  src/hooks/__tests__/useEditState.test.js and
  src/hooks/__tests__/useEditState.test.js
severity: minor
traffic: 0.04315466361411568
confidence: tool-reported
evidence:
  - src/hooks/__tests__/useEditState.test.js:301
  - src/hooks/__tests__/useEditState.test.js:311
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/hooks/__tests__/useEditState.test.js:dup-src/hooks/__tests__/useEditState.test.js-6
```

## PH-164 Identical block (8 lines) copied between src/hooks/__tests__/useEditState.test.js and src/hooks/__tests__/useEditState.test.js

```yaml
id: PH-164
category: code
title: Identical block (8 lines) copied between
  src/hooks/__tests__/useEditState.test.js and
  src/hooks/__tests__/useEditState.test.js
severity: minor
traffic: 0.04315466361411568
confidence: tool-reported
evidence:
  - src/hooks/__tests__/useEditState.test.js:333
  - src/hooks/__tests__/useEditState.test.js:404
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/hooks/__tests__/useEditState.test.js:dup-src/hooks/__tests__/useEditState.test.js-8
```

## PH-165 Identical block (8 lines) copied between src/hooks/__tests__/useEditState.test.js and src/hooks/__tests__/useEditState.test.js

```yaml
id: PH-165
category: code
title: Identical block (8 lines) copied between
  src/hooks/__tests__/useEditState.test.js and
  src/hooks/__tests__/useEditState.test.js
severity: minor
traffic: 0.04315466361411568
confidence: tool-reported
evidence:
  - src/hooks/__tests__/useEditState.test.js:368
  - src/hooks/__tests__/useEditState.test.js:380
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/hooks/__tests__/useEditState.test.js:dup-src/hooks/__tests__/useEditState.test.js-8
```

## PH-166 Identical block (14 lines) copied between src/hooks/__tests__/useEditState.test.js and src/hooks/__tests__/useEditState.test.js

```yaml
id: PH-166
category: code
title: Identical block (14 lines) copied between
  src/hooks/__tests__/useEditState.test.js and
  src/hooks/__tests__/useEditState.test.js
severity: minor
traffic: 0.04315466361411568
confidence: tool-reported
evidence:
  - src/hooks/__tests__/useEditState.test.js:548
  - src/hooks/__tests__/useEditState.test.js:579
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/hooks/__tests__/useEditState.test.js:dup-src/hooks/__tests__/useEditState.test.js-14
```

## PH-167 Identical block (8 lines) copied between src/hooks/__tests__/useQuoteActions.test.js and src/hooks/__tests__/useQuoteActions.test.js

```yaml
id: PH-167
category: code
title: Identical block (8 lines) copied between
  src/hooks/__tests__/useQuoteActions.test.js and
  src/hooks/__tests__/useQuoteActions.test.js
severity: minor
traffic: 0.042839507264165584
confidence: tool-reported
evidence:
  - src/hooks/__tests__/useQuoteActions.test.js:166
  - src/hooks/__tests__/useQuoteActions.test.js:186
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/hooks/__tests__/useQuoteActions.test.js:dup-src/hooks/__tests__/useQuoteActions.test.js-8
```

## PH-168 Identical block (14 lines) copied between src/hooks/__tests__/useQuoteActions.test.js and src/hooks/__tests__/useQuoteActions.test.js

```yaml
id: PH-168
category: code
title: Identical block (14 lines) copied between
  src/hooks/__tests__/useQuoteActions.test.js and
  src/hooks/__tests__/useQuoteActions.test.js
severity: minor
traffic: 0.042839507264165584
confidence: tool-reported
evidence:
  - src/hooks/__tests__/useQuoteActions.test.js:201
  - src/hooks/__tests__/useQuoteActions.test.js:219
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/hooks/__tests__/useQuoteActions.test.js:dup-src/hooks/__tests__/useQuoteActions.test.js-14
```

## PH-169 Identical block (11 lines) copied between src/hooks/__tests__/useQuoteActions.test.js and src/hooks/__tests__/useQuoteActions.test.js

```yaml
id: PH-169
category: code
title: Identical block (11 lines) copied between
  src/hooks/__tests__/useQuoteActions.test.js and
  src/hooks/__tests__/useQuoteActions.test.js
severity: minor
traffic: 0.042839507264165584
confidence: tool-reported
evidence:
  - src/hooks/__tests__/useQuoteActions.test.js:309
  - src/hooks/__tests__/useQuoteActions.test.js:327
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/hooks/__tests__/useQuoteActions.test.js:dup-src/hooks/__tests__/useQuoteActions.test.js-11
```

## PH-170 Identical block (11 lines) copied between src/hooks/__tests__/useQuoteActions.test.js and src/hooks/__tests__/useQuoteActions.test.js

```yaml
id: PH-170
category: code
title: Identical block (11 lines) copied between
  src/hooks/__tests__/useQuoteActions.test.js and
  src/hooks/__tests__/useQuoteActions.test.js
severity: minor
traffic: 0.042839507264165584
confidence: tool-reported
evidence:
  - src/hooks/__tests__/useQuoteActions.test.js:309
  - src/hooks/__tests__/useQuoteActions.test.js:344
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/hooks/__tests__/useQuoteActions.test.js:dup-src/hooks/__tests__/useQuoteActions.test.js-11
```

## PH-171 Identical block (11 lines) copied between src/hooks/__tests__/useQuoteActions.test.js and src/hooks/__tests__/useQuoteActions.test.js

```yaml
id: PH-171
category: code
title: Identical block (11 lines) copied between
  src/hooks/__tests__/useQuoteActions.test.js and
  src/hooks/__tests__/useQuoteActions.test.js
severity: minor
traffic: 0.042839507264165584
confidence: tool-reported
evidence:
  - src/hooks/__tests__/useQuoteActions.test.js:309
  - src/hooks/__tests__/useQuoteActions.test.js:361
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/hooks/__tests__/useQuoteActions.test.js:dup-src/hooks/__tests__/useQuoteActions.test.js-11
```

## PH-172 Identical block (8 lines) copied between src/hooks/useQuoteActions.js and src/hooks/useQuoteActions.js

```yaml
id: PH-172
category: code
title: Identical block (8 lines) copied between src/hooks/useQuoteActions.js and
  src/hooks/useQuoteActions.js
severity: minor
traffic: 0.12984196531736986
confidence: tool-reported
evidence:
  - src/hooks/useQuoteActions.js:132
  - src/hooks/useQuoteActions.js:204
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/hooks/useQuoteActions.js:dup-src/hooks/useQuoteActions.js-8
```

## PH-173 Identical block (7 lines) copied between src/utils/__tests__/export.test.js and src/utils/__tests__/export.test.js

```yaml
id: PH-173
category: code
title: Identical block (7 lines) copied between
  src/utils/__tests__/export.test.js and src/utils/__tests__/export.test.js
severity: minor
traffic: 0.025377387206596946
confidence: tool-reported
evidence:
  - src/utils/__tests__/export.test.js:85
  - src/utils/__tests__/export.test.js:106
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/utils/__tests__/export.test.js:dup-src/utils/__tests__/export.test.js-7
```

## PH-174 Identical block (7 lines) copied between src/utils/__tests__/export.test.js and src/utils/__tests__/export.test.js

```yaml
id: PH-174
category: code
title: Identical block (7 lines) copied between
  src/utils/__tests__/export.test.js and src/utils/__tests__/export.test.js
severity: minor
traffic: 0.025377387206596946
confidence: tool-reported
evidence:
  - src/utils/__tests__/export.test.js:85
  - src/utils/__tests__/export.test.js:125
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/utils/__tests__/export.test.js:dup-src/utils/__tests__/export.test.js-7
```

## PH-175 Identical block (6 lines) copied between src/utils/__tests__/export.test.js and src/utils/__tests__/export.test.js

```yaml
id: PH-175
category: code
title: Identical block (6 lines) copied between
  src/utils/__tests__/export.test.js and src/utils/__tests__/export.test.js
severity: minor
traffic: 0.025377387206596946
confidence: tool-reported
evidence:
  - src/utils/__tests__/export.test.js:86
  - src/utils/__tests__/export.test.js:95
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/utils/__tests__/export.test.js:dup-src/utils/__tests__/export.test.js-6
```

## PH-176 Identical block (7 lines) copied between src/utils/__tests__/shareLinks.test.js and src/utils/__tests__/shareLinks.test.js

```yaml
id: PH-176
category: code
title: Identical block (7 lines) copied between
  src/utils/__tests__/shareLinks.test.js and
  src/utils/__tests__/shareLinks.test.js
severity: minor
traffic: 0.05568354379240736
confidence: tool-reported
evidence:
  - src/utils/__tests__/shareLinks.test.js:101
  - src/utils/__tests__/shareLinks.test.js:108
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/utils/__tests__/shareLinks.test.js:dup-src/utils/__tests__/shareLinks.test.js-7
```

## PH-177 Identical block (7 lines) copied between src/utils/export.js and src/utils/export.js

```yaml
id: PH-177
category: code
title: Identical block (7 lines) copied between src/utils/export.js and
  src/utils/export.js
severity: minor
traffic: 0.07927128382516026
confidence: tool-reported
evidence:
  - src/utils/export.js:128
  - src/utils/export.js:158
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/utils/export.js:dup-src/utils/export.js-7
```

## PH-178 Identical block (9 lines) copied between src/utils/parsers.js and src/utils/parsers.js

```yaml
id: PH-178
category: code
title: Identical block (9 lines) copied between src/utils/parsers.js and
  src/utils/parsers.js
severity: minor
traffic: 0.019102130751301752
confidence: tool-reported
evidence:
  - src/utils/parsers.js:112
  - src/utils/parsers.js:151
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/utils/parsers.js:dup-src/utils/parsers.js-9
```

## PH-179 Identical block (7 lines) copied between src/utils/parsers.js and src/utils/parsers.js

```yaml
id: PH-179
category: code
title: Identical block (7 lines) copied between src/utils/parsers.js and
  src/utils/parsers.js
severity: minor
traffic: 0.019102130751301752
confidence: tool-reported
evidence:
  - src/utils/parsers.js:128
  - src/utils/parsers.js:164
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/utils/parsers.js:dup-src/utils/parsers.js-7
```

## PH-180 Identical block (8 lines) copied between src/utils/shareImage.js and src/utils/shareImage.js

```yaml
id: PH-180
category: code
title: Identical block (8 lines) copied between src/utils/shareImage.js and
  src/utils/shareImage.js
severity: minor
traffic: 0.031266030918961296
confidence: tool-reported
evidence:
  - src/utils/shareImage.js:209
  - src/utils/shareImage.js:219
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/utils/shareImage.js:dup-src/utils/shareImage.js-8
```

## PH-181 Dead code: selectActiveCollectionId in src/stores/quotesStore.js is exported but never used

```yaml
id: PH-181
category: code
title: "Dead code: selectActiveCollectionId in src/stores/quotesStore.js is
  exported but never used"
severity: minor
traffic: 0.08799019219292169
confidence: tool-reported
evidence:
  - src/stores/quotesStore.js:1
source:
  - repowise
repair_cost: S
kind: dead-code
repair: Delete it — repowise marks it deletion-ready (no runtime-load risk factors).
fingerprint: code:src/stores/quotesStore.js:dead-unused-export-selectActiveCollectionId
```

## PH-182 Dead code: selectCollections in src/stores/quotesStore.js is exported but never used

```yaml
id: PH-182
category: code
title: "Dead code: selectCollections in src/stores/quotesStore.js is exported
  but never used"
severity: minor
traffic: 0.08799019219292169
confidence: tool-reported
evidence:
  - src/stores/quotesStore.js:1
source:
  - repowise
repair_cost: S
kind: dead-code
repair: Delete it — repowise marks it deletion-ready (no runtime-load risk factors).
fingerprint: code:src/stores/quotesStore.js:dead-unused-export-selectCollections
```

## PH-183 Dead code: selectColumnOrder in src/stores/quotesStore.js is exported but never used

```yaml
id: PH-183
category: code
title: "Dead code: selectColumnOrder in src/stores/quotesStore.js is exported
  but never used"
severity: minor
traffic: 0.08799019219292169
confidence: tool-reported
evidence:
  - src/stores/quotesStore.js:1
source:
  - repowise
repair_cost: S
kind: dead-code
repair: Delete it — repowise marks it deletion-ready (no runtime-load risk factors).
fingerprint: code:src/stores/quotesStore.js:dead-unused-export-selectColumnOrder
```

## PH-184 Dead code: selectCustomCats in src/stores/quotesStore.js is exported but never used

```yaml
id: PH-184
category: code
title: "Dead code: selectCustomCats in src/stores/quotesStore.js is exported but
  never used"
severity: minor
traffic: 0.08799019219292169
confidence: tool-reported
evidence:
  - src/stores/quotesStore.js:1
source:
  - repowise
repair_cost: S
kind: dead-code
repair: Delete it — repowise marks it deletion-ready (no runtime-load risk factors).
fingerprint: code:src/stores/quotesStore.js:dead-unused-export-selectCustomCats
```

## PH-185 Dead code: selectInitialLoading in src/stores/quotesStore.js is exported but never used

```yaml
id: PH-185
category: code
title: "Dead code: selectInitialLoading in src/stores/quotesStore.js is exported
  but never used"
severity: minor
traffic: 0.08799019219292169
confidence: tool-reported
evidence:
  - src/stores/quotesStore.js:1
source:
  - repowise
repair_cost: S
kind: dead-code
repair: Delete it — repowise marks it deletion-ready (no runtime-load risk factors).
fingerprint: code:src/stores/quotesStore.js:dead-unused-export-selectInitialLoading
```

## PH-186 Dead code: selectIsSharedView in src/stores/quotesStore.js is exported but never used

```yaml
id: PH-186
category: code
title: "Dead code: selectIsSharedView in src/stores/quotesStore.js is exported
  but never used"
severity: minor
traffic: 0.08799019219292169
confidence: tool-reported
evidence:
  - src/stores/quotesStore.js:1
source:
  - repowise
repair_cost: S
kind: dead-code
repair: Delete it — repowise marks it deletion-ready (no runtime-load risk factors).
fingerprint: code:src/stores/quotesStore.js:dead-unused-export-selectIsSharedView
```

## PH-187 Dead code: selectLastSynced in src/stores/quotesStore.js is exported but never used

```yaml
id: PH-187
category: code
title: "Dead code: selectLastSynced in src/stores/quotesStore.js is exported but
  never used"
severity: minor
traffic: 0.08799019219292169
confidence: tool-reported
evidence:
  - src/stores/quotesStore.js:1
source:
  - repowise
repair_cost: S
kind: dead-code
repair: Delete it — repowise marks it deletion-ready (no runtime-load risk factors).
fingerprint: code:src/stores/quotesStore.js:dead-unused-export-selectLastSynced
```

## PH-188 Dead code: selectSyncStatus in src/stores/quotesStore.js is exported but never used

```yaml
id: PH-188
category: code
title: "Dead code: selectSyncStatus in src/stores/quotesStore.js is exported but
  never used"
severity: minor
traffic: 0.08799019219292169
confidence: tool-reported
evidence:
  - src/stores/quotesStore.js:1
source:
  - repowise
repair_cost: S
kind: dead-code
repair: Delete it — repowise marks it deletion-ready (no runtime-load risk factors).
fingerprint: code:src/stores/quotesStore.js:dead-unused-export-selectSyncStatus
```

## PH-189 Hard-to-maintain code: withApiHandler has cyclomatic complexity 21 (api/_shared.js)

```yaml
id: PH-189
category: code
title: "Hard-to-maintain code: withApiHandler has cyclomatic complexity 21
  (api/_shared.js)"
severity: major
traffic: 0.0914958755602203
confidence: tool-reported
evidence:
  - api/_shared.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:api/_shared.js:rw-complex-method-withApiHandler
partial: true
```

## PH-190 Hard-to-maintain code: withApiHandler callback has cyclomatic complexity 23 (api/fetch-url.js)

```yaml
id: PH-190
category: code
title: "Hard-to-maintain code: withApiHandler callback has cyclomatic complexity
  23 (api/fetch-url.js)"
severity: major
traffic: 0.06340544648552357
confidence: tool-reported
evidence:
  - api/fetch-url.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:api/fetch-url.js:rw-complex-method-withApiHandler callback
partial: true
```

## PH-191 Hard-to-maintain code: withApiHandler callback has been modified across 9 commits (repo p80=6) and carries CCN=23 / nesting=3 (api/fetch-url.js)

```yaml
id: PH-191
category: code
title: "Hard-to-maintain code: withApiHandler callback has been modified across
  9 commits (repo p80=6) and carries CCN=23 / nesting=3 (api/fetch-url.js)"
severity: major
traffic: 0.06340544648552357
confidence: tool-reported
evidence:
  - api/fetch-url.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:api/fetch-url.js:rw-function-hotspot-withApiHandler callback
partial: true
```

## PH-192 Hard-to-maintain code: cacheResults has cyclomatic complexity 18 (api/identify.js)

```yaml
id: PH-192
category: code
title: "Hard-to-maintain code: cacheResults has cyclomatic complexity 18
  (api/identify.js)"
severity: major
traffic: 0.12881854052041353
confidence: tool-reported
evidence:
  - api/identify.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:api/identify.js:rw-complex-method-cacheResults
partial: true
```

## PH-193 Hard-to-maintain code: withApiHandler callback has cyclomatic complexity 16 (api/share-page.js)

```yaml
id: PH-193
category: code
title: "Hard-to-maintain code: withApiHandler callback has cyclomatic complexity
  16 (api/share-page.js)"
severity: major
traffic: 0.018239588844717974
confidence: tool-reported
evidence:
  - api/share-page.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:api/share-page.js:rw-complex-method-withApiHandler callback
partial: true
```

## PH-194 Hard-to-maintain code: mergeQuotes has cyclomatic complexity 19 (api/sync.js)

```yaml
id: PH-194
category: code
title: "Hard-to-maintain code: mergeQuotes has cyclomatic complexity 19 (api/sync.js)"
severity: major
traffic: 0.07038251338668261
confidence: tool-reported
evidence:
  - api/sync.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:api/sync.js:rw-complex-method-mergeQuotes
partial: true
```

## PH-195 Hard-to-maintain code: withApiHandler callback has cyclomatic complexity 24 (api/sync.js)

```yaml
id: PH-195
category: code
title: "Hard-to-maintain code: withApiHandler callback has cyclomatic complexity
  24 (api/sync.js)"
severity: major
traffic: 0.07038251338668261
confidence: tool-reported
evidence:
  - api/sync.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:api/sync.js:rw-complex-method-withApiHandler callback
partial: true
```

## PH-196 Hard-to-maintain code: withApiHandler callback has been modified across 10 commits (repo p80=6) and carries CCN=24 / nesting=2 (api/sync.js)

```yaml
id: PH-196
category: code
title: "Hard-to-maintain code: withApiHandler callback has been modified across
  10 commits (repo p80=6) and carries CCN=24 / nesting=2 (api/sync.js)"
severity: major
traffic: 0.07038251338668261
confidence: tool-reported
evidence:
  - api/sync.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:api/sync.js:rw-function-hotspot-withApiHandler callback
partial: true
```

## PH-197 Hard-to-maintain code: BulkBar has cyclomatic complexity 22 (src/components/BulkBar.jsx)

```yaml
id: PH-197
category: code
title: "Hard-to-maintain code: BulkBar has cyclomatic complexity 22
  (src/components/BulkBar.jsx)"
severity: major
traffic: 0.14079510368847006
confidence: tool-reported
evidence:
  - src/components/BulkBar.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/BulkBar.jsx:rw-complex-method-BulkBar
partial: true
```

## PH-198 Hard-to-maintain code: BulkBar has been modified across 9 commits (repo p80=6) and carries CCN=22 / nesting=1 (src/components/BulkBar.jsx)

```yaml
id: PH-198
category: code
title: "Hard-to-maintain code: BulkBar has been modified across 9 commits (repo
  p80=6) and carries CCN=22 / nesting=1 (src/components/BulkBar.jsx)"
severity: major
traffic: 0.14079510368847006
confidence: tool-reported
evidence:
  - src/components/BulkBar.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/BulkBar.jsx:rw-function-hotspot-BulkBar
partial: true
```

## PH-199 Hard-to-maintain code: BulkBar is 127 lines long (src/components/BulkBar.jsx)

```yaml
id: PH-199
category: code
title: "Hard-to-maintain code: BulkBar is 127 lines long (src/components/BulkBar.jsx)"
severity: major
traffic: 0.14079510368847006
confidence: tool-reported
evidence:
  - src/components/BulkBar.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/BulkBar.jsx:rw-large-method-BulkBar
partial: true
```

## PH-200 Hard-to-maintain code: CardItem is 135 lines long (src/components/CardItem.jsx)

```yaml
id: PH-200
category: code
title: "Hard-to-maintain code: CardItem is 135 lines long
  (src/components/CardItem.jsx)"
severity: major
traffic: 0.3129922719632555
confidence: tool-reported
evidence:
  - src/components/CardItem.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/CardItem.jsx:rw-large-method-CardItem
partial: true
```

## PH-201 Hard-to-maintain code: DupeModalInner has cyclomatic complexity 17 (src/components/DupeModal.jsx)

```yaml
id: PH-201
category: code
title: "Hard-to-maintain code: DupeModalInner has cyclomatic complexity 17
  (src/components/DupeModal.jsx)"
severity: major
traffic: 0.10900856872698018
confidence: tool-reported
evidence:
  - src/components/DupeModal.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/DupeModal.jsx:rw-complex-method-DupeModalInner
partial: true
```

## PH-202 Hard-to-maintain code: DupeModalInner has been modified across 8 commits (repo p80=6) and carries CCN=17 / nesting=1 (src/components/DupeModal.jsx)

```yaml
id: PH-202
category: code
title: "Hard-to-maintain code: DupeModalInner has been modified across 8 commits
  (repo p80=6) and carries CCN=17 / nesting=1 (src/components/DupeModal.jsx)"
severity: major
traffic: 0.10900856872698018
confidence: tool-reported
evidence:
  - src/components/DupeModal.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/DupeModal.jsx:rw-function-hotspot-DupeModalInner
partial: true
```

## PH-203 Hard-to-maintain code: DupeModalInner is 195 lines long (src/components/DupeModal.jsx)

```yaml
id: PH-203
category: code
title: "Hard-to-maintain code: DupeModalInner is 195 lines long
  (src/components/DupeModal.jsx)"
severity: major
traffic: 0.10900856872698018
confidence: tool-reported
evidence:
  - src/components/DupeModal.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/DupeModal.jsx:rw-large-method-DupeModalInner
partial: true
```

## PH-204 Hard-to-maintain code: EditForm has cyclomatic complexity 22 (src/components/EditForm.jsx)

```yaml
id: PH-204
category: code
title: "Hard-to-maintain code: EditForm has cyclomatic complexity 22
  (src/components/EditForm.jsx)"
severity: major
traffic: 0.1820996834885893
confidence: tool-reported
evidence:
  - src/components/EditForm.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/EditForm.jsx:rw-complex-method-EditForm
partial: true
```

## PH-205 Hard-to-maintain code: findSuggestion has cyclomatic complexity 15 (src/components/EditForm.jsx)

```yaml
id: PH-205
category: code
title: "Hard-to-maintain code: findSuggestion has cyclomatic complexity 15
  (src/components/EditForm.jsx)"
severity: major
traffic: 0.1820996834885893
confidence: tool-reported
evidence:
  - src/components/EditForm.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/EditForm.jsx:rw-complex-method-findSuggestion
partial: true
```

## PH-206 Hard-to-maintain code: EntryReviewModal is 136 lines long (src/components/EntryReviewModal.jsx)

```yaml
id: PH-206
category: code
title: "Hard-to-maintain code: EntryReviewModal is 136 lines long
  (src/components/EntryReviewModal.jsx)"
severity: major
traffic: 0.020023835386746805
confidence: tool-reported
evidence:
  - src/components/EntryReviewModal.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/EntryReviewModal.jsx:rw-large-method-EntryReviewModal
partial: true
```

## PH-207 Hard-to-maintain code: ExportDropdown has cyclomatic complexity 22 (src/components/ExportDropdown.jsx)

```yaml
id: PH-207
category: code
title: "Hard-to-maintain code: ExportDropdown has cyclomatic complexity 22
  (src/components/ExportDropdown.jsx)"
severity: major
traffic: 0.19453210748037558
confidence: tool-reported
evidence:
  - src/components/ExportDropdown.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/ExportDropdown.jsx:rw-complex-method-ExportDropdown
partial: true
```

## PH-208 Hard-to-maintain code: ExportDropdown has been modified across 16 commits (repo p80=6) and carries CCN=22 / nesting=1 (src/components/ExportDropdown.jsx)

```yaml
id: PH-208
category: code
title: "Hard-to-maintain code: ExportDropdown has been modified across 16
  commits (repo p80=6) and carries CCN=22 / nesting=1
  (src/components/ExportDropdown.jsx)"
severity: major
traffic: 0.19453210748037558
confidence: tool-reported
evidence:
  - src/components/ExportDropdown.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/ExportDropdown.jsx:rw-function-hotspot-ExportDropdown
partial: true
```

## PH-209 Hard-to-maintain code: ExportDropdown is 148 lines long (src/components/ExportDropdown.jsx)

```yaml
id: PH-209
category: code
title: "Hard-to-maintain code: ExportDropdown is 148 lines long
  (src/components/ExportDropdown.jsx)"
severity: major
traffic: 0.19453210748037558
confidence: tool-reported
evidence:
  - src/components/ExportDropdown.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/ExportDropdown.jsx:rw-large-method-ExportDropdown
partial: true
```

## PH-210 Hard-to-maintain code: HeaderBar has been modified across 15 commits (repo p80=6) and carries CCN=11 / nesting=1 (src/components/HeaderBar.jsx)

```yaml
id: PH-210
category: code
title: "Hard-to-maintain code: HeaderBar has been modified across 15 commits
  (repo p80=6) and carries CCN=11 / nesting=1 (src/components/HeaderBar.jsx)"
severity: major
traffic: 0.22927669186095398
confidence: tool-reported
evidence:
  - src/components/HeaderBar.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/HeaderBar.jsx:rw-function-hotspot-HeaderBar
partial: true
```

## PH-211 Hard-to-maintain code: HowItWorksAnimation is 131 lines long (src/components/HowItWorksAnimation.jsx)

```yaml
id: PH-211
category: code
title: "Hard-to-maintain code: HowItWorksAnimation is 131 lines long
  (src/components/HowItWorksAnimation.jsx)"
severity: major
traffic: 0.06895605931270264
confidence: tool-reported
evidence:
  - src/components/HowItWorksAnimation.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/HowItWorksAnimation.jsx:rw-large-method-HowItWorksAnimation
partial: true
```

## PH-212 Hard-to-maintain code: MiniHeader has been modified across 16 commits (repo p80=6) and carries CCN=14 / nesting=1 (src/components/MiniHeader.jsx)

```yaml
id: PH-212
category: code
title: "Hard-to-maintain code: MiniHeader has been modified across 16 commits
  (repo p80=6) and carries CCN=14 / nesting=1 (src/components/MiniHeader.jsx)"
severity: major
traffic: 0.16258171265571497
confidence: tool-reported
evidence:
  - src/components/MiniHeader.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/MiniHeader.jsx:rw-function-hotspot-MiniHeader
partial: true
```

## PH-213 Hard-to-maintain code: ProcessingPhase is 144 lines long (src/components/ProcessingPhase.jsx)

```yaml
id: PH-213
category: code
title: "Hard-to-maintain code: ProcessingPhase is 144 lines long
  (src/components/ProcessingPhase.jsx)"
severity: major
traffic: 0.19370146624411652
confidence: tool-reported
evidence:
  - src/components/ProcessingPhase.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/ProcessingPhase.jsx:rw-large-method-ProcessingPhase
partial: true
```

## PH-214 Hard-to-maintain code: QuickAddBar has been modified across 15 commits (repo p80=6) and carries CCN=32 / nesting=1 (src/components/QuickAddBar.jsx)

```yaml
id: PH-214
category: code
title: "Hard-to-maintain code: QuickAddBar has been modified across 15 commits
  (repo p80=6) and carries CCN=32 / nesting=1 (src/components/QuickAddBar.jsx)"
severity: major
traffic: 0.11527756634140444
confidence: tool-reported
evidence:
  - src/components/QuickAddBar.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/QuickAddBar.jsx:rw-function-hotspot-QuickAddBar
partial: true
```

## PH-215 Hard-to-maintain code: QuickAddBar is 188 lines long (src/components/QuickAddBar.jsx)

```yaml
id: PH-215
category: code
title: "Hard-to-maintain code: QuickAddBar is 188 lines long
  (src/components/QuickAddBar.jsx)"
severity: major
traffic: 0.11527756634140444
confidence: tool-reported
evidence:
  - src/components/QuickAddBar.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/QuickAddBar.jsx:rw-large-method-QuickAddBar
partial: true
```

## PH-216 Hard-to-maintain code: OverflowMenu has cyclomatic complexity 16 (src/components/QuoteActions.jsx)

```yaml
id: PH-216
category: code
title: "Hard-to-maintain code: OverflowMenu has cyclomatic complexity 16
  (src/components/QuoteActions.jsx)"
severity: major
traffic: 0.19846754203181682
confidence: tool-reported
evidence:
  - src/components/QuoteActions.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/QuoteActions.jsx:rw-complex-method-OverflowMenu
partial: true
```

## PH-217 Hard-to-maintain code: OverflowMenu has been modified across 14 commits (repo p80=6) and carries CCN=16 / nesting=1 (src/components/QuoteActions.jsx)

```yaml
id: PH-217
category: code
title: "Hard-to-maintain code: OverflowMenu has been modified across 14 commits
  (repo p80=6) and carries CCN=16 / nesting=1 (src/components/QuoteActions.jsx)"
severity: major
traffic: 0.19846754203181682
confidence: tool-reported
evidence:
  - src/components/QuoteActions.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/QuoteActions.jsx:rw-function-hotspot-OverflowMenu
partial: true
```

## PH-218 Hard-to-maintain code: OverflowMenu is 140 lines long (src/components/QuoteActions.jsx)

```yaml
id: PH-218
category: code
title: "Hard-to-maintain code: OverflowMenu is 140 lines long
  (src/components/QuoteActions.jsx)"
severity: major
traffic: 0.19846754203181682
confidence: tool-reported
evidence:
  - src/components/QuoteActions.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/QuoteActions.jsx:rw-large-method-OverflowMenu
partial: true
```

## PH-219 Hard-to-maintain code: ResultsPhase has 5 nested blocks at the same level (bumpy road) (src/components/ResultsPhase.jsx)

```yaml
id: PH-219
category: code
title: "Hard-to-maintain code: ResultsPhase has 5 nested blocks at the same
  level (bumpy road) (src/components/ResultsPhase.jsx)"
severity: major
traffic: 0.42808818545053934
confidence: tool-reported
evidence:
  - src/components/ResultsPhase.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/ResultsPhase.jsx:rw-bumpy-road-ResultsPhase
partial: true
```

## PH-220 Hard-to-maintain code: ShareImageModal has cyclomatic complexity 18 (src/components/ShareImageModal.jsx)

```yaml
id: PH-220
category: code
title: "Hard-to-maintain code: ShareImageModal has cyclomatic complexity 18
  (src/components/ShareImageModal.jsx)"
severity: major
traffic: 0.09027476737127609
confidence: tool-reported
evidence:
  - src/components/ShareImageModal.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/ShareImageModal.jsx:rw-complex-method-ShareImageModal
partial: true
```

## PH-221 Hard-to-maintain code: ShareImageModal has been modified across 7 commits (repo p80=6) and carries CCN=18 / nesting=2 (src/components/ShareImageModal.jsx)

```yaml
id: PH-221
category: code
title: "Hard-to-maintain code: ShareImageModal has been modified across 7
  commits (repo p80=6) and carries CCN=18 / nesting=2
  (src/components/ShareImageModal.jsx)"
severity: major
traffic: 0.09027476737127609
confidence: tool-reported
evidence:
  - src/components/ShareImageModal.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/ShareImageModal.jsx:rw-function-hotspot-ShareImageModal
partial: true
```

## PH-222 Hard-to-maintain code: ShareImageModal is 130 lines long (src/components/ShareImageModal.jsx)

```yaml
id: PH-222
category: code
title: "Hard-to-maintain code: ShareImageModal is 130 lines long
  (src/components/ShareImageModal.jsx)"
severity: major
traffic: 0.09027476737127609
confidence: tool-reported
evidence:
  - src/components/ShareImageModal.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/ShareImageModal.jsx:rw-large-method-ShareImageModal
partial: true
```

## PH-223 Hard-to-maintain code: SyncPill has cyclomatic complexity 24 (src/components/SyncPill.jsx)

```yaml
id: PH-223
category: code
title: "Hard-to-maintain code: SyncPill has cyclomatic complexity 24
  (src/components/SyncPill.jsx)"
severity: major
traffic: 0.11219181832557006
confidence: tool-reported
evidence:
  - src/components/SyncPill.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/SyncPill.jsx:rw-complex-method-SyncPill
partial: true
```

## PH-224 Hard-to-maintain code: SyncPill has been modified across 9 commits (repo p80=6) and carries CCN=24 / nesting=2 (src/components/SyncPill.jsx)

```yaml
id: PH-224
category: code
title: "Hard-to-maintain code: SyncPill has been modified across 9 commits (repo
  p80=6) and carries CCN=24 / nesting=2 (src/components/SyncPill.jsx)"
severity: major
traffic: 0.11219181832557006
confidence: tool-reported
evidence:
  - src/components/SyncPill.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/SyncPill.jsx:rw-function-hotspot-SyncPill
partial: true
```

## PH-225 Hard-to-maintain code: UrlImportPanel has cyclomatic complexity 23 (src/components/UrlImportPanel.jsx)

```yaml
id: PH-225
category: code
title: "Hard-to-maintain code: UrlImportPanel has cyclomatic complexity 23
  (src/components/UrlImportPanel.jsx)"
severity: major
traffic: 0.08937643356153728
confidence: tool-reported
evidence:
  - src/components/UrlImportPanel.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/UrlImportPanel.jsx:rw-complex-method-UrlImportPanel
partial: true
```

## PH-226 Hard-to-maintain code: UrlImportPanel has been modified across 6 commits (repo p80=6) and carries CCN=23 / nesting=1 (src/components/UrlImportPanel.jsx)

```yaml
id: PH-226
category: code
title: "Hard-to-maintain code: UrlImportPanel has been modified across 6 commits
  (repo p80=6) and carries CCN=23 / nesting=1
  (src/components/UrlImportPanel.jsx)"
severity: major
traffic: 0.08937643356153728
confidence: tool-reported
evidence:
  - src/components/UrlImportPanel.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/UrlImportPanel.jsx:rw-function-hotspot-UrlImportPanel
partial: true
```

## PH-227 Hard-to-maintain code: UrlPreviewModal has cyclomatic complexity 19 (src/components/UrlPreviewModal.jsx)

```yaml
id: PH-227
category: code
title: "Hard-to-maintain code: UrlPreviewModal has cyclomatic complexity 19
  (src/components/UrlPreviewModal.jsx)"
severity: major
traffic: 0.09044540289132785
confidence: tool-reported
evidence:
  - src/components/UrlPreviewModal.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/UrlPreviewModal.jsx:rw-complex-method-UrlPreviewModal
partial: true
```

## PH-228 Hard-to-maintain code: UrlPreviewModal has been modified across 9 commits (repo p80=6) and carries CCN=19 / nesting=1 (src/components/UrlPreviewModal.jsx)

```yaml
id: PH-228
category: code
title: "Hard-to-maintain code: UrlPreviewModal has been modified across 9
  commits (repo p80=6) and carries CCN=19 / nesting=1
  (src/components/UrlPreviewModal.jsx)"
severity: major
traffic: 0.09044540289132785
confidence: tool-reported
evidence:
  - src/components/UrlPreviewModal.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/UrlPreviewModal.jsx:rw-function-hotspot-UrlPreviewModal
partial: true
```

## PH-229 Hard-to-maintain code: UrlPreviewModal is 182 lines long (src/components/UrlPreviewModal.jsx)

```yaml
id: PH-229
category: code
title: "Hard-to-maintain code: UrlPreviewModal is 182 lines long
  (src/components/UrlPreviewModal.jsx)"
severity: major
traffic: 0.09044540289132785
confidence: tool-reported
evidence:
  - src/components/UrlPreviewModal.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/UrlPreviewModal.jsx:rw-large-method-UrlPreviewModal
partial: true
```

## PH-230 Hard-to-maintain code: QuotesProvider has been modified across 16 commits (repo p80=6) and carries CCN=30 / nesting=3 (src/contexts/QuotesContext.jsx)

```yaml
id: PH-230
category: code
title: "Hard-to-maintain code: QuotesProvider has been modified across 16
  commits (repo p80=6) and carries CCN=30 / nesting=3
  (src/contexts/QuotesContext.jsx)"
severity: major
traffic: 0.18109258775720635
confidence: tool-reported
evidence:
  - src/contexts/QuotesContext.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/contexts/QuotesContext.jsx:rw-function-hotspot-QuotesProvider
partial: true
```

## PH-231 Hard-to-maintain code: localLookup has cyclomatic complexity 24 (src/data/localQuotes.js)

```yaml
id: PH-231
category: code
title: "Hard-to-maintain code: localLookup has cyclomatic complexity 24
  (src/data/localQuotes.js)"
severity: major
traffic: 0.08245855696719873
confidence: tool-reported
evidence:
  - src/data/localQuotes.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/data/localQuotes.js:rw-complex-method-localLookup
partial: true
```

## PH-232 Hard-to-maintain code: useDndQuotes has cyclomatic complexity 19 (src/hooks/useDndQuotes.js)

```yaml
id: PH-232
category: code
title: "Hard-to-maintain code: useDndQuotes has cyclomatic complexity 19
  (src/hooks/useDndQuotes.js)"
severity: major
traffic: 0.01734470231239875
confidence: tool-reported
evidence:
  - src/hooks/useDndQuotes.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/hooks/useDndQuotes.js:rw-complex-method-useDndQuotes
partial: true
```

## PH-233 Hard-to-maintain code: useEditState has 5 nested blocks at the same level (bumpy road) (src/hooks/useEditState.js)

```yaml
id: PH-233
category: code
title: "Hard-to-maintain code: useEditState has 5 nested blocks at the same
  level (bumpy road) (src/hooks/useEditState.js)"
severity: major
traffic: 0.17224644681699114
confidence: tool-reported
evidence:
  - src/hooks/useEditState.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/hooks/useEditState.js:rw-bumpy-road-useEditState
partial: true
```

## PH-234 Hard-to-maintain code: useKeyboardShortcuts has been modified across 7 commits (repo p80=6) and carries CCN=50 / nesting=4 (src/hooks/useKeyboardShortcuts.js)

```yaml
id: PH-234
category: code
title: "Hard-to-maintain code: useKeyboardShortcuts has been modified across 7
  commits (repo p80=6) and carries CCN=50 / nesting=4
  (src/hooks/useKeyboardShortcuts.js)"
severity: major
traffic: 0.036089595561323934
confidence: tool-reported
evidence:
  - src/hooks/useKeyboardShortcuts.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/hooks/useKeyboardShortcuts.js:rw-function-hotspot-useKeyboardShortcuts
partial: true
```

## PH-235 Hard-to-maintain code: useProcessing has 7 nested blocks at the same level (bumpy road) (src/hooks/useProcessing.js)

```yaml
id: PH-235
category: code
title: "Hard-to-maintain code: useProcessing has 7 nested blocks at the same
  level (bumpy road) (src/hooks/useProcessing.js)"
severity: major
traffic: 0.22087729473158527
confidence: tool-reported
evidence:
  - src/hooks/useProcessing.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/hooks/useProcessing.js:rw-bumpy-road-useProcessing
partial: true
```

## PH-236 Hard-to-maintain code: useProcessing nests 5 levels deep (src/hooks/useProcessing.js)

```yaml
id: PH-236
category: code
title: "Hard-to-maintain code: useProcessing nests 5 levels deep
  (src/hooks/useProcessing.js)"
severity: major
traffic: 0.22087729473158527
confidence: tool-reported
evidence:
  - src/hooks/useProcessing.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/hooks/useProcessing.js:rw-nested-complexity-useProcessing
partial: true
```

## PH-237 Hard-to-maintain code: useSync has cyclomatic complexity 23 (src/hooks/useSync.js)

```yaml
id: PH-237
category: code
title: "Hard-to-maintain code: useSync has cyclomatic complexity 23
  (src/hooks/useSync.js)"
severity: major
traffic: 0.1728413322246163
confidence: tool-reported
evidence:
  - src/hooks/useSync.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/hooks/useSync.js:rw-complex-method-useSync
partial: true
```

## PH-238 Hard-to-maintain code: useSync has been modified across 17 commits (repo p80=6) and carries CCN=23 / nesting=3 (src/hooks/useSync.js)

```yaml
id: PH-238
category: code
title: "Hard-to-maintain code: useSync has been modified across 17 commits (repo
  p80=6) and carries CCN=23 / nesting=3 (src/hooks/useSync.js)"
severity: major
traffic: 0.1728413322246163
confidence: tool-reported
evidence:
  - src/hooks/useSync.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/hooks/useSync.js:rw-function-hotspot-useSync
partial: true
```

## PH-239 Hard-to-maintain code: useTheme has cyclomatic complexity 22 (src/hooks/useTheme.js)

```yaml
id: PH-239
category: code
title: "Hard-to-maintain code: useTheme has cyclomatic complexity 22
  (src/hooks/useTheme.js)"
severity: major
traffic: 0.08079818555604534
confidence: tool-reported
evidence:
  - src/hooks/useTheme.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/hooks/useTheme.js:rw-complex-method-useTheme
partial: true
```

## PH-240 Hard-to-maintain code: useTheme has been modified across 12 commits (repo p80=6) and carries CCN=22 / nesting=2 (src/hooks/useTheme.js)

```yaml
id: PH-240
category: code
title: "Hard-to-maintain code: useTheme has been modified across 12 commits
  (repo p80=6) and carries CCN=22 / nesting=2 (src/hooks/useTheme.js)"
severity: major
traffic: 0.08079818555604534
confidence: tool-reported
evidence:
  - src/hooks/useTheme.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/hooks/useTheme.js:rw-function-hotspot-useTheme
partial: true
```

## PH-241 Hard-to-maintain code: useViewPreferences is 126 lines long (src/hooks/useViewPreferences.js)

```yaml
id: PH-241
category: code
title: "Hard-to-maintain code: useViewPreferences is 126 lines long
  (src/hooks/useViewPreferences.js)"
severity: major
traffic: 0.12424325814938902
confidence: tool-reported
evidence:
  - src/hooks/useViewPreferences.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/hooks/useViewPreferences.js:rw-large-method-useViewPreferences
partial: true
```

## PH-242 Hard-to-maintain code: subscribeWithSelector callback has been modified across 7 commits (repo p80=6) and carries CCN=35 / nesting=2 (src/stores/quotesStore.js)

```yaml
id: PH-242
category: code
title: "Hard-to-maintain code: subscribeWithSelector callback has been modified
  across 7 commits (repo p80=6) and carries CCN=35 / nesting=2
  (src/stores/quotesStore.js)"
severity: major
traffic: 0.08799019219292169
confidence: tool-reported
evidence:
  - src/stores/quotesStore.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/stores/quotesStore.js:rw-function-hotspot-subscribeWithSelector
  callback
partial: true
```

## PH-243 Hard-to-maintain code: subscribeWithSelector callback is 182 lines long (src/stores/quotesStore.js)

```yaml
id: PH-243
category: code
title: "Hard-to-maintain code: subscribeWithSelector callback is 182 lines long
  (src/stores/quotesStore.js)"
severity: major
traffic: 0.08799019219292169
confidence: tool-reported
evidence:
  - src/stores/quotesStore.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/stores/quotesStore.js:rw-large-method-subscribeWithSelector callback
partial: true
```

## PH-244 Hard-to-maintain code: describeApiError has cyclomatic complexity 16 (src/utils/apiErrors.js)

```yaml
id: PH-244
category: code
title: "Hard-to-maintain code: describeApiError has cyclomatic complexity 16
  (src/utils/apiErrors.js)"
severity: major
traffic: 0.007994941174000694
confidence: tool-reported
evidence:
  - src/utils/apiErrors.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/utils/apiErrors.js:rw-complex-method-describeApiError
partial: true
```

## PH-245 Hard-to-maintain code: parseNotionCSV has cyclomatic complexity 15 (src/utils/parsers.js)

```yaml
id: PH-245
category: code
title: "Hard-to-maintain code: parseNotionCSV has cyclomatic complexity 15
  (src/utils/parsers.js)"
severity: major
traffic: 0.019102130751301752
confidence: tool-reported
evidence:
  - src/utils/parsers.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/utils/parsers.js:rw-complex-method-parseNotionCSV
partial: true
```

## PH-246 Hard-to-maintain code: splitSource has cyclomatic complexity 20 (src/utils/quotes.js)

```yaml
id: PH-246
category: code
title: "Hard-to-maintain code: splitSource has cyclomatic complexity 20
  (src/utils/quotes.js)"
severity: major
traffic: 0.043499440247911254
confidence: tool-reported
evidence:
  - src/utils/quotes.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/utils/quotes.js:rw-complex-method-splitSource
partial: true
```

## PH-247 Hard-to-maintain code: disambiguateContractions nests 5 levels deep (src/utils/smartRestore.js)

```yaml
id: PH-247
category: code
title: "Hard-to-maintain code: disambiguateContractions nests 5 levels deep
  (src/utils/smartRestore.js)"
severity: major
traffic: 0.02817701579309893
confidence: tool-reported
evidence:
  - src/utils/smartRestore.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/utils/smartRestore.js:rw-nested-complexity-disambiguateContractions
partial: true
```

## PH-248 Hard-to-maintain code: if condition combines 5 boolean operators (src/utils/textFormatting.js)

```yaml
id: PH-248
category: code
title: "Hard-to-maintain code: if condition combines 5 boolean operators
  (src/utils/textFormatting.js)"
severity: major
traffic: 0.066302697349501
confidence: tool-reported
evidence:
  - src/utils/textFormatting.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/utils/textFormatting.js:rw-complex-conditional-smartParse
partial: true
```
