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
        <form action={handleCheckIn}>
            <Button
                size="lg"
                className="w-full font-bold bg-[color:var(--teens-primary)] text-background hover:bg-[color:var(--teens-primary)]/90"
                disabled={isCheckedIn || isPending}
            >
                {isCheckedIn ? 'Checked In Today ✅' : isPending ? 'Checking In...' : 'Check In now ⚡'}
            </Button>
        </form>
    )
}
