'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBoard } from '@/actions/kanban'

export default function BoardSelector({ boards, activeBoardId }) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPrefix, setNewPrefix] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleCreate = async () => {
    if (!newTitle.trim()) return
    setIsLoading(true)
    const res = await createBoard({ title: newTitle, prefix: newPrefix })
    setIsLoading(false)
    if (res.success) {
      setShowModal(false)
      setNewTitle('')
      setNewPrefix('')
      router.push(`/?boardId=${res.board.id}`)
    } else {
      alert(res.error || 'Lỗi khi tạo bảng')
    }
  }

  const handleSelect = (e) => {
    const val = e.target.value
    if (val) {
      router.push(`/?boardId=${val}`)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <select 
        value={activeBoardId || ''} 
        onChange={handleSelect}
        className="input-field"
        style={{
          padding: '8px 12px',
          width: 'auto',
          minWidth: '200px',
          cursor: 'pointer',
          height: '40px'
        }}
      >
        {boards.map(b => (
          <option key={b.id} value={b.id}>{b.title}</option>
        ))}
      </select>

      <button 
        className="btn btn-ghost"
        onClick={() => setShowModal(true)}
        style={{ height: '40px', padding: '0 16px', border: '1px solid rgba(0,0,0,0.1)', backgroundColor: '#ffffff' }}
      >
        + Tạo bảng
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ zIndex: 100 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', margin: 0 }}>Tạo bảng mới</h3>
            </div>
            <div className="modal-body">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Tên bảng (*)</label>
              <input 
                autoFocus
                className="input-field"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="VD: Dự án Alpha..."
                style={{ marginBottom: '16px', width: '100%', boxSizing: 'border-box' }}
              />

              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600 }}>Tiền tố thẻ (Tùy chọn)</label>
              <input 
                className="input-field"
                value={newPrefix}
                onChange={e => setNewPrefix(e.target.value)}
                placeholder="VD: ALP (Để trống sẽ tự động tạo)"
                style={{ marginBottom: '24px', width: '100%', boxSizing: 'border-box' }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Hủy</button>
                <button className="btn btn-primary" onClick={handleCreate} disabled={isLoading || !newTitle.trim()}>
                  {isLoading ? 'Đang tạo...' : 'Tạo mới'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
