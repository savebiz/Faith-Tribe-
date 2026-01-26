import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Play, Gamepad2, Star } from 'lucide-react'

export default function KidsPage() {
    return (
        <div className="min-h-screen bg-orange-50 p-6 selection:bg-[color:var(--kids-primary)]">

            <div className="max-w-4xl mx-auto space-y-12">
                {/* Header */}
                <div className="text-center space-y-4 pt-8">
                    <div className="inline-block bg-white px-6 py-2 rounded-full shadow-sm border border-orange-100">
                        <span className="text-2xl">👋</span> <span className="font-bold text-zinc-600">Hi Explorer!</span>
                    </div>
                    <h1 className="text-6xl font-black text-zinc-900 tracking-tight leading-tight">
                        Ready for an <span className="text-[color:var(--kids-primary)]">Adventure?</span>
                    </h1>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-auto md:h-[500px]">

                    {/* The Vault Card (Big) */}
                    <Link href="/kids/vault" className="group relative bg-[color:var(--kids-primary)] rounded-[3rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-95">
                        <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl transform translate-x-12 -translate-y-12" />
                        <div className="absolute bottom-0 left-0 p-24 bg-black/5 rounded-full blur-2xl transform -translate-x-8 translate-y-8" />

                        <div className="relative h-full flex flex-col justify-between p-10 text-white">
                            <div className="bg-white/20 w-20 h-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <Play className="w-10 h-10 fill-current" />
                            </div>

                            <div>
                                <h2 className="text-5xl font-black mb-3">The Vault</h2>
                                <p className="text-orange-100 font-medium text-xl">Watch stories & songs.</p>
                            </div>

                            <div className="absolute bottom-8 right-8 bg-white/20 p-4 rounded-full opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                <Star className="w-8 h-8 fill-yellow-300 text-yellow-300 animate-spin-slow" />
                            </div>
                        </div>
                    </Link>

                    {/* Right Column */}
                    <div className="flex flex-col gap-6">

                        {/* Game Card */}
                        <Link href="/kids/game" className="flex-1 group relative bg-[color:var(--kids-secondary)] rounded-[3rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] active:scale-95">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />

                            <div className="relative h-full flex items-center p-10 gap-6">
                                <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-sm shrink-0">
                                    <Gamepad2 className="w-8 h-8 text-white" />
                                </div>
                                <div className="text-white">
                                    <h2 className="text-3xl font-black">Verse Hunt</h2>
                                    <p className="text-teal-100">Find the treasure!</p>
                                </div>
                            </div>
                        </Link>

                        {/* Upload Card (Coming Soon/Placeholder behavior) */}
                        <div className="flex-1 bg-white rounded-[3rem] border-4 border-dashed border-zinc-200 flex flex-col items-center justify-center p-8 text-center hover:bg-zinc-50 transition-colors cursor-pointer">
                            <span className="text-4xl mb-2">🎨</span>
                            <h3 className="text-xl font-bold text-zinc-400">Draw Something?</h3>
                            <span className="text-xs font-bold bg-zinc-100 px-2 py-1 rounded text-zinc-400 mt-2">COMING SOON</span>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}
