'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { createBoard } from '@/actions/kanban'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDownIcon, PlusIcon } from './icons'
import { ModalOverlay, ModalPanel, ActiveDot, DROPDOWN_ANIMATION } from './ui'

export default function BoardSelector({ boards, activeBoardId }) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  const [newTitle, setNewTitle] = useState('')
  const [newPrefix, setNewPrefix] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const activeBoard = boards.find(b => b.id === activeBoardId) || boards[0]

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    setIsLoading(true)
    const res = await createBoard({ title: newTitle, prefix: newPrefix })
    setIsLoading(false)
    if (res.success) {
      setShowModal(false)
      setNewTitle('')
      setNewPrefix('')
      toast.success('Đã tạo bảng mới thành công!')
      router.push(`/?boardId=${res.board.id}`)
    } else {
      toast.error(res.error || 'Lỗi khi tạo bảng')
    }
  }

  const handleSelect = (id) => {
    router.push(`/?boardId=${id}`)
    setIsOpen(false)
  }

  return (
    <div className="flex items-center gap-4">
      {/* Custom Dropdown */}
      <div className="relative">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="pl-6 pr-12 py-2 w-auto min-w-[240px] cursor-pointer h-11 rounded-full border border-gray-200 bg-white/80 backdrop-blur-sm hover:border-green-400 hover:bg-white text-[15px] font-extrabold text-gray-800 focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all shadow-sm flex items-center text-left justify-between group"
        >
          <span className="truncate">{activeBoard?.title}</span>
          <div className={`absolute right-5 transition-transform duration-300 ${isOpen ? 'rotate-180 text-green-600' : 'text-gray-400 group-hover:text-green-600'}`}>
            <ChevronDownIcon />
          </div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              {/* Click outside overlay */}
              <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
              
              <motion.div 
                {...DROPDOWN_ANIMATION}
                className="absolute top-full left-0 mt-2 w-full min-w-[260px] bg-white/95 backdrop-blur-xl border border-gray-200 rounded-[2rem] shadow-2xl z-[70] overflow-hidden p-2 origin-top"
              >
                <div className="max-h-[300px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-100">
                  {boards.map((b) => (
                    <motion.button
                      key={b.id}
                      whileHover={{ x: 4 }}
                      onClick={() => handleSelect(b.id)}
                      className={`w-full text-left px-5 py-3.5 rounded-2xl text-[14px] font-bold transition-all flex items-center justify-between group gap-3 ${
                        activeBoardId === b.id 
                          ? 'bg-green-50 text-green-700' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <span className="truncate flex-1">{b.title}</span>
                      {activeBoardId === b.id && (
                        <div className="shrink-0"><ActiveDot /></div>
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <button 
        className="h-11 px-6 bg-green-500 hover:bg-green-600 text-white rounded-full text-[15px] font-extrabold transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 group"
        onClick={() => setShowModal(true)}
      >
        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
          <PlusIcon size={14} strokeWidth={4} />
        </div>
        Tạo bảng mới
      </button>

      {mounted && createPortal(
        <AnimatePresence>
          {showModal && (
            <ModalOverlay onClose={() => setShowModal(false)} className="pt-24">
              <ModalPanel className="max-w-[400px]">
                <div className="p-8 pb-0">
                  <h3 className="text-2xl font-extrabold text-gray-900 m-0">Tạo bảng mới</h3>
                </div>
                <div className="p-8">
                  <label className="block mb-2 text-sm font-bold text-gray-700 ml-1">Tên bảng (*)</label>
                  <input 
                    autoFocus
                    className="w-full px-5 py-4 mb-6 rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all placeholder:text-gray-400 font-medium"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
                    placeholder="VD: Dự án Alpha..."
                  />

                  <label className="block mb-2 text-sm font-bold text-gray-700 ml-1">Tiền tố thẻ (Tùy chọn)</label>
                  <input 
                    className="w-full px-5 py-4 mb-8 rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all placeholder:text-gray-400 font-medium"
                    value={newPrefix}
                    onChange={e => setNewPrefix(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
                    placeholder="VD: ALP (Để trống sẽ tự động tạo)"
                  />

                  <div className="flex gap-4">
                    <button 
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-4 rounded-2xl font-extrabold transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 flex items-center justify-center gap-3" 
                      onClick={handleCreate} 
                      disabled={isLoading || !newTitle.trim()}
                    >
                      {isLoading && <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                      {isLoading ? 'Đang tạo...' : 'Tạo bảng ngay'}
                    </button>
                    <button 
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 py-4 rounded-2xl font-extrabold transition-all" 
                      onClick={() => setShowModal(false)}
                    >
                      Hủy bỏ
                    </button>
                  </div>
                </div>
              </ModalPanel>
            </ModalOverlay>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
