'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'

const verses = [
    { text: "I can do all things through Christ who strengthens me.", ref: "Philippians 4:13" },
    { text: "The Lord is my Shepherd, I shall not want.", ref: "Psalm 23:1" },
    { text: "Be strong and courageous.", ref: "Joshua 1:9" }
]

export function VerseHunt() {
    const [isFound, setIsFound] = useState(false)
    // Random verse for demo
    const verse = verses[0]

    return (
        <div className="flex flex-col items-center justify-center p-8 min-h-[50vh]">
            <h1 className="text-3xl font-black text-[color:var(--kids-primary)] mb-8">Verse Hunt 🕵️</h1>

            <AnimatePresence mode='wait'>
                {!isFound ? (
                    <motion.div
                        key="chest"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1, rotate: [0, -5, 5, 0] }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        transition={{ repeat: Infinity, repeatDelay: 2 }}
                        onClick={() => setIsFound(true)}
                        className="cursor-pointer"
                    >
                        <div className="text-9xl filter drop-shadow-xl">🎁</div>
                        <p className="text-center font-bold mt-4 animate-bounce">Tap to Open!</p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="verse"
                        initial={{ scale: 0, y: 50 }}
                        animate={{ scale: 1, y: 0 }}
                        className="bg-card border-4 border-[color:var(--kids-primary)] p-8 rounded-3xl text-center shadow-xl max-w-sm"
                    >
                        <div className="text-6xl mb-4">✨</div>
                        <p className="text-2xl font-bold mb-4">&quot;{verse.text}&quot;</p>
                        <p className="text-xl font-black text-[color:var(--kids-primary)]">{verse.ref}</p>
                        <Button
                            className="mt-6 w-full bg-[color:var(--kids-primary)] font-bold text-lg hover:scale-105 transition-transform"
                            onClick={() => setIsFound(false)}
                        >
                            Play Again
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
