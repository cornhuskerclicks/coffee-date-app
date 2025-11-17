import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { apiKey, locationId } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ message: 'API key is required' }, { status: 400 })
    }

    console.log('[v0] Testing GHL connection with location ID:', locationId ? 'Yes' : 'No')

    let accessToken = apiKey
    
    if (locationId) {
      console.log('[v0] Exchanging agency token for location token')
      const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/locationToken', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          locationId: locationId
        })
      })

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text()
        console.error('[v0] Location token exchange failed:', errorText)
        return NextResponse.json(
          { message: 'Invalid agency API key or location ID. Please verify your credentials.' },
          { status: 401 }
        )
      }

      const tokenData = await tokenResponse.json()
      accessToken = tokenData.access_token
      console.log('[v0] Successfully obtained location token')
    }

    // Test the access token by making a request to GHL
    console.log('[v0] Testing access token with conversations API')
    const testResponse = await fetch('https://services.leadconnectorhq.com/conversations/search?limit=1', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28'
      }
    })

    if (!testResponse.ok) {
      const errorText = await testResponse.text()
      console.error('[v0] API test failed:', errorText)
      return NextResponse.json(
        { message: 'Invalid API credentials. Please check your API key and location ID.' },
        { status: 401 }
      )
    }

    console.log('[v0] Connection test successful')
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[v0] Test connection error:', error)
    return NextResponse.json(
      { message: error.message || 'Connection test failed' },
      { status: 500 }
    )
  }
}
