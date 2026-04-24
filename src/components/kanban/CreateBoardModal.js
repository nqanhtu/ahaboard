'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ModalOverlay, ModalPanel } from '../ui'
import { CloseIcon } from '../icons'
import { createBoard } from '@/actions/kanban'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function CreateBoardModal({ isOpen, onClose }) {
  const [title, setTitle] = useState('')
  const [prefix, setPrefix] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    try {
      const res = await createBoard({ 
        title: title.trim(), 
        prefix: prefix.trim().toUpperCase() 
      })

      if (res.success) {
        toast.success('Đã tạo dự án mới thành công!')
        setTitle('')
        setPrefix('')
        onClose()
        router.push(`/?boardId=${res.board.id}`)
        router.refresh()
      } else {
        toast.error(res.error || 'Lỗi khi tạo dự án')
      }
    } catch (error) {
      toast.error('Đã xảy ra lỗi không xác định')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Auto-generate prefix from title
  const handleTitleChange = (val) => {
    setTitle(val)
    if (val && !prefix) {
      const generated = val
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .substring(0, 3)
      setPrefix(generated)
    } else if (!val) {
      setPrefix('')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <ModalOverlay onClose={onClose}>
          <ModalPanel className="max-w-[500px]">
            <div className="flex justify-between items-center p-6 border-b border-border-subtle">
              <h2 className="text-xl font-bold text-text-main">Tạo dự án mới</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-text-muted">
                <CloseIcon size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-main">Tên dự án <span className="text-red-500">*</span></label>
                <input 
                  autoFocus
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Ví dụ: Dự án Phát triển Web"
                  className="w-full px-3 py-2 rounded border-2 border-border-subtle focus:border-primary focus:outline-none transition-all text-sm"
                  required
                />
                <p className="text-[11px] text-text-muted">Gợi ý: Tên dự án nên ngắn gọn và dễ nhớ.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-text-main">Mã dự án (Key) <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: WEB"
                  maxLength={5}
                  className="w-full px-3 py-2 rounded border-2 border-border-subtle focus:border-primary focus:outline-none transition-all text-sm font-bold uppercase"
                  required
                />
                <p className="text-[11px] text-text-muted">Mã này sẽ được dùng làm tiền tố cho các công việc (ví dụ: WEB-1, WEB-2).</p>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 hover:bg-gray-100 rounded text-sm font-bold text-text-main transition-all"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting || !title.trim()}
                  className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded text-sm font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {isSubmitting ? 'Đang tạo...' : 'Tạo dự án'}
                </button>
              </div>
            </form>
          </ModalPanel>
        </ModalOverlay>
      )}
    </AnimatePresence>
  )
}
