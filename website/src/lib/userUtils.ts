/**
 * Utility functions for user data processing
 */

export interface ParsedEmailData {
  joinYear: number
  lastName: string
  firstInitial: string
  realName: string
  yearGroup: number
  rankColor: string
  minecraftColor: string
}

/**
 * Parse email address to extract user information
 * Format: 20-tsvetanov-k@thestreetlyacademy.co.uk
 */
export function parseEmailData(email: string): ParsedEmailData | null {
  try {
    const emailPattern = /^(\d{2})-([a-zA-Z]+)-([a-zA-Z])@/
    const match = email.match(emailPattern)
    
    if (!match) {
      return null
    }
    
    const [, joinYearShort, lastName, firstInitial] = match
    const startYear = 2000 + parseInt(joinYearShort) // Year they started at Streetly (Year 7)
    
    // Calculate year group based on current date
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() // 0 = January, 8 = September
    
    // Calculate years passed since they started
    let yearsPassed = currentYear - startYear
    
    // If we haven't reached September yet, they haven't moved up a year
    if (currentMonth < 8) { // Before September
      yearsPassed -= 1
    }
    
    // Year 7 + years passed = current year group
    const yearGroup = 7 + yearsPassed
    
    // Format real name: "K. Tsvetanov"
    const realName = `${firstInitial.toUpperCase()}. ${lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase()}`
    
    // Get rank color
    const { rankColor, minecraftColor } = getYearGroupColor(yearGroup)
    
    return {
      joinYear: startYear,
      lastName: lastName.toLowerCase(),
      firstInitial: firstInitial.toLowerCase(),
      realName,
      yearGroup,
      rankColor,
      minecraftColor
    }
  } catch (error) {
    console.error('Error parsing email:', error)
    return null
  }
}

/**
 * Get color mapping for year group
 */
export function getYearGroupColor(yearGroup: number): { rankColor: string; minecraftColor: string } {
  const colorMap: Record<number, { rankColor: string; minecraftColor: string }> = {
    7: { rankColor: '#FFFF55', minecraftColor: '§e' },  // Yellow
    8: { rankColor: '#55FF55', minecraftColor: '§a' },  // Green
    9: { rankColor: '#FF5555', minecraftColor: '§c' },  // Red
    10: { rankColor: '#5555FF', minecraftColor: '§9' }, // Blue
    11: { rankColor: '#AA00AA', minecraftColor: '§5' }, // Purple
    12: { rankColor: '#FF9D3D', minecraftColor: '§6' }, // Orange
    13: { rankColor: '#FF9D3D', minecraftColor: '§6' }, // Orange
  }
  
  return colorMap[yearGroup] || { rankColor: '#FFFFFF', minecraftColor: '§f' }
}

/**
 * Get year group display name
 */
export function getYearGroupName(yearGroup: number): string {
  if (yearGroup >= 7 && yearGroup <= 13) {
    return `Year ${yearGroup}`
  }
  return 'Unknown'
}

/**
 * Validate email format for Streetly Academy
 */
export function isValidStreetlyEmail(email: string): boolean {
  const pattern = /^\d{2}-[a-zA-Z]+-[a-zA-Z]@thestreetlyacademy\.co\.uk$/
  return pattern.test(email)
}
