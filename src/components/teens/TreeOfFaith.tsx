'use client'

import { motion } from 'framer-motion'

export function TreeOfFaith({ streak }: { streak: number }) {
    // Tree growth stages based on streak
    // 1-3: Sprout
    // 4-7: Sapling
    // 8+: Tree

    const getScale = () => {
        if (streak <= 0) return 0.5
        return Math.min(1 + streak * 0.1, 2) // Max scale 2x
    }

    return (
        <div className="relative flex items-center justify-center w-64 h-64 bg-secondary/20 rounded-full overflow-visible">
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: getScale(), rotate: [0, 2, -2, 0] }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="text-6xl origin-bottom"
            >
                {streak < 3 ? '🌱' : streak < 7 ? '🌿' : '🌳'}
            </motion.div>

            {/* HUD */}
            <div className="absolute -bottom-4 bg-background border px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                Level {Math.floor(streak / 7) + 1}
            </div>
        </div>
    )
}
