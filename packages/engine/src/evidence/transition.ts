import type { CommandResult, MapCommand, MapSpec } from "../types.js";
import {
  type BuildEvidenceRecordResult,
  buildEvidenceRecord,
  canonicalHash,
  type EvidenceExclusionId,
  EvidenceIssueCode,
  type EvidenceRecord,
  type EvidenceRecordArtifact,
  type EvidenceRecordCapabilities,
  type EvidenceRecordCommand,
} from "./record.js";

export interface CommandTransitionEvidenceInput {
  projectId: string;
  baseSpec: MapSpec;
  spec: MapSpec;
  commands: MapCommand[];
  results: CommandResult[];
  origin: EvidenceRecord["origin"];
  artifacts: EvidenceRecordArtifact[];
  capabilities: EvidenceRecordCapabilities;
  toolchain: EvidenceRecord["toolchain"];
  issuer: string;
  issuedAt?: string;
  exclusions?: EvidenceExclusionId[];
}

export function buildCommandTransitionEvidence(input: CommandTransitionEvidenceInput): BuildEvidenceRecordResult {
  const commandById = new Map(input.commands.map((command) => [command.id, command]));
  const commands: EvidenceRecordCommand[] = [];
  for (const [index, result] of input.results.entries()) {
    const command = commandById.get(result.commandId);
    if (!command) {
      return {
        ok: false,
        diagnostics: [
          {
            severity: "error",
            code: EvidenceIssueCode.InputInvalid,
            message: `Result "${result.commandId}" has no command in the submitted batch; refusing to attest a transition nobody submitted.`,
            path: `/commands/${index}`,
          },
        ],
      };
    }
    // An applied entry without a revision pair would pass the builder but fail the verifier's
    // lineage recompute, so refuse it here rather than emit an unverifiable record.
    if (result.status === "applied" && (result.baseRevision === undefined || result.nextRevision === undefined)) {
      return {
        ok: false,
        diagnostics: [
          {
            severity: "error",
            code: EvidenceIssueCode.InputInvalid,
            message:
              'Applied commands require a revision-anchored spec (set spec.revision, e.g. "0") so the evidence lineage is recomputable.',
            path: "/spec/revision",
          },
        ],
      };
    }
    commands.push({
      command,
      outcome: result.status,
      diagnostics: result.diagnostics,
      inversePatchHash: canonicalHash(result.inversePatch ?? []),
      ...(result.baseRevision ? { baseRevision: result.baseRevision } : {}),
      ...(result.nextRevision ? { nextRevision: result.nextRevision } : {}),
    });
  }

  return buildEvidenceRecord({
    project: {
      id: input.projectId,
      baseRevision: input.results[0]?.baseRevision ?? input.baseSpec.revision ?? "initial",
      revision: input.results[input.results.length - 1]?.nextRevision ?? input.spec.revision ?? "initial",
    },
    origin: input.origin,
    commands,
    spec: {
      beforeHash: canonicalHash(input.baseSpec),
      afterHash: canonicalHash(input.spec),
      diffHash: canonicalHash(input.results.flatMap((result) => result.changedPaths)),
    },
    artifacts: input.artifacts,
    capabilities: input.capabilities,
    toolchain: input.toolchain,
    issuer: input.issuer,
    ...(input.issuedAt ? { issuedAt: input.issuedAt } : {}),
    ...(input.exclusions ? { exclusions: input.exclusions } : {}),
  });
}