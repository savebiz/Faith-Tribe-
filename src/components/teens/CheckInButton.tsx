'use client'

import { checkIn } from '@/app/teens/actions'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useTransition } from 'react'

export function CheckInButton({ isCheckedIn }: { isCheckedIn: boolean }) {
    const [isPending, startTransition] = useTransition()

    function handleCheckIn() {
        startTransition(async () => {
            const result = await checkIn()
            if (result?.error) {
                toast.error(result.error)
            } else if (result?.message) {
                toast.info(result.message)
            } else {
                toast.success("Checked in! Tree is growing 🌱")
            }
        })
    }

    return (
        <form action={handleCheckIn} className="w-full h-full">
            <Button
                size="lg"
                className={`w-full h-full min-h-[56px] rounded-2xl font-black text-lg uppercase tracking-wide transition-all
                  ${isCheckedIn
                        ? 'bg-zinc-800 text-zinc-500 hover:bg-zinc-800 cursor-default shadow-none'
                        : 'bg-transparent text-white hover:text-[color:var(--teens-primary)] hover:bg-white/5 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(0,255,100,0.3)]'
                    }`}
                disabled={isCheckedIn || isPending}
            >
                {isCheckedIn ? 'Streak Saved ✅' : isPending ? 'Igniting...' : 'Check In 🔥'}
            </Button>
        </form>
    )
}
