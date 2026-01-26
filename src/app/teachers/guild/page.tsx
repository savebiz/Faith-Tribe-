import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'

export default function GuildPage() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center bg-[color:var(--teachers-primary)] p-8 rounded-3xl text-white shadow-lg">
                <div>
                    <h1 className="text-3xl font-bold">The Guild ⚔️</h1>
                    <p className="opacity-90">Iron sharpening iron.</p>
                </div>
                <Button variant="secondary" className="font-bold">New Discussion</Button>
            </div>

            <div className="space-y-4">
                {/* Discussion Thread */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between">
                            <div>
                                <CardTitle className="text-lg">How do we engage introverted teens?</CardTitle>
                                <CardDescription>Started by Mrs. Johnson • 2 hours ago</CardDescription>
                            </div>
                            <span className="bg-muted px-2 py-1 rounded text-xs font-bold h-fit">12 Replies</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground line-clamp-2">
                            I've noticed some of the younger teens are hesitant to join the circle discussions. What strategies have worked for you all?
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button variant="ghost" size="sm" className="text-[color:var(--teachers-primary)] px-0">Join Discussion →</Button>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex justify-between">
                            <div>
                                <CardTitle className="text-lg">Resource Request: Easter Drama Script</CardTitle>
                                <CardDescription>Started by Pastor Dave • 1 day ago</CardDescription>
                            </div>
                            <span className="bg-muted px-2 py-1 rounded text-xs font-bold h-fit">4 Replies</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground line-clamp-2">
                            Does anyone have a good 10-minute script for the upcoming Easter service? Looking for something modern.
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button variant="ghost" size="sm" className="text-[color:var(--teachers-primary)] px-0">Join Discussion →</Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
