import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { privateIntegrationToken, locationId } = await request.json()

    if (!privateIntegrationToken || !locationId) {
      return NextResponse.json({ 
        message: 'Both Private Integration Token and Location ID are required' 
      }, { status: 400 })
    }

    console.log('[v0] Testing GHL Private Integration token for location:', locationId)
    
    try {
      const testEndpoint = `https://services.leadconnectorhq.com/locations/${locationId}`
      
      const testResponse = await fetch(testEndpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${privateIntegrationToken}`,
          'Version': '2021-07-28',
          'Accept': 'application/json'
        }
      })

      const testResponseText = await testResponse.text()
      console.log('[v0] API test response status:', testResponse.status)
      console.log('[v0] API test response:', testResponseText.substring(0, 200))

      if (!testResponse.ok) {
        console.error('[v0] API test failed:', testResponseText)
        
        return NextResponse.json(
          { 
            message: 'Invalid Location ID or Private Integration token. Please check the client sub-account settings and try again.',
            details: `Status ${testResponse.status}: ${testResponseText.substring(0, 200)}`,
            status: testResponse.status
          },
          { status: 401 }
        )
      }

      console.log('[v0] Connection test successful')
      return NextResponse.json({ 
        success: true,
        message: 'Successfully connected to GoHighLevel!' 
      })
    } catch (fetchError: any) {
      console.error('[v0] API test fetch error:', fetchError)
      return NextResponse.json(
        { message: `Network error during API test: ${fetchError.message}` },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('[v0] Test connection error:', error)
    return NextResponse.json(
      { message: error.message || 'Connection test failed' },
      { status: 500 }
    )
  }
}
