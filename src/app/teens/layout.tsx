import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function TeensLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Teens Navigation */}
            <nav className="sticky top-0 z-50 w-full border-b border-[color:var(--teens-primary)]/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center justify-between px-4">
                    <Link href="/teens" className="text-xl font-bold tracking-tighter text-[color:var(--teens-primary)] uppercase">
                        ⚡ The Tribe
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/teens/tree" className="text-sm font-medium hover:text-[color:var(--teens-primary)] transition-colors">
                            My Tree
                        </Link>
                        <Link href="/teens/community" className="text-sm font-medium hover:text-[color:var(--teens-primary)] transition-colors">
                            Community
                        </Link>
                        <Button size="sm" variant="outline" className="border-[color:var(--teens-primary)] text-[color:var(--teens-primary)] hover:bg-[color:var(--teens-primary)]/10" asChild>
                            <Link href="/">Home</Link>
                        </Button>
                    </div>
                </div>
            </nav>
            {/* Main Content */}
            <main className="container py-6 px-4">
                {children}
            </main>
        </div>
    )
}
