import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { apiKey, locationId } = await request.json()

    if (!apiKey || !locationId) {
      return NextResponse.json({ 
        message: 'Both Location API Key and Location ID are required' 
      }, { status: 400 })
    }

    console.log('[v0] Testing GHL location API key')
    
    try {
      // Test with conversations endpoint for this location
      const testEndpoint = `https://services.leadconnectorhq.com/conversations/search?locationId=${locationId}`
      
      const testResponse = await fetch(testEndpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Version': '2021-07-28',
          'Accept': 'application/json'
        }
      })

      const testResponseText = await testResponse.text()
      console.log('[v0] API test response status:', testResponse.status)

      if (!testResponse.ok) {
        console.error('[v0] API test failed:', testResponseText)
        
        return NextResponse.json(
          { 
            message: 'Invalid Location ID or API Key. Please verify your credentials in GoHighLevel.',
            details: testResponseText,
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
