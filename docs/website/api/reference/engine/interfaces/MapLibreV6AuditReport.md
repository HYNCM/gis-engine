[**@gis-engine/engine v1.5.0**](../index.md)

***

# Interface: MapLibreV6AuditReport

## Properties

### status

> **status**: `"compatible"` \| `"warnings"` \| `"incompatible"`

Overall audit status.

***

### targetVersionRange

> **targetVersionRange**: `string`

MapLibre version range this audit targets.

***

### checkedVersions

> **checkedVersions**: readonly \[`"5.24.0"`, `"6.1.0"`\]

Exact versions exercised by the executable matrix.

***

### releaseBaseline

> **releaseBaseline**: `"5.24.0"`

Version retained by release and workspace defaults.

***

### candidateDecision

> **candidateDecision**: [`MapLibreV6CandidateDecision`](../type-aliases/MapLibreV6CandidateDecision.md)

Candidate adoption decision; independent from runtime compatibility evidence.

***

### entries

> **entries**: [`MapLibreV6AuditEntry`](MapLibreV6AuditEntry.md)[]

Individual audit entries.

***

### summary

> **summary**: `object`

Summary counts.

#### totalChecks

> **totalChecks**: `number`

#### passCount

> **passCount**: `number`

#### warningCount

> **warningCount**: `number`

#### failCount

> **failCount**: `number`
