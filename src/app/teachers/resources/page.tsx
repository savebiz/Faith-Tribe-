import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function ResourceHubPage() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-[color:var(--teachers-primary)]">Resource Hub</h1>
                    <p className="text-muted-foreground">Tools for the task.</p>
                </div>
                <Button>+ Upload Resource</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Calendar Tool */}
                <Card>
                    <CardHeader>
                        <span className="text-4xl mb-2">📅</span>
                        <CardTitle>Calendar</CardTitle>
                        <CardDescription>Manage schedules & events</CardDescription>
                    </CardHeader>
                </Card>

                {/* Lesson Plans */}
                <Card>
                    <CardHeader>
                        <span className="text-4xl mb-2">📚</span>
                        <CardTitle>Lesson Bank</CardTitle>
                        <CardDescription>Curriculum for 2026</CardDescription>
                    </CardHeader>
                </Card>

                {/* Parent Comms */}
                <Card>
                    <CardHeader>
                        <span className="text-4xl mb-2">📢</span>
                        <CardTitle>Announcements</CardTitle>
                        <CardDescription>Message parents & teens</CardDescription>
                    </CardHeader>
                </Card>
            </div>

            {/* Latest Resources List */}
            <div className="space-y-4 pt-8">
                <h2 className="text-xl font-bold">Latest Lessons</h2>
                <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-[color:var(--teachers-primary)]/10 rounded flex items-center justify-center text-[color:var(--teachers-primary)] font-bold">
                                    {i}
                                </div>
                                <div>
                                    <p className="font-semibold">Understanding Faith Part {i}</p>
                                    <p className="text-xs text-muted-foreground">PDF • 2.4 MB</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm">Download</Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
