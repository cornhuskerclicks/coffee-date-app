import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { privateIntegrationToken, locationId } = await request.json()

    if (!privateIntegrationToken || !locationId) {
      return NextResponse.json({ 
        message: 'Both Private Integration Token and Location ID are required' 
      }, { status: 400 })
    }

    console.log('[v0] Testing GHL Private Integration')
    console.log('[v0] Location ID length:', locationId.length)
    console.log('[v0] Token length:', privateIntegrationToken.length)
    
    try {
      const testEndpoint = `https://services.leadconnectorhq.com/conversations/search?locationId=${locationId}`
      
      console.log('[v0] Testing endpoint:', testEndpoint)
      
      const testResponse = await fetch(testEndpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${privateIntegrationToken}`,
          'Version': '2021-07-28',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      const testResponseText = await testResponse.text()
      console.log('[v0] Response status:', testResponse.status)
      console.log('[v0] Response headers:', JSON.stringify(Object.fromEntries(testResponse.headers.entries())))
      console.log('[v0] Response body (first 500 chars):', testResponseText.substring(0, 500))

      if (!testResponse.ok) {
        let errorMessage = 'Invalid Location ID or Private Integration token.'
        let errorDetails = testResponseText
        
        try {
          const errorJson = JSON.parse(testResponseText)
          if (errorJson.message) {
            errorMessage = errorJson.message
          }
          if (errorJson.error) {
            errorDetails = errorJson.error
          }
        } catch (e) {
          // Not JSON, use text as is
        }

        console.error('[v0] API test failed:', {
          status: testResponse.status,
          message: errorMessage,
          details: errorDetails
        })
        
        return NextResponse.json(
          { 
            message: errorMessage,
            details: `Status ${testResponse.status}: ${errorDetails.substring(0, 300)}`,
            status: testResponse.status
          },
          { status: 401 }
        )
      }

      console.log('[v0] Connection test successful!')
      return NextResponse.json({ 
        success: true,
        message: 'Successfully connected to GoHighLevel!' 
      })
    } catch (fetchError: any) {
      console.error('[v0] Fetch error:', fetchError)
      return NextResponse.json(
        { 
          message: 'Network error during API test',
          details: fetchError.message
        },
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
