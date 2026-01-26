import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function TeachersLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-muted/40 font-sans">
            {/* Teachers Sidebar / Nav (Simplified for now) */}
            <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
                <Link href="/teachers" className="text-lg font-semibold text-[color:var(--teachers-primary)]">
                    🛡️ Shepherd&apos;s Staff
                </Link>
                <div className="ml-auto flex items-center gap-4">
                    <Link href="/teachers/moderation" className="text-sm font-medium transition-colors hover:text-primary">
                        Moderation
                    </Link>
                    <Link href="/teachers/guild" className="text-sm font-medium transition-colors hover:text-primary">
                        Guild
                    </Link>
                    <Button size="sm" className="bg-[color:var(--teachers-primary)] hover:bg-[color:var(--teachers-primary)]/90" asChild>
                        <Link href="/">Exit</Link>
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-4 lg:p-6 lg:gap-6">
                {children}
            </main>
        </div>
    )
}
