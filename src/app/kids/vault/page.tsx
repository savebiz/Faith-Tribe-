import { getKidsContentByEmotion } from '../actions'
import { ContentRow } from '@/components/kids/ContentRow'

export default async function VaultPage() {
    // Pre-fetch categories
    const happyContent = await getKidsContentByEmotion('Happy')
    const scaredContent = await getKidsContentByEmotion('Scared')
    const boredContent = await getKidsContentByEmotion('Bored')
    const thankfulContent = await getKidsContentByEmotion('Thankful')

    return (
        <div className="space-y-4 pb-20">
            <div className="bg-[color:var(--kids-primary)] p-8 text-white rounded-3xl mx-4 mb-8 shadow-lg">
                <h1 className="text-4xl font-black mb-2">The Vault 🏰</h1>
                <p className="font-bold opacity-90">Stories, Songs, and Truth for every feeling.</p>
            </div>

            <ContentRow title="When I feel Happy 😄" items={happyContent} />
            <ContentRow title="When I feel Scared 😨" items={scaredContent} />
            <ContentRow title="When I feel Bored 😑" items={boredContent} />
            <ContentRow title="When I feel Thankful 🙏" items={thankfulContent} />

            {/* Empty State Help */}
            {happyContent.length === 0 && scaredContent.length === 0 && (
                <div className="text-center p-12 opacity-50">
                    <p>The Vault is empty right now!</p>
                    <p className="text-sm">Teachers can add stories here.</p>
                </div>
            )}
        </div>
    )
}
