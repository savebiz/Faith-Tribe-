'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getModerationQueue() {
    const supabase = await createClient()

    // Verify role check should ideally happen here or RLS will handle empty return
    const { data: content } = await supabase
        .from('content')
        .select('*, author:profiles(full_name)')
        .eq('is_approved', false)
        .order('created_at', { ascending: true })

    return content || []
}

export async function approveContent(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return // Unauthorized

    const { error } = await supabase
        .from('content')
        .update({
            is_approved: true,
            approved_by: user.id
        })
        .eq('id', id)

    if (error) {
        console.error('Approve error:', error)
        return
    }

    revalidatePath('/teachers/moderation')
    revalidatePath('/teens/community')
}

export async function rejectContent(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Reject error:', error)
        return
    }

    revalidatePath('/teachers/moderation')
}
