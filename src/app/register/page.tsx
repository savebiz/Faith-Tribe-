'use client'

import { useTransition, useState, useEffect } from 'react'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { signup } from '@/app/auth/actions'
import { createClient } from '@/lib/supabase/client'

import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

const formSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(['kid', 'teen', 'teacher']),
    parishId: z.string().optional(),
})

export default function RegisterPage() {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [parishes, setParishes] = useState<{ id: string; name: string }[]>([])
    const supabase = createClient()

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            role: 'teen',
        }
    })

    useEffect(() => {
        async function fetchParishes() {
            const { data, error } = await supabase.from('parishes').select('id, name')
            if (data) {
                setParishes(data)
            }
        }
        fetchParishes()
    }, [supabase])

    const onSubmit = (data: z.infer<typeof formSchema>) => {
        setError(null)
        startTransition(async () => {
            const formData = new FormData()
            formData.append('email', data.email)
            formData.append('password', data.password)
            formData.append('fullName', data.fullName)
            formData.append('role', data.role)
            if (data.parishId && data.parishId !== 'none') {
                formData.append('parishId', data.parishId)
            }

            const result = await signup(formData)
            if (result?.error) {
                setError(result.error)
            }
        })
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-background py-8">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex items-center justify-center mb-4">
                        {/* Logo placeholder */}
                        <div className="h-10 w-10 bg-primary rounded-full animate-pulse" />
                    </div>
                    <CardTitle className="text-2xl text-center">Join FaithTribe</CardTitle>
                    <CardDescription className="text-center">
                        Create your account to start your journey.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                        {/* Full Name */}
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                placeholder="John Doe"
                                required
                                {...register('fullName')}
                            />
                            {errors.fullName && (
                                <p className="text-sm text-destructive">{errors.fullName.message}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                                {...register('email')}
                            />
                            {errors.email && (
                                <p className="text-sm text-destructive">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                {...register('password')}
                            />
                            {errors.password && (
                                <p className="text-sm text-destructive">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Role Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="role">I am a...</Label>
                            <Controller
                                control={control}
                                name="role"
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select your role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="kid">Kid (Faith Explorer)</SelectItem>
                                            <SelectItem value="teen">Teen (The Tribe)</SelectItem>
                                            <SelectItem value="teacher">Teacher (Shepherd)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.role && (
                                <p className="text-sm text-destructive">{errors.role.message}</p>
                            )}
                        </div>

                        {/* Parish Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="parishId">My Parish</Label>
                            <Controller
                                control={control}
                                name="parishId"
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select your parish" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">I&apos;m new / Guest</SelectItem>
                                            {parishes.map((p) => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        {error && <p className="text-sm text-destructive text-center">{error}</p>}

                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? 'Creating Account...' : 'Sign Up'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="text-center text-sm text-muted-foreground justify-center">
                    Already have an account?{' '}
                    <Link href="/login" className="underline hover:text-primary ml-1">
                        Sign in
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}
