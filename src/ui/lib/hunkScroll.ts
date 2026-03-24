export function computeHunkRevealScrollTop({
  hunkTop,
  hunkHeight,
  preferredTopPadding,
  viewportHeight,
}: {
  hunkTop: number;
  hunkHeight: number;
  preferredTopPadding: number;
  viewportHeight: number;
}) {
  const clampedTop = Math.max(0, hunkTop);
  const clampedHeight = Math.max(0, hunkHeight);
  const clampedViewportHeight = Math.max(0, viewportHeight);
  const desiredTop = Math.max(0, clampedTop - Math.max(0, preferredTopPadding));

  if (clampedViewportHeight === 0) {
    return desiredTop;
  }

  if (clampedHeight <= clampedViewportHeight) {
    const minimumTopForFullHunk = Math.max(0, clampedTop + clampedHeight - clampedViewportHeight);
    return Math.max(desiredTop, minimumTopForFullHunk);
  }

  return desiredTop;
}
