import { motion, AnimatePresence } from 'framer-motion'

export const OVERLAY_ANIMATION = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
}

export const PANEL_ANIMATION = {
  initial: { opacity: 0, y: 32, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 16, scale: 0.98 },
  transition: { type: 'spring', damping: 28, stiffness: 380 },
}

export const DROPDOWN_ANIMATION = {
  initial: { opacity: 0, y: 8, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 8, scale: 0.95 },
  transition: { duration: 0.15 },
}

export function ModalOverlay({ children, onClose, className = 'pt-16' }) {
  return (
    <motion.div
      className={`fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-start z-[9999] px-4 ${className}`}
      onClick={onClose}
      {...OVERLAY_ANIMATION}
    >
      {children}
    </motion.div>
  )
}

export function ModalPanel({ children, onClick, className = '' }) {
  return (
    <motion.div
      className={`bg-white w-full rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/10 ${className}`}
      onClick={onClick || (e => e.stopPropagation())}
      {...PANEL_ANIMATION}
    >
      {children}
    </motion.div>
  )
}

export function UserAvatar({ name, isActive = false, size = 'md' }) {
  const initial = name ? name.charAt(0).toUpperCase() : '?'
  const sizeClasses = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
  const colorClasses = isActive
    ? 'bg-green-100 text-green-700 border-green-200'
    : 'bg-gray-100 text-gray-500 border-gray-200'

  return (
    <div className={`${sizeClasses} rounded-full flex items-center justify-center font-bold border shrink-0 ${colorClasses}`}>
      {initial}
    </div>
  )
}

export function ActiveDot() {
  return <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
}
