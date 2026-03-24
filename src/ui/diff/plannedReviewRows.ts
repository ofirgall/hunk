import type { LayoutMode } from "../../core/types";
import { measureAgentInlineNoteHeight } from "../components/panes/AgentInlineNote";
import { reviewRowId } from "../lib/ids";
import type { PlannedReviewRow } from "./reviewRenderPlan";

export interface PlannedReviewRowLayoutOptions {
  showHunkHeaders: boolean;
  layout: Exclude<LayoutMode, "auto">;
  width: number;
}

export interface PlannedHunkBounds {
  top: number;
  height: number;
  startRowId: string;
  endRowId: string;
}

function rowContributesToHunkBounds(row: PlannedReviewRow) {
  // Collapsed gap rows belong between hunks, so they affect total section height but not a hunk's
  // own visible extent.
  return !(row.kind === "diff-row" && row.row.type === "collapsed");
}

export function plannedReviewRowHeight(
  row: PlannedReviewRow,
  { showHunkHeaders, layout, width }: PlannedReviewRowLayoutOptions,
) {
  if (row.kind === "inline-note") {
    return measureAgentInlineNoteHeight({
      annotation: row.annotation,
      anchorSide: row.anchorSide,
      layout,
      width,
    });
  }

  if (row.kind === "note-guide-cap") {
    return 1;
  }

  if (row.row.type === "hunk-header") {
    return showHunkHeaders ? 1 : 0;
  }

  return 1;
}

export function plannedReviewRowVisible(
  row: PlannedReviewRow,
  options: PlannedReviewRowLayoutOptions,
) {
  return plannedReviewRowHeight(row, options) > 0;
}

export function measurePlannedHunkBounds(
  plannedRows: PlannedReviewRow[],
  options: PlannedReviewRowLayoutOptions,
) {
  const hunkAnchorRows = new Map<number, number>();
  const hunkBounds = new Map<number, PlannedHunkBounds>();
  let bodyHeight = 0;

  for (const row of plannedRows) {
    if (row.kind === "diff-row" && row.anchorId && !hunkAnchorRows.has(row.hunkIndex)) {
      hunkAnchorRows.set(row.hunkIndex, bodyHeight);
    }

    const rowHeight = plannedReviewRowHeight(row, options);

    if (rowHeight > 0 && rowContributesToHunkBounds(row)) {
      const rowId = reviewRowId(row.key);
      const existingBounds = hunkBounds.get(row.hunkIndex);

      if (existingBounds) {
        existingBounds.endRowId = rowId;
        existingBounds.height += rowHeight;
      } else {
        hunkBounds.set(row.hunkIndex, {
          top: bodyHeight,
          height: rowHeight,
          startRowId: rowId,
          endRowId: rowId,
        });
      }
    }

    bodyHeight += rowHeight;
  }

  return {
    bodyHeight,
    hunkAnchorRows,
    hunkBounds,
  };
}
