import { getFeed } from './actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreatePostForm } from './create-form'

export default async function CommunityPage() {
    const feed = await getFeed()

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-[color:var(--teens-primary)]">Community Feed</h1>
                <CreatePostForm />
            </div>

            <div className="space-y-4">
                {feed.length === 0 ? (
                    <p className="text-center text-muted-foreground py-10">
                        No posts yet. Be the first to share!
                    </p>
                ) : (
                    feed.map((post) => (
                        <Card key={post.id}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">{post.title}</CardTitle>
                                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                                        {post.type}
                                    </span>
                                </div>
                                <CardDescription>by {post.author?.full_name || 'Anonymous'}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {post.description && <p className="mb-4">{post.description}</p>}
                                <a href={post.url} target="_blank" rel="noopener noreferrer" className="text-[color:var(--teens-primary)] underline break-all">
                                    {post.url}
                                </a>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
