'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
})

const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    fullName: z.string().min(2),
    role: z.enum(['kid', 'teen', 'teacher']),
    parishId: z.string().optional(),
})

export async function login(formData: FormData) {
    const supabase = await createClient()

    // Validate fields
    const data = Object.fromEntries(formData)
    const parsed = loginSchema.safeParse(data)

    if (!parsed.success) {
        return { error: 'Invalid fields' }
    }

    const { email, password } = parsed.data

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    // Check user role to create specific redirect?
    // Ideally we redirect to a dashboard that handles routing, or simple /dashboard
    // For now:
    redirect('/')
    // We'll update this once dash pages exist
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    // Validate fields
    const data = Object.fromEntries(formData)
    const parsed = signupSchema.safeParse(data)

    if (!parsed.success) {
        return { error: 'Invalid fields: ' + JSON.stringify(parsed.error.flatten()) }
    }

    const { email, password, fullName, role, parishId } = parsed.data

    const { error, data: authData } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                role: role,
                parish_id: parishId || null,
            },
        },
    })

    if (error) {
        return { error: error.message }
    }

    if (authData.user) {
        // Create profile entry if Trigger doesn't handle it
        // Our Schema usually expects a Trigger for new users -> profiles
        // But we can manually insert if trigger not set.
        // For now, assuming trigger or direct insert:

        const { error: profileError } = await supabase.from('profiles').insert({
            id: authData.user.id,
            role: role,
            full_name: fullName,
            parish_id: parishId || null,
            badges: []
        })

        if (profileError) {
            // Profile creation failed, maybe user exists or RLS?
            // Log warning but proceed if auth worked
            console.error('Profile creation error:', profileError)
        }
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}
