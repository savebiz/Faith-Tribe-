'use server'

import { createClient } from '@/lib/supabase/server'

export async function getKidsContentByEmotion(emotion: string) {
    const supabase = await createClient()

    const { data: content } = await supabase
        .from('content')
        .select('*')
        .eq('is_approved', true) // Must be approved
        .eq('emotion_tag', emotion)
        .order('created_at', { ascending: false })
        .limit(10)

    return content || []
}

export async function getAllEmotions() {
    // Ideally fetch distinct tags, but for prototype we define them
    return ['Happy', 'Sad', 'Scared', 'Bored', 'Angry', 'Thankful']
}
