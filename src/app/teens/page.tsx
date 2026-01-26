import { getStreak } from './actions'
import { CheckInButton } from '@/components/teens/CheckInButton'
import { TreeOfFaith } from '@/components/teens/TreeOfFaith'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function TeensPage() {
    const streakData = await getStreak()
    const streakCount = streakData?.current_streak || 0
    const lastLogin = streakData?.last_login

    const today = new Date().toISOString().split('T')[0]
    const lastLoginDate = lastLogin ? new Date(lastLogin).toISOString().split('T')[0] : null
    const isCheckedIn = lastLoginDate === today

    return (
        <div className="flex flex-col items-center gap-8 max-w-md mx-auto py-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-black text-[color:var(--teens-primary)] uppercase tracking-tight">
                    Digital Tabernacle
                </h1>
                <p className="text-muted-foreground">Keep the fire burning 🔥</p>
            </div>

            <TreeOfFaith streak={streakCount} />

            <Card className="w-full text-center border-[color:var(--teens-primary)]/50">
                <CardHeader>
                    <CardTitle className="text-xl">Current Streak</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-5xl font-mono font-bold text-[color:var(--teens-primary)]">
                        {streakCount}
                    </div>

                    <CheckInButton isCheckedIn={isCheckedIn} />

                    {!isCheckedIn && (
                        <p className="text-xs text-muted-foreground">
                            Check in daily to grow your Tree of Faith!
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Quick Acts / Daily Verse could go here */}
        </div>
    )
}
