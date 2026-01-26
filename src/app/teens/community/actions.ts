'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const contentSchema = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    url: z.string().url(),
    type: z.enum(['video', 'lesson', 'art', 'devotional']),
})

export async function createContent(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Must be logged in' }

    const rawData = {
        title: formData.get('title'),
        description: formData.get('description'),
        url: formData.get('url'),
        type: formData.get('type'),
    }

    const parsed = contentSchema.safeParse(rawData)
    if (!parsed.success) return { error: 'Invalid input' }

    const { error } = await supabase.from('content').insert({
        ...parsed.data,
        author_id: user.id,
        is_approved: false, // Explicitly false
    })

    if (error) return { error: error.message }

    revalidatePath('/teens/community')
    return { success: true }
}

export async function getFeed() {
    const supabase = await createClient()

    const { data: content } = await supabase
        .from('content')
        .select('*, author:profiles(full_name, avatar_url)')
        .eq('is_approved', true) // Only approved
        .order('created_at', { ascending: false })

    return content || []
}
