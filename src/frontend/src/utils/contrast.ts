// Utility function to calculate contrast color (black or white) based on background
export function getContrastColor(backgroundColor: string): string {
  // Default to black if no background or invalid color
  if (!backgroundColor || backgroundColor === 'transparent') {
    return '#000000'
  }

  // Convert hex to RGB
  let r: number, g: number, b: number

  if (backgroundColor.startsWith('#')) {
    const hex = backgroundColor.replace('#', '')
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16)
      g = parseInt(hex[1] + hex[1], 16)
      b = parseInt(hex[2] + hex[2], 16)
    } else {
      r = parseInt(hex.substring(0, 2), 16)
      g = parseInt(hex.substring(2, 4), 16)
      b = parseInt(hex.substring(4, 6), 16)
    }
  } else if (backgroundColor.startsWith('rgb')) {
    const match = backgroundColor.match(/\d+/g)
    if (match) {
      r = parseInt(match[0])
      g = parseInt(match[1])
      b = parseInt(match[2])
    } else {
      return '#000000'
    }
  } else {
    // Try named colors or default to black
    const ctx = document.createElement('canvas').getContext('2d')
    if (ctx) {
      ctx.fillStyle = backgroundColor
      const computed = ctx.fillStyle
      if (computed.startsWith('#')) {
        return getContrastColor(computed)
      }
    }
    return '#000000'
  }

  // Calculate relative luminance using WCAG formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  // Return white for dark backgrounds, black for light backgrounds
  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}

// Calculate if a color is light or dark
export function isLightColor(backgroundColor: string): boolean {
  const contrastColor = getContrastColor(backgroundColor)
  return contrastColor === '#000000'
}
