/**
 * evolution-snapshot-generator.mjs
 *
 * 增强的进化度量生成器，产出evolution-snapshot-{YYYY-Www}.md
 * 替代evolution-collector.mjs中的生成部分，提供结构化的snapshot输出
 */

import { writeFileSync, readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

/**
 * 生成evolution-snapshot markdown文件
 * @param {string} period - ISO周期如 "2026-W23"
 * @param {object} metrics - D1-D6收集的度量数据
 * @param {boolean} dryRun - 仅输出，不写入
 */
export function generateEvolutionSnapshot(period, metrics, dryRun = false) {
  const { d1, d2, d3, d4, d5, d6, generatedAt, repoRevision } = metrics;
  const filename = `docs/planning/evolution-snapshot-${period}.md`;

  // 生成前言
  let content = `---
agent: evolution-guardian
period: ${period}
generated_at: ${generatedAt}
repo_revision: "${repoRevision}"
inputs:
  - docs/planning/task-burndown.md
  - docs/planning/sprint-${period}.md
  - docs/reviews/daily-audit-*.md
  - test-results/
owner: "@orchestrator"
decision_level: info
---

# Evolution Snapshot: ${period}

**Generated**: ${generatedAt}
**Status**: Awaiting orchestrator review
**Purpose**: Provide D1-D6 metrics, detect anomalies, suggest self-calibration adjustments

---

## 📊 D1: Estimation Accuracy

### Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Total tasks | ${d1.summary.count} | ✓ |
| Known actual hours | ${d1.summary.knownActualCount} | ${d1.summary.knownActualCount > 0 ? "✓" : "⚠️ (no feedback)"} |
| Average deviation | ${d1.summary.avgDeviation !== null ? d1.summary.avgDeviation.toFixed(2) : "N/A"} | ${d1.summary.avgDeviation !== null && d1.summary.avgDeviation <= 0.5 ? "✓ (Good)" : d1.summary.avgDeviation > 0.5 && d1.summary.avgDeviation <= 1.0 ? "🟡 (Acceptable)" : "🔴 (Needs improvement)"} |

### By Complexity

`;

  for (const [complexity, data] of Object.entries(d1.byComplexity || {})) {
    const status =
      data.avgDeviation <= 0.5 ? "✓" : data.avgDeviation <= 1.0 ? "🟡" : "🔴";
    content += `
| Complexity | Count | Avg Deviation | Status |
|---|---|---|---|
| ${complexity} | ${data.count} | ${data.avgDeviation.toFixed(2)} | ${status} |
`;
  }

  // Anomalies for D1
  content += `
### Anomalies Detected

`;
  if (d1.anomalies && d1.anomalies.length > 0) {
    for (const anomaly of d1.anomalies) {
      content += `- **CODE D1.${anomaly.code}**: ${anomaly.detail}\n`;
      content += `  - **Recommendation**: ${anomaly.recommendation}\n`;
    }
  } else {
    content += `✅ No anomalies detected.\n`;
  }

  // D2: Bottleneck Detection
  content += `
---

## 🚧 D2: Bottleneck Detection

### Critical Path Analysis

| Metric | Value |
|--------|-------|
| Critical path ratio | ${d2.criticalPathRatio ? d2.criticalPathRatio.toFixed(1) + "%" : "N/A"} |
| Max wait time (hours) | ${d2.maxWaitTime || "N/A"} |
| Bottleneck tasks | ${d2.bottleneckCount || 0} |

### Detected Bottlenecks

`;
  if (d2.bottlenecks && d2.bottlenecks.length > 0) {
    for (const b of d2.bottlenecks) {
      content += `
#### ${b.taskId || "Unknown"}
- **Type**: ${b.type} (${b.severity})
- **Wait Time**: ${b.waitTime}h
- **Blocking**: ${b.dependentCount} downstream tasks
- **Recommendation**: ${b.suggestion}
`;
    }
  } else {
    content += `✅ No critical bottlenecks detected.\n`;
  }

  // D3: Quality Trend
  content += `
---

## 🧪 D3: Quality Trends

### Gate Performance

| Gate Type | Pass | Fail | Waiver | First-Pass Rate |
|-----------|------|------|--------|-----------------|
| Schema Sync | ${d3.gateResults.schemaSyncPass || 0} | ${d3.gateResults.schemaSyncFail || 0} | ${d3.gateResults.schemaSyncWaiver || 0} | ${d3.gateResults.schemaSyncPassRate || "N/A"} |
| Visual Snapshot | ${d3.gateResults.visualPass || 0} | ${d3.gateResults.visualFail || 0} | ${d3.gateResults.visualWaiver || 0} | ${d3.gateResults.visualPassRate || "N/A"} |
| Resource Policy | ${d3.gateResults.resourcePass || 0} | ${d3.gateResults.resourceFail || 0} | ${d3.gateResults.resourceWaiver || 0} | ${d3.gateResults.resourcePassRate || "N/A"} |
| **Overall** | **${d3.gateResults.pass || 0}** | **${d3.gateResults.fail || 0}** | **${d3.gateResults.waiver || 0}** | **${d3.firstPassRate || "N/A"}** |

### Rework Rate

- Tasks reviewed once: ${d3.reworkStats?.reviewed1x || 0}
- Tasks requiring rework (2+ reviews): ${d3.reworkStats?.reworkNeeded || 0}
- Rework percentage: ${d3.reworkStats?.reworkPercentage || "N/A"}

### Anomalies Detected

`;
  if (d3.anomalies && d3.anomalies.length > 0) {
    for (const anomaly of d3.anomalies) {
      content += `- **CODE D3.${anomaly.code}**: ${anomaly.detail}\n`;
      content += `  - **Recommendation**: ${anomaly.recommendation}\n`;
    }
  } else {
    content += `✅ No quality anomalies detected.\n`;
  }

  // D4: Knowledge Accumulation
  content += `
---

## 📚 D4: Knowledge Accumulation

### Pattern Library

- **New patterns extracted**: ${d4.patterns ? d4.patterns.length : 0}
- **Verified patterns** (3+ reuses): ${d4.verifiedPatternCount || 0}
- **Total patterns in library**: ${d4.totalPatternCount || 0}

`;
  if (d4.patterns && d4.patterns.length > 0) {
    content += `#### New Patterns (${period})\n\n`;
    for (const p of d4.patterns) {
      content += `- **${p.id || "UNNAMED"}**: ${p.description || "No description"}\n`;
      if (p.evidence) content += `  - Evidence: ${p.evidence}\n`;
    }
  }

  // Pitfall Library
  content += `
### Pitfall Library

- **New pitfalls extracted**: ${d4.pitfalls ? d4.pitfalls.length : 0}
- **Total pitfalls in library**: ${d4.totalPitfallCount || 0}

`;
  if (d4.pitfalls && d4.pitfalls.length > 0) {
    content += `#### New Pitfalls (${period})\n\n`;
    for (const p of d4.pitfalls) {
      content += `- **${p.id || "UNNAMED"}**: ${p.description || "No description"}\n`;
      if (p.avoidanceStrategy)
        content += `  - How to avoid: ${p.avoidanceStrategy}\n`;
    }
  }

  // D5: Dynamic Responsibility Distribution
  content += `
---

## 👥 D5: Dynamic Responsibility Distribution

### Current Load (${period})

`;
  if (d5.distribution) {
    for (const [owner, count] of Object.entries(d5.distribution)) {
      const percentage = d5.percentages ? d5.percentages[owner] || "?" : "?";
      content += `- **${owner}**: ${count} tasks (${percentage})\n`;
    }
  } else {
    content += `No distribution data available.\n`;
  }

  content += `
### Variance Analysis

- **Load variance**: ${d5.variance || "N/A"}
- **Deviation from expected**: ${d5.variancePercentage || "N/A"}
- **Status**: ${d5.variance && parseFloat(d5.variance) > 0.2 ? "🔴 HIGH (rebalance needed)" : "✅ NORMAL"}

`;
  if (d5.anomalies && d5.anomalies.length > 0) {
    for (const anomaly of d5.anomalies) {
      content += `
- **CODE D5.${anomaly.code}**: ${anomaly.detail}
  - **Recommendation**: ${anomaly.recommendation}
`;
    }
  }

  // D6: Decision Weight Calibration
  content += `
---

## ⚖️ D6: Decision Weight Calibration

### Current Weights

\`\`\`yaml
priority_formula:
  w1_competitor_threat: ${d6.weights?.w1 || 0.35}  # was: 0.35
  w2_ai_operability: ${d6.weights?.w2 || 0.3}     # was: 0.30
  w3_user_value: ${d6.weights?.w3 || 0.2}         # was: 0.20
  w4_tech_debt: ${d6.weights?.w4 || 0.1}          # was: 0.10
  w5_delivery_risk: ${d6.weights?.w5 || 0.05}      # was: 0.05
\`\`\`

### Weight Adjustment Suggestions

${
  d6.suggestedAdjustments && d6.suggestedAdjustments.length > 0
    ? d6.suggestedAdjustments
        .map(
          (adj) =>
            `- **${adj.field}**: Suggest ${adj.newValue} (confidence: ${adj.confidence}, reason: ${adj.reason})\n`,
        )
        .join("")
    : `✅ No adjustments suggested. Current weights remain optimal.\n`
}

### Last Month Accuracy

- **Priority accuracy**: ${d6.lastMonthAccuracy || "N/A"}
- **Mean absolute error**: ${d6.mae || "N/A"}
- **Directional accuracy**: ${d6.directionalAccuracy || "N/A"}

---

## 🎯 Summary & Action Items

### Overall Health

| Dimension | Status | Recommendation |
|-----------|--------|-----------------|
| D1 Estimation | ${d1.summary.avgDeviation <= 0.5 ? "✅ Good" : d1.summary.avgDeviation <= 1.0 ? "🟡 Needs monitoring" : "🔴 Action required"} | ${d1.actionItem || "None"} |
| D2 Bottlenecks | ${d2.bottleneckCount === 0 ? "✅ None" : d2.bottleneckCount <= 1 ? "🟡 1 critical" : "🔴 Multiple"} | ${d2.actionItem || "Monitor"} |
| D3 Quality | ${d3.firstPassRate && parseFloat(d3.firstPassRate) >= 80 ? "✅ High" : d3.firstPassRate && parseFloat(d3.firstPassRate) >= 70 ? "🟡 Acceptable" : "🔴 Low"} | ${d3.actionItem || "Improve test reliability"} |
| D4 Knowledge | ${d4.patterns && d4.patterns.length > 0 ? "✅ Growing" : "🟡 Stagnant"} | ${d4.actionItem || "Continue extraction"} |
| D5 Distribution | ${d5.variance && parseFloat(d5.variance) <= 0.2 ? "✅ Balanced" : "🔴 Unbalanced"} | ${d5.actionItem || "Rebalance if needed"} |
| D6 Weights | ${d6.suggestedAdjustments && d6.suggestedAdjustments.length > 0 ? "🟡 Adjustments available" : "✅ Stable"} | ${d6.actionItem || "Review next month"} |

### Orchestrator Action Items

${
  d1.anomalies && d1.anomalies.length > 0
    ? `- [ ] **D1 anomaly**: ${d1.anomalies[0].recommendation}\n`
    : ""
}${
    d2.anomalies && d2.anomalies.length > 0
      ? `- [ ] **D2 anomaly**: ${d2.anomalies[0].recommendation}\n`
      : ""
  }${
    d3.anomalies && d3.anomalies.length > 0
      ? `- [ ] **D3 anomaly**: ${d3.anomalies[0].recommendation}\n`
      : ""
  }${
    d6.suggestedAdjustments && d6.suggestedAdjustments.length > 0
      ? `- [ ] **D6 adjustments**: Review and approve weight changes\n`
      : ""
  }

---

**Generated by**: evolution-collector.mjs
**Last Updated**: ${generatedAt}
**Maintainer**: @orchestrator
**Next Review**: Next sprint orchestrator summary
`;

  if (!dryRun) {
    const fullPath = join(ROOT, filename);
    mkdirSync(dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, content, "utf-8");
    console.log(`✅ Generated: ${filename}`);
  }

  return {
    filename,
    content,
    path: filename,
  };
}

export default generateEvolutionSnapshot;
