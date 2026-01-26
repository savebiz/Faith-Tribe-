'use client'

import { useState } from 'react'
import { createContent } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

export function CreatePostForm() {
    const [open, setOpen] = useState(false)

    async function handleSubmit(formData: FormData) {
        const result = await createContent(formData)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Content submitted for review!')
            setOpen(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-[color:var(--teens-primary)] text-black font-bold">
                    + Share Creation
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Share with the Tribe</DialogTitle>
                    <DialogDescription>
                        Your content will be reviewed by a mentor before appearing in the feed.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" name="title" required placeholder="My Worship Cover" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Select name="type" required defaultValue="art">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="art">Art / Drawing</SelectItem>
                                <SelectItem value="video">Video</SelectItem>
                                <SelectItem value="devotional">Devotional</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="url">Link (URL)</Label>
                        <Input id="url" name="url" required type="url" placeholder="https://..." />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Input id="description" name="description" placeholder="A short description..." />
                    </div>
                    <DialogFooter>
                        <Button type="submit">Submit for Review</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
