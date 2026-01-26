import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, Shield, Heart } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-[color:var(--deep-bg)] text-white overflow-hidden selection:bg-purple-500/30">

      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center p-6 text-center">
        {/* Background Gradient Mesh */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 space-y-8 max-w-4xl mx-auto animate-in fade-in zoom-in duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium tracking-wide">The Digital Tabernacle is Live</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50 drop-shadow-2xl">
            FAITHTRIBE
          </h1>

          <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            A next-generation platform bridging the gap between Sunday services.
            <span className="text-white font-bold block mt-2">Connect. Grow. Belong.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link href="/login">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-white text-black hover:bg-zinc-200 transition-all hover:scale-105 font-bold">
                Enter the Tribe <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-white/20 bg-transparent text-white hover:bg-white/10 backdrop-blur-sm transition-all">
                Join as Guest
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Portals Section */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Kids Card */}
            <Link href="/kids" className="group relative h-[500px] rounded-[2.5rem] overflow-hidden border border-white/10 transition-transform duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--kids-primary)]/80 to-[color:var(--kids-primary)]/20 mix-blend-overlay opacity-60 group-hover:opacity-80 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              <div className="absolute bottom-0 p-10 w-full">
                <div className="bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-md mb-6 border border-white/20">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-4xl font-black mb-2">Kids</h2>
                <p className="text-zinc-300 mb-6 line-clamp-2">Interactive Bible stories, verse hunting games, and emotion-based learning.</p>
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-4 group-hover:translate-y-0 duration-300">
                  Enter Vault <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* Teens Card */}
            <Link href="/teens" className="group relative h-[500px] rounded-[2.5rem] overflow-hidden border border-white/10 transition-transform duration-500 hover:-translate-y-2 translate-y-0 md:-translate-y-12">
              <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--teens-primary)]/80 to-[color:var(--teens-primary)]/20 mix-blend-overlay opacity-60 group-hover:opacity-80 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              <div className="absolute bottom-0 p-10 w-full">
                <div className="bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-md mb-6 border border-white/20">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-4xl font-black mb-2">Teens</h2>
                <p className="text-zinc-300 mb-6 line-clamp-2">Gamified spiritual growth (Streaks), peer community, and creative expression.</p>
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-4 group-hover:translate-y-0 duration-300">
                  Join Tribe <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* Teachers Card */}
            <Link href="/teachers" className="group relative h-[500px] rounded-[2.5rem] overflow-hidden border border-white/10 transition-transform duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-b from-[color:var(--teachers-primary)]/80 to-[color:var(--teachers-primary)]/20 mix-blend-overlay opacity-60 group-hover:opacity-80 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

              <div className="absolute bottom-0 p-10 w-full">
                <div className="bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-md mb-6 border border-white/20">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-4xl font-black mb-2">Teachers</h2>
                <p className="text-zinc-300 mb-6 line-clamp-2">Moderation tools, lesson marketplace, and mentor guild collaboration.</p>
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-4 group-hover:translate-y-0 duration-300">
                  Access Hub <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center text-zinc-600 border-t border-white/5">
        <p>© 2026 FaithTribe Platform. Built for the Kingdom.</p>
      </footer>
    </div>
  )
}
