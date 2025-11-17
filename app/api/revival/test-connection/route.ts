import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { apiKey, locationId } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ message: 'API key is required' }, { status: 400 })
    }

    console.log('[v0] Testing GHL connection')
    console.log('[v0] Has location ID:', !!locationId)

    let accessToken = apiKey
    
    if (locationId) {
      console.log('[v0] Exchanging agency token for location token')
      
      try {
        const tokenResponse = await fetch('https://services.leadconnectorhq.com/oauth/locationToken', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            locationId: locationId.trim()
          })
        })

        const responseText = await tokenResponse.text()
        console.log('[v0] Token exchange response status:', tokenResponse.status)
        console.log('[v0] Token exchange response:', responseText)

        if (!tokenResponse.ok) {
          console.error('[v0] Location token exchange failed')
          
          // Parse error message if available
          let errorMessage = 'Invalid agency API key or location ID.'
          try {
            const errorData = JSON.parse(responseText)
            if (errorData.message) {
              errorMessage = errorData.message
            } else if (errorData.error) {
              errorMessage = errorData.error
            }
          } catch (e) {
            // Use default message
          }
          
          return NextResponse.json(
            { 
              message: `${errorMessage} Please verify your credentials in GoHighLevel.`,
              details: responseText,
              status: tokenResponse.status
            },
            { status: 401 }
          )
        }

        const tokenData = JSON.parse(responseText)
        
        if (!tokenData.access_token) {
          console.error('[v0] No access token in response:', tokenData)
          return NextResponse.json(
            { message: 'Failed to get location access token. Response did not contain access_token.' },
            { status: 500 }
          )
        }
        
        accessToken = tokenData.access_token
        console.log('[v0] Successfully obtained location token')
      } catch (fetchError: any) {
        console.error('[v0] Token exchange fetch error:', fetchError)
        return NextResponse.json(
          { message: `Network error during token exchange: ${fetchError.message}` },
          { status: 500 }
        )
      }
    }

    console.log('[v0] Testing access token with locations API')
    
    try {
      // Try to fetch location info if we have a locationId
      const testEndpoint = locationId 
        ? `https://services.leadconnectorhq.com/locations/${locationId}`
        : 'https://services.leadconnectorhq.com/locations/'
      
      const testResponse = await fetch(testEndpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Version': '2021-07-28',
          'Accept': 'application/json'
        }
      })

      const testResponseText = await testResponse.text()
      console.log('[v0] API test response status:', testResponse.status)
      console.log('[v0] API test response:', testResponseText)

      if (!testResponse.ok) {
        console.error('[v0] API test failed')
        
        let errorMessage = 'Invalid API credentials.'
        try {
          const errorData = JSON.parse(testResponseText)
          if (errorData.message) {
            errorMessage = errorData.message
          } else if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (e) {
          // Use default message
        }
        
        return NextResponse.json(
          { 
            message: `${errorMessage} Please check your API key and location ID.`,
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
