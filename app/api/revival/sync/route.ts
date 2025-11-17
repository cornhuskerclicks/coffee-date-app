import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { connectionId } = await request.json()

    console.log('[v0] Starting sync for connection:', connectionId)

    // Get GHL connection
    const { data: connection, error: connError } = await supabase
      .from('ghl_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('user_id', user.id)
      .single()

    if (connError || !connection) {
      return NextResponse.json({ message: 'Connection not found' }, { status: 404 })
    }

    const privateIntegrationToken = connection.api_key
    const locationId = connection.location_id

    if (!locationId) {
      return NextResponse.json({ message: 'Location ID is required' }, { status: 400 })
    }

    console.log('[v0] Fetching conversations from GHL using search endpoint')
    const ghlResponse = await fetch(`https://services.leadconnectorhq.com/conversations/search?locationId=${locationId}&limit=100`, {
      headers: {
        'Authorization': `Bearer ${privateIntegrationToken}`,
        'Version': '2021-07-28',
        'Accept': 'application/json'
      }
    })

    if (!ghlResponse.ok) {
      const errorText = await ghlResponse.text()
      console.error('[v0] GHL API error status:', ghlResponse.status)
      console.error('[v0] GHL API error body:', errorText)
      
      let errorMessage = 'Failed to fetch from GoHighLevel'
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.message || errorJson.error || errorMessage
      } catch (e) {
        errorMessage = errorText || errorMessage
      }
      
      throw new Error(errorMessage)
    }

    const ghlData = await ghlResponse.json()
    const conversations = ghlData.conversations || []

    console.log('[v0] Fetched conversations:', conversations.length)

    // Group conversations by campaign/source
    const campaignMap = new Map()
    
    for (const conv of conversations) {
      // Try to extract campaign name from various possible fields
      const campaignName = conv.campaignName || conv.campaign || conv.source || conv.type || 'Uncategorized'
      if (!campaignMap.has(campaignName)) {
        campaignMap.set(campaignName, [])
      }
      campaignMap.get(campaignName).push(conv)
    }

    let campaignsCount = 0
    let conversationsCount = 0

    // Save campaigns and conversations
    for (const [campaignName, convs] of campaignMap.entries()) {
      const totalMessages = convs.reduce((sum: number, c: any) => sum + (c.messageCount || 0), 0)
      const conversationsWithReplies = convs.filter((c: any) => c.unreadCount !== c.messageCount).length
      const responseRate = convs.length > 0 ? Math.round((conversationsWithReplies / convs.length) * 100) : 0

      // Create or update campaign
      const { data: campaign } = await supabase
        .from('revival_campaigns')
        .upsert({
          user_id: user.id,
          ghl_connection_id: connection.id,
          ghl_campaign_id: campaignName,
          name: campaignName,
          status: 'active',
          metrics: {
            total_conversations: convs.length,
            total_messages: totalMessages,
            response_rate: responseRate
          },
          synced_at: new Date().toISOString()
        }, {
          onConflict: 'ghl_campaign_id'
        })
        .select()
        .single()

      if (campaign) {
        campaignsCount++

        // Save conversations
        for (const conv of convs) {
          await supabase.from('revival_conversations').upsert({
            user_id: user.id,
            ghl_connection_id: connection.id,
            campaign_id: campaign.id,
            ghl_conversation_id: conv.id,
            contact_name: conv.contactName || conv.contact?.name || 'Unknown',
            contact_email: conv.contact?.email,
            contact_phone: conv.contact?.phone,
            last_message_at: conv.lastMessageDate || conv.dateUpdated,
            messages: [], // Messages would need to be fetched separately via messages endpoint
            status: conv.status || 'active',
            synced_at: new Date().toISOString()
          }, {
            onConflict: 'ghl_conversation_id'
          })
          conversationsCount++
        }
      }
    }

    console.log('[v0] Sync complete - Campaigns:', campaignsCount, 'Conversations:', conversationsCount)

    // Update last synced time
    await supabase
      .from('ghl_connections')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', connection.id)

    return NextResponse.json({ 
      success: true,
      campaignsCount,
      conversationsCount
    })
  } catch (error: any) {
    console.error('[v0] Revival sync error:', error)
    return NextResponse.json(
      { message: error.message || 'Sync failed' },
      { status: 500 }
    )
  }
}
