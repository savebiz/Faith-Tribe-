import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

export default function KidsPage() {
    return (
        <div className="space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-5xl font-black text-[color:var(--kids-primary)] drop-shadow-sm">
                    Hello, Explorer!
                </h1>
                <p className="text-lg">What do you want to do today?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <Link href="/kids/vault">
                    <Card className="border-4 border-[color:var(--kids-primary)] hover:scale-105 transition-transform cursor-pointer bg-card h-full">
                        <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
                            <span className="text-6xl">📺</span>
                            <h2 className="text-3xl font-bold text-[color:var(--kids-primary)]">The Vault</h2>
                            <p className="text-center text-muted-foreground">Stories & Songs</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/kids/game">
                    <Card className="border-4 border-[color:var(--kids-primary)] hover:scale-105 transition-transform cursor-pointer bg-card h-full">
                        <CardContent className="flex flex-col items-center justify-center p-12 space-y-4">
                            <span className="text-6xl">🕵️</span>
                            <h2 className="text-3xl font-bold text-[color:var(--kids-primary)]">Verse Hunt</h2>
                            <p className="text-center text-muted-foreground">Find the Treasure</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    )
}
