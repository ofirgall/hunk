/** All remappable keyboard actions. */
export const KEY_ACTIONS = [
  "quit",
  "page_down",
  "page_up",
  "half_page_down",
  "half_page_up",
  "scroll_down",
  "scroll_up",
  "scroll_top",
  "scroll_bottom",
  "prev_hunk",
  "next_hunk",
  "prev_comment",
  "next_comment",
  "split_layout",
  "stack_layout",
  "auto_layout",
  "toggle_sidebar",
  "cycle_theme",
  "toggle_agent_notes",
  "toggle_line_numbers",
  "toggle_wrap",
  "toggle_hunk_headers",
  "toggle_help",
  "focus_filter",
  "toggle_focus",
  "open_menu",
  "refresh",
] as const;

export type KeyAction = (typeof KEY_ACTIONS)[number];

/**
 * Parsed representation of one key binding.
 * Modifier flags are only set when the descriptor explicitly requires them.
 */
export interface KeyDescriptor {
  key: string;
  shift?: boolean;
  ctrl?: boolean;
  meta?: boolean;
}

/** Map from action name to one or more key descriptors. */
export type Keymap = Record<KeyAction, KeyDescriptor[]>;

/**
 * Structural subset of a terminal key event used for matching.
 * Avoids a hard dependency on @opentui/core in the core layer.
 */
interface KeyLike {
  name?: string;
  sequence?: string;
  shift?: boolean;
  ctrl?: boolean;
  meta?: boolean;
}

/** Parse a key string like `"q"`, `"shift+space"`, or `"ctrl+c"` into a descriptor. */
export function parseKeyDescriptor(raw: string): KeyDescriptor {
  const parts = raw.toLowerCase().split("+");
  const descriptor: KeyDescriptor = { key: parts.pop()! };

  for (const mod of parts) {
    if (mod === "shift") descriptor.shift = true;
    else if (mod === "ctrl") descriptor.ctrl = true;
    else if (mod === "meta" || mod === "alt") descriptor.meta = true;
  }

  return descriptor;
}

/** Shorthand used for the built-in default table. */
function d(raw: string): KeyDescriptor {
  return parseKeyDescriptor(raw);
}

/** The built-in key assignments, matching the hardcoded defaults before this feature. */
export const DEFAULT_KEYMAP: Keymap = {
  quit: [d("q"), d("escape")],
  page_down: [d("space"), d("f"), d("pagedown")],
  page_up: [d("b"), d("pageup"), d("shift+space")],
  half_page_down: [d("d")],
  half_page_up: [d("u")],
  scroll_down: [d("down"), d("j")],
  scroll_up: [d("up"), d("k")],
  scroll_top: [d("home")],
  scroll_bottom: [d("end")],
  prev_hunk: [d("[")],
  next_hunk: [d("]")],
  prev_comment: [d("{")],
  next_comment: [d("}")],
  split_layout: [d("1")],
  stack_layout: [d("2")],
  auto_layout: [d("0")],
  toggle_sidebar: [d("s")],
  cycle_theme: [d("t")],
  toggle_agent_notes: [d("a")],
  toggle_line_numbers: [d("l")],
  toggle_wrap: [d("w")],
  toggle_hunk_headers: [d("m")],
  toggle_help: [d("?")],
  focus_filter: [d("/")],
  toggle_focus: [d("tab")],
  open_menu: [d("f10")],
  refresh: [d("r")],
};

/** Check whether a key event matches a single descriptor. */
function matchDescriptor(key: KeyLike, desc: KeyDescriptor): boolean {
  const isSpace = desc.key === "space";
  const isSingleLetter = !isSpace && desc.key.length === 1 && /^[a-z]$/i.test(desc.key);

  let baseMatch: boolean;
  if (isSpace) {
    baseMatch = key.name === "space" || key.name === " " || key.sequence === " ";
  } else if (isSingleLetter && desc.shift) {
    // Terminals emit uppercase for shift+letter without a reliable shift
    // flag.  Accept the uppercase char directly, or lowercase with shift.
    const upper = desc.key.toUpperCase();
    const lower = desc.key.toLowerCase();
    const matchesUpper = key.name === upper || key.sequence === upper;
    const matchesLowerWithShift = !!key.shift && (key.name === lower || key.sequence === lower);
    baseMatch = matchesUpper || matchesLowerWithShift;
  } else if (isSingleLetter && !desc.shift) {
    // Plain letter without shift: reject if the event carries a shift flag
    // or the reported name/sequence is uppercase, so "g" won't steal "G".
    if (key.shift) return false;
    const lower = desc.key.toLowerCase();
    const upper = desc.key.toUpperCase();
    const nameIsUpper = key.name === upper || key.sequence === upper;
    if (nameIsUpper && upper !== lower) return false;
    baseMatch = key.name === lower || key.sequence === lower;
  } else {
    baseMatch = key.name === desc.key || key.sequence === desc.key;
  }

  if (!baseMatch) return false;
  if (desc.shift && !isSingleLetter && !key.shift) return false;
  if (desc.ctrl && !key.ctrl) return false;
  if (desc.meta && !key.meta) return false;

  return true;
}

