'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { ModalOverlay, ModalPanel, UserAvatar, ActiveDot, DROPDOWN_ANIMATION } from '../ui'
import { CloseIcon, ChevronDownIcon, TrashIcon } from '../icons'
import CommentSection from './CommentSection'

const Editor = dynamic(() => import('@/components/Editor'), { 
  ssr: false,
  loading: () => <div className="p-5 border border-border-subtle rounded min-h-[200px] bg-gray-50/50 animate-pulse">Loading editor...</div>
})

export default function CardEditModal({
  editingCard,
  editForm,
  setEditForm,
  closeEditModal,
  isAssigneeOpen,
  setIsAssigneeOpen,
  users,
  handleDeleteCard,
  handleSaveCard,
  showDeleteConfirm,
  setShowDeleteConfirm,
  executeDeleteCard,
  isSaving,
  currentUser
}) {
  return (
    <ModalOverlay onClose={isSaving ? undefined : closeEditModal} className="items-start pt-10 pb-10">
      <ModalPanel className="max-w-[1040px] w-[95vw] h-full max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-3 text-[13px] text-text-muted font-medium">
             <div className="flex items-center gap-1 hover:bg-gray-100 px-1 rounded cursor-pointer transition-colors">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
               <span>Dự án</span>
             </div>
             <span>/</span>
             <span className="hover:underline cursor-pointer">{editingCard?.displayId || 'KAN-000'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={closeEditModal}
              className="p-2 hover:bg-gray-100 rounded transition-colors text-text-muted ml-2"
            >
              <CloseIcon size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
          {/* Left Column: Content */}
          <div className="flex-1 px-8 py-6">
            <textarea 
              value={editForm.title}
              onChange={e => setEditForm({...editForm, title: e.target.value})}
              placeholder="Thêm tiêu đề"
              disabled={isSaving}
              rows={1}
              className="w-full text-2xl font-bold text-text-main bg-transparent border-2 border-transparent hover:border-border-subtle focus:border-primary focus:bg-white rounded px-2 py-1 -ml-2 transition-all resize-none overflow-hidden focus:outline-none mb-6"
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />

            <div className="space-y-6">
              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-text-main">Mô tả</h3>
                <div className={`border-2 border-transparent hover:border-border-subtle focus-within:border-primary rounded transition-all ${isSaving ? 'opacity-70 grayscale pointer-events-none' : ''}`}>
                  <Editor 
                    value={editForm.description} 
                    onChange={(data) => setEditForm({...editForm, description: data})} 
                  />
                </div>
              </div>

              {/* Comments */}
              <div className="pt-4 border-t border-border-subtle">
                <CommentSection cardId={editingCard.id} currentUser={currentUser} />
              </div>
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="w-full md:w-[320px] px-6 py-6 border-l border-border-subtle bg-white flex flex-col gap-6 shrink-0">
            {/* Status Placeholder */}
            <div className="space-y-2">
               <h3 className="text-[11px] font-bold text-text-muted uppercase">Trạng thái</h3>
               <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-bold rounded hover:bg-blue-100 cursor-pointer transition-colors uppercase">
                 ĐANG THỰC HIỆN <ChevronDownIcon size={12} />
               </div>
            </div>

            {/* Assignee Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-text-main">Chi tiết</h3>
              
              <div className="grid grid-cols-[110px,1fr] gap-y-4 items-center">
                <span className="text-sm text-text-muted">Người thực hiện</span>
                <div className="relative">
                  <button
                    onClick={() => setIsAssigneeOpen(!isAssigneeOpen)}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded transition-colors w-full text-left"
                  >
                    <UserAvatar 
                      name={editForm.assigneeId ? (users.find(u => u.id === editForm.assigneeId)?.name || '?') : '?'} 
                      image={editForm.assigneeId ? (users.find(u => u.id === editForm.assigneeId)?.image) : null}
                      isActive={!!editForm.assigneeId} 
                      size="sm" 
                    />
                    <span className="text-sm font-medium text-text-main truncate">
                      {editForm.assigneeId ? (users.find(u => u.id === editForm.assigneeId)?.name) : 'Chưa gán'}
                    </span>
                  </button>

                  <AnimatePresence>
                    {isAssigneeOpen && (
                      <>
                        <div className="fixed inset-0 z-[100]" onClick={() => setIsAssigneeOpen(false)} />
                        <motion.div
                          {...DROPDOWN_ANIMATION}
                          className="absolute top-full left-0 mt-1 w-64 bg-white border border-border-subtle rounded shadow-xl z-[110] overflow-hidden py-1"
                        >
                          <div className="max-h-[240px] overflow-y-auto px-1 custom-scrollbar">
                            <button
                              onClick={() => {
                                setEditForm({...editForm, assigneeId: null})
                                setIsAssigneeOpen(false)
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-3"
                            >
                              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                              </div>
                              <span>Chưa gán</span>
                            </button>
                            <div className="h-px bg-gray-100 my-1 mx-2" />
                            {users.map(user => (
                              <button
                                key={user.id}
                                onClick={() => {
                                  setEditForm({...editForm, assigneeId: user.id})
                                  setIsAssigneeOpen(false)
                                }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-3"
                              >
                                <UserAvatar 
                                  name={user.name || user.username} 
                                  image={user.image}
                                  size="sm" 
                                />
                                <span>{user.name || user.username}</span>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <span className="text-sm text-text-muted">Độ ưu tiên</span>
                <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded cursor-pointer group">
                  <div className="text-red-500"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21l-12-18h24z"/></svg></div>
                  <span className="text-sm text-text-main">Cao</span>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="mt-auto pt-6 text-[11px] text-text-muted space-y-1">
               <p>Được tạo: 23 tháng 4, 2026</p>
               <p>Cập nhật: vừa xong</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border-subtle bg-gray-50/50 flex flex-col gap-4">
          {showDeleteConfirm ? (
            <div className="flex items-center justify-between bg-red-50 p-3 rounded border border-red-100">
              <span className="text-red-700 text-sm font-bold">Xác nhận xóa công việc này vĩnh viễn?</span>
              <div className="flex gap-2">
                <button className="text-sm font-bold text-red-800 hover:underline px-2" onClick={() => setShowDeleteConfirm(false)}>Hủy</button>
                <button 
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded text-sm font-bold shadow-sm flex items-center gap-2"
                  onClick={executeDeleteCard}
                  disabled={isSaving}
                >
                  {isSaving ? 'Đang xóa...' : 'Xác nhận xóa'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <button 
                className="text-text-muted hover:text-red-600 hover:bg-red-50 p-2 rounded transition-all"
                onClick={handleDeleteCard}
                disabled={isSaving}
                title="Xóa công việc"
              >
                <TrashIcon size={18} />
              </button>
              <div className="flex gap-2">
                <button 
                  className="px-4 py-2 hover:bg-gray-200 rounded text-sm font-bold text-text-main transition-all"
                  onClick={closeEditModal}
                  disabled={isSaving}
                >
                  Đóng
                </button>
                <button 
                  className="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                  onClick={handleSaveCard}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Đang lưu...</>
                  ) : 'Lưu thay đổi'}
                </button>
              </div>
            </div>
          )}
        </div>
      </ModalPanel>
    </ModalOverlay>
  )
}
