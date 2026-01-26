import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function KidsLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            {/* Kids Navigation */}
            <nav className="h-16 border-b-4 border-[color:var(--kids-primary)] bg-card flex items-center justify-between px-6">
                <Link href="/kids" className="text-2xl font-black text-[color:var(--kids-primary)] flex items-center gap-2">
                    🦖 Faith Explorers
                </Link>
                <div className="flex gap-4">
                    <Button variant="ghost" className="text-[color:var(--kids-primary)] font-bold hover:bg-[color:var(--kids-primary)]/10" asChild>
                        <Link href="/">Exit</Link>
                    </Button>
                </div>
            </nav>
            {/* Main Content */}
            <main className="p-4 md:p-6 bg-[color:var(--kids-primary)]/5 min-h-[calc(100vh-4rem)]">
                {children}
            </main>
        </div>
    )
}
