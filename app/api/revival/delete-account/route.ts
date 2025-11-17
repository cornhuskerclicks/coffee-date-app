import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('id')

    if (!accountId) {
      return NextResponse.json({ message: 'Account ID required' }, { status: 400 })
    }

    // Delete the account (cascade will handle related campaigns and conversations)
    const { error } = await supabase
      .from('ghl_connections')
      .delete()
      .eq('id', accountId)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[v0] Delete account error:', error)
    return NextResponse.json(
      { message: error.message || 'Failed to delete account' },
      { status: 500 }
    )
  }
}
