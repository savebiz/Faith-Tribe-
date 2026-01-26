import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TeachersPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-[color:var(--teachers-primary)]">Class Growth</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">+12%</p>
                        <p className="text-xs text-muted-foreground">Student engagement this week</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-[color:var(--teachers-primary)]">Pending Review</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">5</p>
                        <p className="text-xs text-muted-foreground">Items in moderation queue</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
