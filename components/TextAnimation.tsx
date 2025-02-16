'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

type AIState = 'idle' | 'listening' | 'speaking'

interface Props {
  onStartListening?: () => void
  onStopListening?: () => void
  isAudioPlaying?: boolean
  currentText?: string
}

export default function AiTalkingAnimation({ onStartListening, onStopListening, isAudioPlaying }: Props) {
  const [aiState, setAiState] = useState<AIState>('idle')

  const handleCircleClick = () => {
    if (aiState === 'listening' || aiState === 'speaking') {
      onStopListening?.()
      setAiState('idle')
    } else if (!isAudioPlaying) {
      onStartListening?.()
      setAiState('listening')
    }
  }

  useEffect(() => {
    if (isAudioPlaying) setAiState('speaking')
    else if (aiState === 'speaking') setAiState('listening')
  }, [isAudioPlaying])

  return (
    <div className="animation-circle-container">
      <div 
        className="relative cursor-pointer animation-circle" 
        onClick={handleCircleClick} 
        role="button" 
        aria-label={aiState === 'listening' ? 'Stop listening' : 'Start listening'}
      >
        <motion.div
          className="w-full h-full bg-gradient-to-br from-[var(--primary-color)] to-[var(--secondary-color)] rounded-full flex items-center justify-center"
          animate={aiState === 'idle' ? { scale: [1, 1.1, 1] } : aiState === 'speaking' ? { scale: [1, 1.2, 0.8, 1.2, 1] } : {}}
          transition={{
            repeat: Infinity,
            ease: 'easeInOut',
            duration: aiState === 'speaking' ? 0.8 : 1.5,
          }}
        />
        {aiState === 'listening' && (
          <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" viewBox="0 0 100 100">
            <motion.circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              strokeWidth="4"
              stroke="var(--primary-color)"
              transition={{
                duration: 10,
                ease: 'linear',
                repeat: Infinity,
              }}
              strokeLinecap="round"
              initial={{ pathLength: 0, rotate: -90 }}
              animate={{ pathLength: 1, rotate: 270 }}
            />
          </svg>
        )}
      </div>
    </div>
  )
}
