import { getKidsContentByEmotion } from '../actions'
import { ContentRow } from '@/components/kids/ContentRow'
import { Search } from 'lucide-react'

export default async function VaultPage() {
    // Pre-fetch categories
    const happyContent = await getKidsContentByEmotion('Happy')
    const scaredContent = await getKidsContentByEmotion('Scared')
    const boredContent = await getKidsContentByEmotion('Bored')
    const thankfulContent = await getKidsContentByEmotion('Thankful')

    return (
        <div className="min-h-screen bg-zinc-950 text-white pb-24 selection:bg-[color:var(--kids-primary)]">
            {/* Navbar Placeholder */}
            <div className="flex items-center justify-between p-6 md:px-12 sticky top-0 bg-zinc-950/80 backdrop-blur-md z-50 border-b border-white/5">
                <h1 className="text-2xl font-black tracking-tighter text-[color:var(--kids-primary)]">THE VAULT</h1>
                <div className="p-2 bg-white/10 rounded-full">
                    <Search className="w-5 h-5 text-zinc-400" />
                </div>
            </div>

            {/* Featured Hero (If content exists) */}
            <div className="relative h-[60vh] w-full mb-12 flex items-end p-6 md:p-12 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent z-10" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519751138087-5bf79df62d58?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center z-0 opacity-50" />

                <div className="relative z-20 max-w-2xl space-y-4 animate-in slide-in-from-bottom-10 fade-in duration-1000">
                    <span className="bg-[color:var(--kids-primary)] text-black font-bold px-4 py-1 rounded text-xs tracking-widest uppercase">
                        Featured Series
                    </span>
                    <h2 className="text-5xl md:text-7xl font-black tracking-tighter drop-shadow-2xl">
                        David & Goliath
                    </h2>
                    <p className="text-lg md:text-xl text-zinc-300 line-clamp-2 max-w-lg">
                        A tiny shepherd boy, a giant warrior, and a faith that could move mountains. Watch the epic story unfold.
                    </p>
                    <button className="bg-white text-black font-bold px-8 py-3 rounded-full text-lg hover:bg-[color:var(--kids-primary)] hover:text-white transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                        Watch Now
                    </button>
                </div>
            </div>

            <div className="space-y-12 px-6 md:px-12">
                <ContentRow title="When I feel Happy 😄" items={happyContent} />
                <ContentRow title="When I feel Scared 😨" items={scaredContent} />
                <ContentRow title="When I feel Bored 😑" items={boredContent} />
                <ContentRow title="When I feel Thankful 🙏" items={thankfulContent} />

                {/* Empty State Help */}
                {happyContent.length === 0 && scaredContent.length === 0 && (
                    <div className="text-center p-24 border border-white/5 rounded-[3rem] bg-zinc-900/50">
                        <span className="text-6xl block mb-4">🕸️</span>
                        <h3 className="text-2xl font-bold mb-2">The Vault is Quiet</h3>
                        <p className="text-zinc-500">Teachers are filming new stories right now!</p>
                    </div>
                )}
            </div>
        </div>
    )
}
