import { getModerationQueue, approveContent, rejectContent } from '../actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ModerationPage() {
    const queue = await getModerationQueue()

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-[color:var(--teachers-primary)]">Moderation Queue</h1>
            <p className="text-muted-foreground">Review and approve content submission from the tribe.</p>

            <div className="grid gap-4">
                {queue.length === 0 ? (
                    <p className="text-center py-12 bg-muted rounded-xl">All caught up! No pending submissions.</p>
                ) : (
                    queue.map((item) => (
                        <Card key={item.id} className="border-l-4 border-l-[color:var(--teachers-primary)]">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>{item.title}</CardTitle>
                                        <CardDescription>
                                            Type: <span className="uppercase font-bold">{item.type}</span> • Author: {item.author?.full_name}
                                        </CardDescription>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="mb-2">{item.description}</p>
                                <div className="bg-muted p-2 rounded text-sm break-all">
                                    {item.url}
                                </div>
                            </CardContent>
                            <CardFooter className="gap-2 justify-end">
                                <form action={rejectContent.bind(null, item.id)}>
                                    <Button variant="destructive" size="sm">Reject</Button>
                                </form>
                                <form action={approveContent.bind(null, item.id)}>
                                    <Button className="bg-[color:var(--teachers-primary)] text-white hover:bg-[color:var(--teachers-primary)]/90" size="sm">
                                        Approve
                                    </Button>
                                </form>
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
