import crypto from 'crypto'

const API_SHARED_SECRET = process.env.API_SHARED_SECRET || ''

export function generateHMAC(data: string): string {
  if (!API_SHARED_SECRET) {
    throw new Error('API_SHARED_SECRET not configured')
  }

  return crypto
    .createHmac('sha256', API_SHARED_SECRET)
    .update(data)
    .digest('hex')
}

export function verifyHMAC(data: string, signature: string): boolean {
  if (!API_SHARED_SECRET) {
    console.error('API_SHARED_SECRET not configured')
    return false
  }

  try {
    const expected = generateHMAC(data)
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected)
    )
  } catch (error) {
    console.error('HMAC verification error:', error)
    return false
  }
}

export function verifyPluginRequest(body: any, signature: string | undefined): boolean {
  if (!signature) {
    console.error('Missing X-MC-SIGN header')
    return false
  }

  const bodyString = typeof body === 'string' ? body : JSON.stringify(body)
  return verifyHMAC(bodyString, signature)
}
