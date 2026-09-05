/**
 * An inline SVG data URI showing the product's initial on a coloured ground.
 * Spec §11 forbids hotlinking: the app must look correct with no internet,
 * and data URIs keep the repository free of hundreds of binary files.
 */
export function placeholderSvgDataUri(label: string, hue: number): string {
  const initial = (label.trim()[0] ?? '?').toUpperCase()
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">` +
    `<rect width="96" height="96" rx="12" fill="hsl(${hue} 62% 88%)"/>` +
    `<text x="48" y="48" font-family="system-ui,sans-serif" font-size="42" font-weight="600" ` +
    `fill="hsl(${hue} 55% 32%)" text-anchor="middle" dominant-baseline="central">${initial}</text>` +
    `</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
