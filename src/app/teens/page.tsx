import { getStreak } from './actions'
import { CheckInButton } from '@/components/teens/CheckInButton'
import { TreeOfFaith } from '@/components/teens/TreeOfFaith'
import { Card, CardContent } from '@/components/ui/card'
import { Flame, Share2, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default async function TeensPage() {
    const streakData = await getStreak()
    const streakCount = streakData?.current_streak || 0
    const lastLogin = streakData?.last_login
    const today = new Date().toISOString().split('T')[0]
    const lastLoginDate = lastLogin ? new Date(lastLogin).toISOString().split('T')[0] : null
    const isCheckedIn = lastLoginDate === today

    return (
        <div className="min-h-screen bg-[color:var(--deep-bg)] text-white p-6 pb-24">
            {/* Header */}
            <header className="flex justify-between items-center mb-12">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[color:var(--teens-primary)] to-[color:var(--teens-accent)]">
                        The Tribe
                    </h1>
                    <p className="text-zinc-500 text-sm font-bold tracking-widest">DIGITAL TABERNACLE</p>
                </div>
                <div className="flex items-center gap-2 bg-zinc-900/50 rounded-full px-4 py-2 border border-white/10">
                    <Flame className="w-5 h-5 text-[color:var(--teens-primary)] animate-pulse" />
                    <span className="font-mono font-bold text-lg">{streakCount}</span>
                </div>
            </header>

            {/* Main Content Grid */}
            <div className="max-w-md mx-auto space-y-8">

                {/* Tree Section */}
                <section className="relative aspect-square bg-zinc-900/40 rounded-[2.5rem] border border-white/5 flex items-center justify-center overflow-hidden shadow-2xl shadow-black/50">
                    <div className="absolute inset-0 bg-gradient-to-tr from-[color:var(--teens-primary)]/10 to-transparent pointer-events-none" />
                    <TreeOfFaith streak={streakCount} />

                    {/* Status Pill */}
                    <div className="absolute top-6 right-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-white/10 backdrop-blur-md ${isCheckedIn ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400 animate-pulse'}`}>
                            {isCheckedIn ? 'Active' : 'Pending'}
                        </span>
                    </div>
                </section>

                {/* Actions Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <div className="p-1 rounded-3xl bg-gradient-to-r from-[color:var(--teens-primary)] to-[color:var(--teens-accent)]">
                            <div className="bg-[color:var(--deep-bg)] rounded-[1.3rem] p-1 h-full">
                                <CheckInButton isCheckedIn={isCheckedIn} />
                            </div>
                        </div>
                    </div>

                    <Link href="/teens/community" className="group">
                        <Card className="h-40 bg-zinc-900/50 border-white/5 hover:bg-zinc-800/80 transition-all active:scale-95 rounded-3xl">
                            <CardContent className="h-full flex flex-col items-center justify-center gap-3 p-0">
                                <div className="p-3 rounded-full bg-white/5 group-hover:bg-[color:var(--teens-primary)]/20 transition-colors">
                                    <Share2 className="w-6 h-6 text-zinc-400 group-hover:text-[color:var(--teens-primary)]" />
                                </div>
                                <span className="font-bold text-zinc-300">Share Art</span>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/teens/community" className="group">
                        <Card className="h-40 bg-zinc-900/50 border-white/5 hover:bg-zinc-800/80 transition-all active:scale-95 rounded-3xl">
                            <CardContent className="h-full flex flex-col items-center justify-center gap-3 p-0">
                                <div className="p-3 rounded-full bg-white/5 group-hover:bg-[color:var(--teens-accent)]/20 transition-colors">
                                    <MessageSquare className="w-6 h-6 text-zinc-400 group-hover:text-[color:var(--teens-accent)]" />
                                </div>
                                <span className="font-bold text-zinc-300">Forum</span>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* Daily Verse/Quote */}
                <div className="bg-gradient-to-br from-zinc-900 to-black p-6 rounded-3xl border border-white/5">
                    <p className="font-serif italic text-lg text-zinc-400 text-center leading-relaxed">
                        "Do not let anyone look down on you because you are young, but set an example for the believers..."
                    </p>
                    <p className="text-center text-xs font-bold text-[color:var(--teens-primary)] mt-4 uppercase tracking-widest">
                        1 Timothy 4:12
                    </p>
                </div>
            </div>
        </div>
    )
}
