[**@gis-engine/cli v1.1.0**](../index.md)

***

# Interface: VerifyArtifactsResult

## Properties

### ok

> **ok**: `boolean`

***

### mode

> **mode**: `"artifact-manifest-verify"`

***

### status

> **status**: `"verified"` \| `"blocked"`

***

### projectDir

> **projectDir**: `string`

***

### manifestPath

> **manifestPath**: `string`

***

### summary

> **summary**: `object`

#### manifestFileCount

> **manifestFileCount**: `number`

#### verifiedFileCount

> **verifiedFileCount**: `number`

#### requiredFileCount

> **requiredFileCount**: `number`

#### missingFileCount

> **missingFileCount**: `number`

#### byteMismatchCount

> **byteMismatchCount**: `number`

#### hashMismatchCount

> **hashMismatchCount**: `number`

***

### files

> **files**: `VerifyArtifactFileResult`[]

***

### diagnostics

> **diagnostics**: `VerifyArtifactDiagnostic`[]
