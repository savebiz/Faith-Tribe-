import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

interface Content {
    id: string
    title: string
    url: string
    type: string
}

export function ContentRow({ title, items }: { title: string; items: Content[] }) {
    if (items.length === 0) return null

    return (
        <div className="space-y-4 py-6">
            <h2 className="text-2xl font-black text-[color:var(--kids-primary)] px-4">
                {title}
            </h2>

            <div className="flex gap-4 overflow-x-auto px-4 pb-4 snap-x hide-scroll">
                {items.map((item) => (
                    <Link key={item.id} href={item.url} target="_blank" className="snap-start">
                        <Card className="w-64 h-40 flex-shrink-0 hover:scale-105 transition-transform border-[color:var(--kids-primary)] border-2">
                            <CardContent className="h-full flex flex-col justify-end p-4 bg-muted/20">
                                <span className="text-xs uppercase font-bold text-muted-foreground">{item.type}</span>
                                <h3 className="font-bold leading-tight">{item.title}</h3>
                            </CardContent>
                        </Card>
                    </Link>
                ))}

                {/* Filler card to show end */}
                <div className="w-4 h-40 flex-shrink-0" />
            </div>
        </div>
    )
}
