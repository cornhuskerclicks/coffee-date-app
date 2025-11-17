import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { apiKey, locationId } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ message: 'API key is required' }, { status: 400 })
    }

    // Test the API key by making a simple request to GHL
    const testResponse = await fetch('https://services.leadconnectorhq.com/conversations/search?limit=1', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Version': '2021-07-28'
      }
    })

    if (!testResponse.ok) {
      return NextResponse.json(
        { message: 'Invalid API credentials' },
        { status: 401 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[v0] Test connection error:', error)
    return NextResponse.json(
      { message: error.message || 'Connection test failed' },
      { status: 500 }
    )
  }
}
