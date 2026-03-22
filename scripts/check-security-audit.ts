#!/usr/bin/env bun

interface RawAuditEntry {
  id: number;
  url: string;
  title: string;
  severity: string;
  vulnerable_versions?: string;
}

interface AllowedAuditFinding {
  packageName: string;
  id: number;
  note: string;
}

export interface AuditFinding {
  packageName: string;
  id: number;
  url: string;
  title: string;
  severity: string;
  vulnerableVersions?: string;
}

export const ALLOWED_AUDIT_FINDINGS: AllowedAuditFinding[] = [
  {
    packageName: "diff",
    id: 1112706,
    note: "Transitive via @opentui/core@0.1.88; Hunk and @pierre/diffs already use diff@8.0.3.",
  },
  {
    packageName: "file-type",
    id: 1114301,
    note: "Transitive via @opentui/core -> jimp; keep watching upstream updates.",
  },
];

function stripAnsi(text: string) {
  return text.replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, "").replace(/\x1b[@-_]/g, "");
}

function findingKey(finding: Pick<AuditFinding, "packageName" | "id">) {
  return `${finding.packageName}:${finding.id}`;
}

/** Parse Bun's audit JSON output even when the CLI prefixes it with banner text. */
export function parseBunAuditJson(output: string): AuditFinding[] {
  const normalized = stripAnsi(output).trim();
  const jsonStart = normalized.indexOf("{");
  if (jsonStart < 0) {
    throw new Error(`Could not find JSON in bun audit output. Full output:\n${output}`);
  }

  const parsed = JSON.parse(normalized.slice(jsonStart)) as Record<string, RawAuditEntry[]>;

  return Object.entries(parsed).flatMap(([packageName, advisories]) =>
    (advisories ?? []).map((advisory) => ({
      packageName,
      id: advisory.id,
      url: advisory.url,
      title: advisory.title,
      severity: advisory.severity,
      vulnerableVersions: advisory.vulnerable_versions,
    })),
  );
}

export function evaluateAuditFindings(
  findings: AuditFinding[],
  allowlist: AllowedAuditFinding[] = ALLOWED_AUDIT_FINDINGS,
) {
  const findingKeys = new Set(findings.map((finding) => findingKey(finding)));
  const allowlistKeys = new Set(allowlist.map((finding) => findingKey(finding)));

  return {
    unexpectedFindings: findings.filter((finding) => !allowlistKeys.has(findingKey(finding))),
    staleAllowlistEntries: allowlist.filter((finding) => !findingKeys.has(findingKey(finding))),
  };
}

function renderFinding(finding: AuditFinding) {
  return `- ${finding.packageName}#${finding.id} [${finding.severity}] ${finding.title} (${finding.url})`;
}

function renderAllowedEntry(entry: AllowedAuditFinding) {
  return `- ${entry.packageName}#${entry.id} — ${entry.note}`;
}

async function main() {
  const proc = Bun.spawnSync([process.execPath, "audit", "--json"], {
    cwd: process.cwd(),
    stdin: "ignore",
    stdout: "pipe",
    stderr: "pipe",
    env: process.env,
  });

  const stdout = Buffer.from(proc.stdout).toString("utf8");
  const stderr = Buffer.from(proc.stderr).toString("utf8").trim();

  if (proc.exitCode !== 0 && stdout.trim().length === 0) {
    throw new Error(stderr || "bun audit failed before it could produce JSON output.");
  }

  const findings = parseBunAuditJson(stdout);
  const { unexpectedFindings, staleAllowlistEntries } = evaluateAuditFindings(findings);

  if (unexpectedFindings.length > 0 || staleAllowlistEntries.length > 0) {
    const sections = [
      unexpectedFindings.length > 0
        ? ["Unexpected bun audit findings:", ...unexpectedFindings.map(renderFinding)].join("\n")
        : null,
      staleAllowlistEntries.length > 0
        ? ["Stale audit allowlist entries:", ...staleAllowlistEntries.map(renderAllowedEntry)].join("\n")
        : null,
    ].filter((section): section is string => Boolean(section));

    throw new Error(sections.join("\n\n"));
  }

  console.log(`Security audit check passed with ${findings.length} known finding(s) still allowlisted.`);
  if (findings.length > 0) {
    for (const finding of findings) {
      console.log(renderFinding(finding));
    }
  }
}

if (import.meta.main) {
  await main();
}
