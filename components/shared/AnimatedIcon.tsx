'use client'

import { motion } from 'motion/react'

interface AnimatedIconProps {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  delay?: number
  className?: string
  glowColor?: string
}

const sizes = {
  sm: 'w-8 h-8 rounded-lg',
  md: 'w-11 h-11 rounded-xl',
  lg: 'w-14 h-14 rounded-2xl',
}

export function AnimatedIcon({
  children,
  size = 'sm',
  delay = 0,
  className = '',
  glowColor = 'rgba(193,127,58,0.35)',
}: AnimatedIconProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, rotate: -8 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{
        scale: 1.15,
        rotate: 3,
        boxShadow: `0 0 20px ${glowColor}`,
        transition: { duration: 0.25, ease: 'easeOut' },
      }}
      whileTap={{ scale: 0.92 }}
      className={[
        sizes[size],
        'bg-[rgba(193,127,58,0.08)] flex items-center justify-center text-[#C17F3A] shrink-0 cursor-default',
        'transition-shadow duration-300',
        className,
      ].join(' ')}
    >
      {children}
    </motion.div>
  )
}
