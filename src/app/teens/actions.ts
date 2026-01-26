'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getStreak() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data: streak } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .single()

    return streak
}

export async function checkIn(_formData?: FormData) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    // Get current streak
    const { data: currentStreak } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .single()

    const today = new Date().toISOString().split('T')[0]

    if (currentStreak) {
        const lastLogin = currentStreak.last_login
            ? new Date(currentStreak.last_login).toISOString().split('T')[0]
            : null

        if (lastLogin === today) {
            return { message: 'Already checked in today!' }
        }

        // Check if missed a day (simple logic)
        // In real app, check date diff > 1 day -> reset to 1
        // For prototype, we just increment.

        // Logic: If last_login < yesterday, reset. 
        // Implementing simple increment for demo purposes unless strict requested.
        // Let's implement strict:

        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]

        let newCount = currentStreak.current_streak + 1
        if (lastLogin && lastLogin < yesterdayStr) {
            newCount = 1 // Reset
        }

        await supabase
            .from('streaks')
            .update({
                current_streak: newCount,
                last_login: new Date().toISOString(),
            })
            .eq('user_id', user.id)
    } else {
        // First time
        await supabase.from('streaks').insert({
            user_id: user.id,
            current_streak: 1,
            last_login: new Date().toISOString(),
        })
    }

    revalidatePath('/teens')
    return { success: true }
}
