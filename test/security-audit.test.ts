import { describe, expect, test } from "bun:test";
import { ALLOWED_AUDIT_FINDINGS, evaluateAuditFindings, parseBunAuditJson } from "../scripts/check-security-audit";

describe("security audit helpers", () => {
  test("parseBunAuditJson tolerates Bun's banner text", () => {
    const findings = parseBunAuditJson(
      "\u001b[0m\u001b[1mbun audit \u001b[0m\u001b[2mv1.3.10\u001b[0m\n" +
        JSON.stringify({
          diff: [
            {
              id: 1112706,
              url: "https://github.com/advisories/GHSA-73rr-hh4g-fpgx",
              title: "jsdiff has a Denial of Service vulnerability in parsePatch and applyPatch",
              severity: "low",
              vulnerable_versions: ">=6.0.0 <8.0.3",
            },
          ],
        }),
    );

    expect(findings).toEqual([
      {
        packageName: "diff",
        id: 1112706,
        url: "https://github.com/advisories/GHSA-73rr-hh4g-fpgx",
        title: "jsdiff has a Denial of Service vulnerability in parsePatch and applyPatch",
        severity: "low",
        vulnerableVersions: ">=6.0.0 <8.0.3",
      },
    ]);
  });

  test("evaluateAuditFindings reports both unexpected findings and stale allowlist entries", () => {
    const findings = [
      {
        packageName: "diff",
        id: 1112706,
        url: "https://github.com/advisories/GHSA-73rr-hh4g-fpgx",
        title: "Known diff advisory",
        severity: "low",
      },
      {
        packageName: "new-package",
        id: 999999,
        url: "https://github.com/advisories/example",
        title: "Unexpected advisory",
        severity: "high",
      },
    ];

    const result = evaluateAuditFindings(findings, ALLOWED_AUDIT_FINDINGS);

    expect(result.unexpectedFindings).toEqual([
      {
        packageName: "new-package",
        id: 999999,
        url: "https://github.com/advisories/example",
        title: "Unexpected advisory",
        severity: "high",
      },
    ]);
    expect(result.staleAllowlistEntries).toEqual([
      ALLOWED_AUDIT_FINDINGS[1]!,
    ]);
  });
});
