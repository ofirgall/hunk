import { describe, expect, test } from "bun:test";
import {
  DEFAULT_KEYMAP,
  formatActionKeys,
  formatDescriptor,
  formatFirstKeys,
  matchesAction,
  mergeKeymap,
  parseKeyDescriptor,
  parseKeysConfig,
} from "../src/core/keymap";

describe("parseKeyDescriptor", () => {
  test("parses a simple key", () => {
    expect(parseKeyDescriptor("q")).toEqual({ key: "q" });
  });

  test("parses a function key", () => {
    expect(parseKeyDescriptor("f10")).toEqual({ key: "f10" });
  });

  test("parses shift modifier", () => {
    expect(parseKeyDescriptor("shift+space")).toEqual({ key: "space", shift: true });
  });

  test("parses ctrl modifier", () => {
    expect(parseKeyDescriptor("ctrl+c")).toEqual({ key: "c", ctrl: true });
  });

  test("parses multiple modifiers", () => {
    expect(parseKeyDescriptor("ctrl+shift+x")).toEqual({ key: "x", ctrl: true, shift: true });
  });

  test("normalizes to lowercase", () => {
    expect(parseKeyDescriptor("Shift+Space")).toEqual({ key: "space", shift: true });
  });
});

describe("matchesAction", () => {
  test("matches a simple key by name", () => {
    expect(matchesAction({ name: "q" }, "quit", DEFAULT_KEYMAP)).toBe(true);
  });

  test("matches escape for quit", () => {
    expect(matchesAction({ name: "escape" }, "quit", DEFAULT_KEYMAP)).toBe(true);
  });

  test("does not match an unbound key", () => {
    expect(matchesAction({ name: "z" }, "quit", DEFAULT_KEYMAP)).toBe(false);
  });

  test("matches space by name", () => {
    expect(matchesAction({ name: "space" }, "page_down", DEFAULT_KEYMAP)).toBe(true);
  });

  test("matches space reported as literal ' '", () => {
    expect(matchesAction({ name: " ", sequence: " " }, "page_down", DEFAULT_KEYMAP)).toBe(true);
  });

  test("matches shift+space for page_up", () => {
    expect(
      matchesAction({ name: "space", shift: true, sequence: " " }, "page_up", DEFAULT_KEYMAP),
    ).toBe(true);
  });

  test("matches key by sequence", () => {
    expect(matchesAction({ sequence: "{" }, "prev_comment", DEFAULT_KEYMAP)).toBe(true);
    expect(matchesAction({ sequence: "}" }, "next_comment", DEFAULT_KEYMAP)).toBe(true);
  });

  test("matches bracket keys by name", () => {
    expect(matchesAction({ name: "[" }, "prev_hunk", DEFAULT_KEYMAP)).toBe(true);
    expect(matchesAction({ name: "]" }, "next_hunk", DEFAULT_KEYMAP)).toBe(true);
  });
});

describe("parseKeysConfig", () => {
  test("parses a single string value", () => {
    const result = parseKeysConfig({ quit: "x" });
    expect(result.quit).toEqual([{ key: "x" }]);
  });

  test("parses an array of strings", () => {
    const result = parseKeysConfig({ page_down: ["space", "f"] });
    expect(result.page_down).toEqual([{ key: "space" }, { key: "f" }]);
  });

  test("ignores unknown action names", () => {
    const result = parseKeysConfig({ unknown_action: "x", quit: "q" });
    expect(result).toEqual({ quit: [{ key: "q" }] });
  });

  test("ignores non-string values", () => {
    const result = parseKeysConfig({ quit: 42 });
    expect(result).toEqual({});
  });

  test("parses modifier syntax", () => {
    const result = parseKeysConfig({ page_up: ["b", "shift+space"] });
    expect(result.page_up).toEqual([{ key: "b" }, { key: "space", shift: true }]);
  });
});

describe("mergeKeymap", () => {
  test("overrides replace per-action, not append", () => {
    const merged = mergeKeymap(DEFAULT_KEYMAP, { quit: [{ key: "x" }] });
    expect(merged.quit).toEqual([{ key: "x" }]);
    expect(merged.page_down).toEqual(DEFAULT_KEYMAP.page_down);
  });

  test("merging empty overrides returns base unchanged", () => {
    const merged = mergeKeymap(DEFAULT_KEYMAP, {});
    expect(merged).toEqual(DEFAULT_KEYMAP);
  });
});

describe("formatting", () => {
  test("formatDescriptor renders simple key", () => {
    expect(formatDescriptor({ key: "q" })).toBe("q");
  });

  test("formatDescriptor renders special key names", () => {
    expect(formatDescriptor({ key: "space" })).toBe("Space");
    expect(formatDescriptor({ key: "pagedown" })).toBe("PgDn");
    expect(formatDescriptor({ key: "f10" })).toBe("F10");
  });

  test("formatDescriptor renders modifier combo", () => {
    expect(formatDescriptor({ key: "space", shift: true })).toBe("Shift+Space");
  });

  test("formatActionKeys joins all bindings", () => {
    const km = mergeKeymap(DEFAULT_KEYMAP, { quit: [{ key: "q" }, { key: "escape" }] });
    expect(formatActionKeys("quit", km)).toBe("q / Esc");
  });

  test("formatFirstKeys picks first binding of each action", () => {
    expect(formatFirstKeys(DEFAULT_KEYMAP, "scroll_up", "scroll_down")).toBe("↑ / ↓");
    expect(formatFirstKeys(DEFAULT_KEYMAP, "prev_hunk", "next_hunk")).toBe("[ / ]");
  });
});
