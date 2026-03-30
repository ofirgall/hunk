import {
  DEFAULT_KEYMAP,
  formatActionKeys,
  formatFirstKeys,
  type Keymap,
} from "../../../core/keymap";
import { fitText, padText } from "../../lib/text";
import type { AppTheme } from "../../themes";
import { ModalFrame } from "./ModalFrame";

/** Render the keyboard help modal. */
export function HelpDialog({
  canRefresh = false,
  keymap = DEFAULT_KEYMAP,
  terminalHeight,
  terminalWidth,
  theme,
  onClose,
}: {
  canRefresh?: boolean;
  keymap?: Keymap;
  terminalHeight: number;
  terminalWidth: number;
  theme: AppTheme;
  onClose: () => void;
}) {
  const k = (action: Parameters<typeof formatActionKeys>[0]) => formatActionKeys(action, keymap, 2);

  const sections = [
    {
      title: "Navigation",
      items: [
        [formatFirstKeys(keymap, "scroll_up", "scroll_down"), "move line-by-line"],
        [k("page_down"), "page down"],
        [k("page_up"), "page up"],
        [formatFirstKeys(keymap, "half_page_down", "half_page_up"), "half page down / up"],
        [formatFirstKeys(keymap, "prev_hunk", "next_hunk"), "previous / next hunk"],
        [formatFirstKeys(keymap, "prev_comment", "next_comment"), "previous / next comment"],
        [formatFirstKeys(keymap, "scroll_top", "scroll_bottom"), "jump to top / bottom"],
      ],
    },
    {
      title: "View",
      items: [
        [
          formatFirstKeys(keymap, "split_layout", "stack_layout", "auto_layout"),
          "split / stack / auto",
        ],
        [formatFirstKeys(keymap, "toggle_sidebar", "cycle_theme"), "sidebar / theme"],
        [k("toggle_agent_notes"), "toggle AI notes"],
        [
          formatFirstKeys(keymap, "toggle_line_numbers", "toggle_wrap", "toggle_hunk_headers"),
          "lines / wrap / metadata",
        ],
      ],
    },
    {
      title: "Review",
      items: [
        [k("focus_filter"), "focus file filter"],
        [k("toggle_focus"), "toggle files/filter focus"],
        [k("open_menu"), "open menus"],
        [
          canRefresh ? `${k("refresh")} / ${k("quit")}` : k("quit"),
          canRefresh ? "reload / quit" : "quit",
        ],
      ],
    },
  ] as const;

  const width = Math.min(74, Math.max(56, terminalWidth - 8));
  const bodyWidth = Math.max(1, width - 4);
  const keyWidth = Math.min(16, Math.max(12, Math.floor(bodyWidth * 0.28)));
  const descriptionWidth = Math.max(1, bodyWidth - keyWidth);
  const sectionSpacerRowCount = Math.max(0, sections.length - 1);
  const contentRowCount =
    sections.reduce((rowCount, section) => rowCount + 1 + section.items.length, 0) +
    sectionSpacerRowCount;
  // ModalFrame contributes the border rows, title row, padding, and one blank spacer row.
  const modalFrameChromeRowCount = 6;
  const requiredModalHeight = contentRowCount + modalFrameChromeRowCount;
  const modalHeight = Math.min(requiredModalHeight, Math.max(8, terminalHeight - 2));
  const shouldScroll = modalHeight < requiredModalHeight;
  const content = (
    <box style={{ width: "100%", flexDirection: "column" }}>
      {sections.map((section, sectionIndex) => (
        <box key={section.title} style={{ width: "100%", flexDirection: "column" }}>
          <box style={{ width: "100%", height: 1 }}>
            <text fg={theme.badgeNeutral}>{section.title}</text>
          </box>
          {section.items.map(([keys, description]) => (
            <box
              key={`${section.title}:${keys}`}
              style={{ width: "100%", height: 1, flexDirection: "row" }}
            >
              <text fg={theme.accent}>{padText(fitText(keys, keyWidth), keyWidth)}</text>
              <text fg={theme.muted}>{fitText(description, descriptionWidth)}</text>
            </box>
          ))}
          {sectionIndex < sections.length - 1 ? <box style={{ width: "100%", height: 1 }} /> : null}
        </box>
      ))}
    </box>
  );

  return (
    <ModalFrame
      height={modalHeight}
      terminalHeight={terminalHeight}
      terminalWidth={terminalWidth}
      theme={theme}
      title="Keyboard help"
      width={width}
      onClose={onClose}
    >
      {shouldScroll ? (
        <scrollbox focused={false} height="100%" scrollY={true} width="100%">
          {content}
        </scrollbox>
      ) : (
        content
      )}
    </ModalFrame>
  );
}