/** Return true if the key event matches any binding for the given action. */
export function matchesAction(key: KeyLike, action: KeyAction, keymap: Keymap): boolean {
  return keymap[action].some((desc) => matchDescriptor(key, desc));
}

// ---------------------------------------------------------------------------
// Config parsing
// ---------------------------------------------------------------------------

const VALID_ACTIONS = new Set<string>(KEY_ACTIONS);

/**
 * Parse a `[keys]` config section into partial keymap overrides.
 * Unknown action names are silently ignored.
 */
export function parseKeysConfig(
  source: Record<string, unknown>,
): Partial<Record<KeyAction, KeyDescriptor[]>> {
  const result: Partial<Record<KeyAction, KeyDescriptor[]>> = {};

  for (const [rawKey, value] of Object.entries(source)) {
    if (!VALID_ACTIONS.has(rawKey)) continue;
    const action = rawKey as KeyAction;

    if (typeof value === "string") {
      result[action] = [parseKeyDescriptor(value)];
    } else if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
      result[action] = (value as string[]).map(parseKeyDescriptor);
    }
  }

  return result;
}

/** Merge a base keymap with partial overrides. Overrides replace per-action, not append. */
export function mergeKeymap(
  base: Keymap,
  overrides: Partial<Record<KeyAction, KeyDescriptor[]>>,
): Keymap {
  const merged = { ...base };

  for (const [action, descriptors] of Object.entries(overrides)) {
    if (descriptors && VALID_ACTIONS.has(action)) {
      merged[action as KeyAction] = descriptors;
    }
  }

  return merged;
}

// ---------------------------------------------------------------------------
// Display formatting for the help dialog
// ---------------------------------------------------------------------------

const DISPLAY_NAMES: Record<string, string> = {
  space: "Space",
  pagedown: "PgDn",
  pageup: "PgUp",
  up: "↑",
  down: "↓",
  left: "←",
  right: "→",
  home: "Home",
  end: "End",
  tab: "Tab",
  escape: "Esc",
  return: "Enter",
  enter: "Enter",
  f1: "F1",
  f2: "F2",
  f3: "F3",
  f4: "F4",
  f5: "F5",
  f6: "F6",
  f7: "F7",
  f8: "F8",
  f9: "F9",
  f10: "F10",
  f11: "F11",
  f12: "F12",
};

/** Format a single descriptor for display (e.g. `{ key: "space", shift: true }` → `"Shift+Space"`). */
export function formatDescriptor(desc: KeyDescriptor): string {
  const parts: string[] = [];
  if (desc.ctrl) parts.push("Ctrl");
  if (desc.meta) parts.push("Meta");
  if (desc.shift) parts.push("Shift");
  parts.push(DISPLAY_NAMES[desc.key] ?? desc.key);
  return parts.join("+");
}

/** Format bindings for one action (e.g. `"Space / f / PgDn"`). Pass `max` to cap the count for compact display. */
export function formatActionKeys(action: KeyAction, keymap: Keymap, max?: number): string {
  const descriptors = max ? keymap[action].slice(0, max) : keymap[action];
  return descriptors.map(formatDescriptor).join(" / ");
}

/** Format the primary (first) binding of each action, joined by ` / `. Useful for paired entries like `"↑ / ↓"`. */
export function formatFirstKeys(keymap: Keymap, ...actions: KeyAction[]): string {
  return actions
    .map((a) => {
      const first = keymap[a][0];
      return first ? formatDescriptor(first) : "?";
    })
    .join(" / ");
}
