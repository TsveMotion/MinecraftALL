import { NextRequest, NextResponse } from 'next/server'

/**
 * Chat stream endpoint for Minecraft plugin
 * Plugin sends chat messages here which are forwarded to WebSocket server
 */

export async function POST(request: NextRequest) {
  try {
    // Verify plugin API key
    const apiKey = request.headers.get('x-api-key')
    const expectedKey = process.env.PLUGIN_API_KEY

    if (expectedKey && apiKey !== expectedKey) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    const { username, displayName, roleSymbol, roleColor, message } = await request.json()

    if (!username || !message) {
      return NextResponse.json({ error: 'Username and message are required' }, { status: 400 })
    }

    // Forward to WebSocket server
    const wsServerUrl = process.env.WS_SERVER_URL || 'http://127.0.0.1:8081'
    
    try {
      await fetch(`${wsServerUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          displayName: displayName || username,
          roleSymbol: roleSymbol || null,
          roleColor: roleColor || null,
          message
        })
      })
    } catch (wsError) {
      console.warn('Failed to forward to WebSocket server:', wsError)
      // Continue anyway - don't fail the request
    }

    return NextResponse.json({ success: true, message: 'Chat message received' })
  } catch (error) {
    console.error('Failed to process chat stream:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get chat history from WebSocket server
export async function GET(request: NextRequest) {
  try {
    const wsServerUrl = process.env.WS_SERVER_URL || 'http://127.0.0.1:8081'
    
    // Proxy request to WS server HTTP endpoint
    const response = await fetch(`${wsServerUrl}/health`)
    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({ messages: [], connected: true, ...data })
    }
    
    return NextResponse.json({ messages: [], connected: false })
  } catch (error) {
    console.error('Failed to fetch from WebSocket server:', error)
    return NextResponse.json({ messages: [], connected: false }, { status: 200 })
  }
}
