'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { updateCardOrder, createCard, updateCardDetails, deleteCard, getHistory } from '@/actions/kanban'
import dynamic from 'next/dynamic'

const Editor = dynamic(() => import('@/components/Editor'), { 
  ssr: false,
  loading: () => <div style={{ padding: '20px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', minHeight: '200px', backgroundColor: '#f8fafc' }}>Đang tải trình soạn thảo...</div>
})

export default function KanbanBoardWrapper(props) {
  return (
    <Suspense fallback={<div style={{ padding: '24px' }}>Đang tải bảng công việc...</div>}>
      <KanbanBoard {...props} />
    </Suspense>
  )
}

function KanbanBoard({ initialBoard, users = [] }) {
  const [board, setBoard] = useState(initialBoard)
  const [isAddingCardTo, setIsAddingCardTo] = useState(null)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [editingCard, setEditingCard] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', description: '', assigneeId: null })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const [showHistory, setShowHistory] = useState(false)
  const [historyLogs, setHistoryLogs] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Add mounted state to fix hydration mismatch with react-beautiful-dnd
  const [isMounted, setIsMounted] = useState(false)

  // Find card helper (by internal id or displayId)
  const findCardById = (identifier) => {
    for (const col of board.columns) {
      const card = col.cards.find(c => c.id === identifier || c.displayId === identifier)
      if (card) return card
    }
    return null
  }

  // Extract plain text from rich editor JSON for card preview
  const getPreviewText = (desc) => {
    if (!desc) return null;
    try {
      const data = JSON.parse(desc);
      // Tiptap JSON format (doc > content > paragraph/heading nodes)
      if (data.type === 'doc' && data.content) {
        const extractText = (nodes) => {
          if (!nodes) return '';
          return nodes.map(node => {
            if (node.text) return node.text;
            if (node.content) return extractText(node.content);
            return '';
          }).join(' ');
        };
        return extractText(data.content).trim();
      }
      // Editor.js format (blocks array) — backward compatibility
      if (data.blocks) {
        return data.blocks.map(b => b.data?.text || '').join(' ').replace(/<[^>]*>?/gm, '');
      }
      return desc;
    } catch(e) {
      return desc;
    }
  }

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Sync URL with Modal state
  useEffect(() => {
    if (!isMounted) return

    const cardIdFromUrl = searchParams.get('card')
    if (cardIdFromUrl) {
      const card = findCardById(cardIdFromUrl)
      if (card && (!editingCard || (editingCard.displayId || editingCard.id) !== cardIdFromUrl)) {
        // Open modal without pushing url again
        setEditingCard(card)
        setEditForm({ 
          title: card.title, 
          description: card.description || '',
          assigneeId: card.assigneeId || null
        })
        setShowDeleteConfirm(false)
      }
    } else if (editingCard) {
      // url has no card parameter but modal is open (e.g. hit back button)
      setEditingCard(null)
      setShowDeleteConfirm(false)
    }
  }, [searchParams, isMounted]) // Don't add board as dependency to avoid re-triggering on drag

  if (!isMounted) {
    return null // or a loading skeleton
  }

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result

    if (!destination) return

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const sourceColumn = board.columns.find(col => col.id === source.droppableId)
    const destColumn = board.columns.find(col => col.id === destination.droppableId)

    // Moving within the same column
    if (sourceColumn === destColumn) {
      const newCards = Array.from(sourceColumn.cards)
      const [removed] = newCards.splice(source.index, 1)
      newCards.splice(destination.index, 0, removed)

      // Update local state
      const updatedCards = newCards.map((card, index) => ({ ...card, order: index }))
      
      const newColumns = board.columns.map(col => {
        if (col.id === sourceColumn.id) {
          return { ...col, cards: updatedCards }
        }
        return col
      })

      setBoard({ ...board, columns: newColumns })

      // Call server action
      await updateCardOrder(updatedCards)
      return
    }

    // Moving from one column to another
    const sourceCards = Array.from(sourceColumn.cards)
    const destCards = Array.from(destColumn.cards)
    const [removed] = sourceCards.splice(source.index, 1)

    // Update removed item's column ID
    const updatedRemoved = { ...removed, columnId: destColumn.id }
    destCards.splice(destination.index, 0, updatedRemoved)

    // Update orders for both columns
    const updatedSourceCards = sourceCards.map((card, index) => ({ ...card, order: index }))
    const updatedDestCards = destCards.map((card, index) => ({ ...card, order: index }))

    const newColumns = board.columns.map(col => {
      if (col.id === sourceColumn.id) {
        return { ...col, cards: updatedSourceCards }
      }
      if (col.id === destColumn.id) {
        return { ...col, cards: updatedDestCards }
      }
      return col
    })

    setBoard({ ...board, columns: newColumns })

    // Update server
    await updateCardOrder([...updatedSourceCards, ...updatedDestCards])
  }

  const handleAddCard = async (columnId) => {
    if (!newCardTitle.trim()) {
      setIsAddingCardTo(null)
      return
    }

    // Call server API
    const res = await createCard({
      title: newCardTitle,
      columnId
    })

    if (res.success) {
      // Update local state
      const newColumns = board.columns.map(col => {
        if (col.id === columnId) {
          return { ...col, cards: [...col.cards, res.card] }
        }
        return col
      })
      setBoard({ ...board, columns: newColumns })
    }

    setNewCardTitle('')
    setIsAddingCardTo(null)
  }

  const handleKeyDown = (e, columnId) => {
    if (e.key === 'Enter') {
      handleAddCard(columnId)
    } else if (e.key === 'Escape') {
      setIsAddingCardTo(null)
      setNewCardTitle('')
    }
  }

  const openEditModal = (card) => {
    setEditingCard(card)
    setEditForm({ 
      title: card.title, 
      description: card.description || '',
      assigneeId: card.assigneeId || null
    })
    setShowDeleteConfirm(false)
    router.push(`${pathname}?card=${card.displayId || card.id}`, { scroll: false })
  }

  const closeEditModal = () => {
    setEditingCard(null)
    setShowDeleteConfirm(false)
    router.push(pathname, { scroll: false })
  }

  const handleSaveCard = async () => {
    if (!editForm.title.trim() || !editingCard) return

    const res = await updateCardDetails(editingCard.id, editForm)
    if (res.success) {
      // Update local state
      const newColumns = board.columns.map(col => {
        if (col.id === editingCard.columnId) {
          return {
            ...col,
            cards: col.cards.map(c => c.id === editingCard.id ? res.card : c)
          }
        }
        return col
      })
      setBoard({ ...board, columns: newColumns })
    }
    
    closeEditModal()
  }

  const handleDeleteCard = () => {
    setShowDeleteConfirm(true)
  }

  const executeDeleteCard = async () => {
    if (!editingCard) return
    
    const res = await deleteCard(editingCard.id)
    if (res.success) {
      // Remove from local state
      const newColumns = board.columns.map(col => {
        if (col.id === editingCard.columnId) {
          return {
            ...col,
            cards: col.cards.filter(c => c.id !== editingCard.id)
          }
        }
        return col
      })
      setBoard({ ...board, columns: newColumns })
      closeEditModal()
    } else {
      alert(res.error || "Đã xảy ra lỗi khi xóa thẻ.")
      setShowDeleteConfirm(false)
    }
  }

  const handleOpenHistory = async () => {
    setShowHistory(true)
    setLoadingHistory(true)
    const logs = await getHistory()
    setHistoryLogs(logs)
    setLoadingHistory(false)
  }

  return (
    <div className="board-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>{board.title}</h2>
        <button 
          className="btn btn-ghost" 
          onClick={handleOpenHistory}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          Lịch sử hoạt động
        </button>
      </header>
      
      <div className="app-content">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="board">
            {board.columns.map((column, colIndex) => (
              <div key={column.id} className={`column col-bg-${colIndex % 4}`}>
                <div className="column-header">
                  {column.title}
                  <span className="count">
                    {column.cards.length}
                  </span>
                </div>
                
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div 
                      className="card-list"
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        backgroundColor: snapshot.isDraggingOver ? 'rgba(0,0,0,0.03)' : 'transparent',
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      {column.cards.map((card, index) => (
                        <Draggable key={card.id} draggableId={card.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              className="card"
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => openEditModal(card)}
                              style={{
                                ...provided.draggableProps.style,
                                transform: snapshot.isDragging ? provided.draggableProps.style.transform : 'none',
                                opacity: snapshot.isDragging ? 0.9 : 1,
                                boxShadow: snapshot.isDragging ? '0 12px 24px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.04)',
                                border: 'none'
                              }}
                            >
                              {card.displayId && (
                                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px', fontFamily: 'monospace' }}>
                                  {card.displayId}
                                </div>
                              )}
                                <div className="card-title">{card.title}</div>
                              {card.description && (
                                <div className="card-desc" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {getPreviewText(card.description)}
                                </div>
                              )}
                              
                              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center' }}>
                                {card.assignee && (
                                  <div className="user-avatar" title={card.assignee.name}>
                                    {card.assignee.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                <div className="column-footer">
                  {isAddingCardTo === column.id ? (
                    <div>
                      <textarea
                        autoFocus
                        className="textarea-field"
                        style={{ minHeight: '60px', marginBottom: '8px' }}
                        placeholder="Nhập tiêu đề cho thẻ này..."
                        value={newCardTitle}
                        onChange={(e) => setNewCardTitle(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, column.id)}
                        onBlur={() => handleAddCard(column.id)}
                      />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn btn-primary" 
                          onMouseDown={(e) => {
                            e.preventDefault() // prevent blur
                            handleAddCard(column.id)
                          }}
                        >
                          Thêm thẻ
                        </button>
                        <button 
                          className="btn btn-ghost" 
                          onClick={() => {
                            setIsAddingCardTo(null)
                            setNewCardTitle('')
                          }}
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button className="add-card-btn" onClick={() => setIsAddingCardTo(column.id)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      Thêm thẻ
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Edit Card Modal */}
      {editingCard && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              {editingCard.displayId && (
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', fontFamily: 'monospace' }}>
                  {editingCard.displayId}
                </div>
              )}
              <input 
                type="text" 
                value={editForm.title}
                onChange={e => setEditForm({...editForm, title: e.target.value})}
                placeholder="Tiêu đề thẻ..."
                className="input-field"
                style={{ fontSize: '20px', fontWeight: 'bold', border: 'none', background: 'transparent', padding: '0', boxShadow: 'none' }}
              />
            </div>
            <div className="modal-body">
              <div style={{ width: '100%' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Người thực hiện</label>
                <select
                  className="input-field"
                  style={{ marginBottom: '16px' }}
                  value={editForm.assigneeId || ''}
                  onChange={e => setEditForm({...editForm, assigneeId: e.target.value || null})}
                >
                  <option value="">Không có</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name || user.username}</option>
                  ))}
                </select>

                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Mô tả</label>
                <Editor 
                  value={editForm.description} 
                  onChange={(data) => setEditForm({...editForm, description: data})} 
                />
                
                {showDeleteConfirm ? (
                  <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fef2f2', padding: '12px 16px', borderRadius: '8px', border: '1px solid #fca5a5' }}>
                    <span style={{ color: '#b91c1c', fontSize: '13px', fontWeight: 600 }}>Bạn có chắc muốn xóa thẻ này không?</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-ghost" onClick={() => setShowDeleteConfirm(false)} style={{ color: '#7f1d1d', padding: '6px 12px', fontSize: '13px' }}>Hủy</button>
                      <button className="btn btn-danger" onClick={executeDeleteCard} style={{ backgroundColor: '#ef4444', color: 'white', padding: '6px 12px', fontSize: '13px' }}>Xác nhận Xóa</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button className="btn btn-danger" onClick={handleDeleteCard} style={{ backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '8px 16px', fontSize: '13px' }}>
                      Xóa thẻ
                    </button>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button className="btn btn-ghost" onClick={closeEditModal}>Hủy bỏ</button>
                      <button className="btn btn-primary" onClick={handleSaveCard}>Lưu thay đổi</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Lịch sử hoạt động</h3>
              <button className="btn btn-ghost" onClick={() => setShowHistory(false)} style={{ padding: '4px 8px' }}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: '0', maxHeight: '60vh', overflowY: 'auto' }}>
              {loadingHistory ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>Đang tải...</div>
              ) : historyLogs.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>Chưa có hoạt động nào.</div>
              ) : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {historyLogs.map(log => (
                    <li key={log.id} style={{ padding: '16px 24px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', gap: '12px' }}>
                      <div className="user-avatar" style={{ width: '32px', height: '32px', flexShrink: 0 }}>
                        {log.user.name ? log.user.name.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                          <span style={{ fontWeight: 600 }}>{log.user.name || log.user.username}</span>{' '}
                          {log.action} <span style={{ fontWeight: 600 }}>{log.entityTitle}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          {new Date(log.createdAt).toLocaleString('vi-VN')}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
