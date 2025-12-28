/**
 * Composable for extracting colors from images
 * Used for auto-generating brand colors from logos
 */

export interface ExtractedColors {
  primary: string
  secondary: string
  palette: string[]
}

export function useColorExtraction() {
  const isExtracting = ref(false)

  /**
   * Extract dominant colors from an image file
   */
  async function extractFromFile(file: File): Promise<ExtractedColors | null> {
    isExtracting.value = true

    try {
      return await new Promise((resolve) => {
        const img = new Image()
        img.crossOrigin = 'Anonymous'

        img.onload = () => {
          const colors = extractFromImage(img)
          URL.revokeObjectURL(img.src)
          resolve(colors)
        }

        img.onerror = () => {
          URL.revokeObjectURL(img.src)
          resolve(null)
        }

        img.src = URL.createObjectURL(file)
      })
    }
    finally {
      isExtracting.value = false
    }
  }

  /**
   * Extract dominant colors from an image URL
   */
  async function extractFromUrl(url: string): Promise<ExtractedColors | null> {
    isExtracting.value = true

    try {
      return await new Promise((resolve) => {
        const img = new Image()
        img.crossOrigin = 'Anonymous'

        img.onload = () => {
          const colors = extractFromImage(img)
          resolve(colors)
        }

        img.onerror = () => resolve(null)
        img.src = url
      })
    }
    finally {
      isExtracting.value = false
    }
  }

  /**
   * Extract colors from an HTMLImageElement
   */
  function extractFromImage(img: HTMLImageElement): ExtractedColors {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      return getDefaultColors()
    }

    // Scale down for faster processing
    const maxSize = 50
    const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
    canvas.width = Math.max(1, Math.floor(img.width * scale))
    canvas.height = Math.max(1, Math.floor(img.height * scale))

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    return analyzeImageData(imageData.data)
  }

  /**
   * Parse RGB values from a color key string
   */
  function parseColorKey(key: string): [number, number, number] {
    const parts = key.split(',').map(Number)
    return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0]
  }

  /**
   * Analyze pixel data to find dominant colors
   */
  function analyzeImageData(data: Uint8ClampedArray): ExtractedColors {
    const colorCounts: Record<string, number> = {}

    // Sample pixels (skip every 4 for speed)
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i] ?? 0
      const g = data[i + 1] ?? 0
      const b = data[i + 2] ?? 0
      const a = data[i + 3] ?? 0

      // Skip transparent pixels
      if (a < 128) continue

      // Skip near-white pixels
      if (r > 240 && g > 240 && b > 240) continue

      // Skip near-black pixels
      if (r < 15 && g < 15 && b < 15) continue

      // Skip very desaturated pixels (grays)
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      if (max - min < 20 && max > 50 && max < 200) continue

      // Quantize to reduce color space
      const qr = Math.round(r / 32) * 32
      const qg = Math.round(g / 32) * 32
      const qb = Math.round(b / 32) * 32

      const key = `${qr},${qg},${qb}`
      colorCounts[key] = (colorCounts[key] || 0) + 1
    }

    // Sort by frequency
    const sorted = Object.entries(colorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)

    if (sorted.length === 0) {
      return getDefaultColors()
    }

    // Extract palette
    const palette = sorted.map(([key]) => {
      const [r, g, b] = parseColorKey(key)
      return rgbToHex(r, g, b)
    })

    // Primary is the most dominant color
    const firstEntry = sorted[0]
    if (!firstEntry) {
      return getDefaultColors()
    }
    const [pr, pg, pb] = parseColorKey(firstEntry[0])
    const primary = rgbToHex(pr, pg, pb)

    // Secondary should contrast with primary
    let secondary = '#1f2937' // Default dark gray

    if (sorted.length > 1) {
      // Find a color that contrasts well
      for (let i = 1; i < sorted.length; i++) {
        const entry = sorted[i]
        if (!entry) continue
        const [sr, sg, sb] = parseColorKey(entry[0])
        const distance = colorDistance(pr, pg, pb, sr, sg, sb)

        if (distance > 80) {
          secondary = rgbToHex(sr, sg, sb)
          break
        }
      }

      // If no contrasting color found, darken the primary
      if (secondary === '#1f2937') {
        secondary = rgbToHex(
          Math.max(0, pr - 80),
          Math.max(0, pg - 80),
          Math.max(0, pb - 80),
        )
      }
    }

    return { primary, secondary, palette }
  }

  /**
   * Convert RGB to hex color
   */
  function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b]
      .map(x => Math.min(255, Math.max(0, x)).toString(16).padStart(2, '0'))
      .join('')
  }

  /**
   * Calculate distance between two colors
   */
  function colorDistance(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number {
    return Math.sqrt((r2 - r1) ** 2 + (g2 - g1) ** 2 + (b2 - b1) ** 2)
  }

  /**
   * Get default colors when extraction fails
   */
  function getDefaultColors(): ExtractedColors {
    return {
      primary: '#1e40af',
      secondary: '#1f2937',
      palette: ['#1e40af', '#1f2937', '#3b82f6', '#6b7280'],
    }
  }

  return {
    isExtracting: readonly(isExtracting),
    extractFromFile,
    extractFromUrl,
    extractFromImage,
  }
}
