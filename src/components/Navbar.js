'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogoutIcon, ChevronDownIcon, PlusIcon, UserIcon } from './icons'
import { handleSignOut } from '@/actions/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { DROPDOWN_ANIMATION, UserAvatar } from './ui'
import CreateBoardModal from './kanban/CreateBoardModal'
import ProfileModal from './kanban/ProfileModal'

export default function Navbar({ session, currentUser, boards, activeBoard }) {
  const router = useRouter()
  const user = currentUser || session?.user
  const userName = user?.name || user?.username || 'Người dùng'
  const userImage = user?.image || null
  
  const [isProjectsOpen, setIsProjectsOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  return (
    <nav className="h-12 w-full bg-white border-b border-border-subtle flex items-center justify-between px-3 shrink-0 z-[100]">
      {/* Left: Logo & Main Nav */}
      <div className="flex items-center gap-2 h-full">
        {/* Aha Logo */}
        <div 
          onClick={() => router.push('/')}
          className="flex items-center gap-2 px-2 hover:bg-gray-100 h-8 rounded transition-colors cursor-pointer mr-2 group"
        >
          <div className="relative">
            <svg width="24" height="24" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm group-hover:scale-110 transition-transform">
              <rect width="32" height="32" rx="8" fill="#0052CC"/>
              <rect x="6" y="7" width="5" height="18" rx="1.5" fill="white" opacity="0.95"/>
              <rect x="13.5" y="7" width="5" height="12" rx="1.5" fill="white" opacity="0.95"/>
              <rect x="21" y="7" width="5" height="15" rx="1.5" fill="white" opacity="0.95"/>
            </svg>
          </div>
          <span className="font-bold text-[#172B4D] text-lg tracking-tight">Aha <span className="text-primary font-medium">Kanban</span></span>
        </div>

        {/* Desktop Nav Items */}
        <div className="hidden lg:flex items-center h-full">
          <div className="relative h-full flex items-center">
            <button 
              onClick={() => setIsProjectsOpen(!isProjectsOpen)}
              className={`flex items-center gap-1 px-3 h-8 rounded transition-colors cursor-pointer text-text-main text-sm font-medium ${isProjectsOpen ? 'bg-blue-50 text-primary' : 'hover:bg-gray-100'}`}
            >
              Dự án
              <ChevronDownIcon size={12} className={`mt-0.5 transition-transform duration-200 ${isProjectsOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {isProjectsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProjectsOpen(false)} />
                  <motion.div
                    {...DROPDOWN_ANIMATION}
                    className="absolute top-full left-0 mt-1 w-64 bg-white border border-border-subtle rounded shadow-xl z-50 overflow-hidden py-2"
                  >
                    <div className="px-4 py-2 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                      Dự án gần đây
                    </div>
                    <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                      {boards?.map((board) => (
                        <div
                          key={board.id}
                          onClick={() => {
                            router.push(`/?boardId=${board.id}`)
                            setIsProjectsOpen(false)
                          }}
                          className={`flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer transition-colors ${activeBoard?.id === board.id ? 'bg-blue-50 border-l-4 border-primary pl-3' : ''}`}
                        >
                          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {board.title.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-text-main truncate">{board.title}</span>
                            <span className="text-[11px] text-text-muted">Dự án phần mềm</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-border-subtle mt-2 pt-2 px-2">
                       <button 
                         onClick={() => {
                           setIsCreateModalOpen(true)
                           setIsProjectsOpen(false)
                         }}
                         className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-blue-50 rounded transition-colors font-bold flex items-center gap-2"
                       >
                         <PlusIcon size={14} />
                         Tạo dự án mới
                       </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Right: Search & Profile */}
      <div className="flex items-center gap-2">
        {/* Search Bar */}
        <div className="relative hidden md:block">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Tìm kiếm..." 
            className="bg-white border border-border-subtle h-8 w-48 rounded pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* Action Icons */}
        <div className="flex items-center">
          <div className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors text-gray-500" title="Thông báo">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          </div>
          
          <button 
            onClick={() => setIsProfileModalOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 ml-1"
            title="Hồ sơ cá nhân"
          >
            <UserIcon size={20} />
          </button>

          <button 
            onClick={() => handleSignOut()}
            className="p-2 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors text-gray-500 ml-1"
            title="Đăng xuất"
          >
            <LogoutIcon size={18} />
          </button>
        </div>

        {/* Profile Avatar */}
        <div 
          onClick={() => setIsProfileModalOpen(true)}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <UserAvatar name={userName} image={userImage} size="sm" isActive={true} />
        </div>
      </div>

      <CreateBoardModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />

      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        user={user}
      />
    </nav>
  )
}

