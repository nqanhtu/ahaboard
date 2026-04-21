'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { updateCardOrder, createCard, updateCardDetails, deleteCard, getHistory } from '@/actions/kanban'
import dynamic from 'next/dynamic'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

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

// Separate Card Component to allow memoization
const KanbanCard = React.memo(({ card, index, openEditModal, getPreviewText }) => {
  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          className={`bg-white rounded-2xl p-5 mb-4 cursor-grab relative border border-transparent ${snapshot.isDragging ? 'shadow-2xl opacity-95 scale-[1.02] z-50 ring-4 ring-green-500/20 rotate-1' : 'shadow-sm hover:shadow-md hover:border-green-200 transition-all duration-200'}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => openEditModal(card)}
          style={{
            ...provided.draggableProps.style,
          }}
        >
          {card.displayId && (
            <div className="text-[10px] font-bold text-gray-400 mb-1.5 font-mono bg-gray-50 inline-block px-1.5 py-0.5 rounded uppercase tracking-wider">
              {card.displayId}
            </div>
          )}
          <div className="font-bold text-gray-900 mb-2.5 break-words leading-[1.3] text-[15px]">{card.title}</div>
          {card.description && (
            <div className="text-sm text-gray-500 line-clamp-3 leading-relaxed mb-3">
              {getPreviewText(card.description)}
            </div>
          )}
          
          <div className="mt-auto flex items-center justify-between">
            {card.assignee ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white flex items-center justify-center font-bold text-[11px] shadow-sm ring-2 ring-white" title={card.assignee.name}>
                  {card.assignee.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-[11px] font-bold text-gray-500">{card.assignee.name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 opacity-40">
                <div className="w-8 h-8 rounded-xl bg-gray-200 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2">
               {card.description && (
                 <svg className="text-gray-300" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
               )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
});

// Rename for export
KanbanCard.displayName = 'KanbanCard';

function KanbanBoard({ initialBoard, users = [] }) {
  const [board, setBoard] = useState(initialBoard)
  const [isAddingCardTo, setIsAddingCardTo] = useState(null)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [editingCard, setEditingCard] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
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

  const [selectedColumnId, setSelectedColumnId] = useState(null)

  useEffect(() => {
    setIsMounted(true)
    if (board.columns.length > 0) {
      setSelectedColumnId(board.columns[0].id)
    }
  }, [board.columns])

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
        
        // Also ensure the column is selected on mobile if the card belongs to a different column
        if (card.columnId !== selectedColumnId) {
          setSelectedColumnId(card.columnId)
        }
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
      const newColumns = board.columns.map(col => {
        if (col.id === columnId) {
          return { ...col, cards: [...col.cards, res.card] }
        }
        return col
      })
      setBoard({ ...board, columns: newColumns })
      toast.success('Đã thêm thẻ mới')
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
    setIsAssigneeOpen(false)
    router.push(pathname, { scroll: false })
  }

  const handleSaveCard = async () => {
    if (!editForm.title.trim() || !editingCard) return

    const res = await updateCardDetails(editingCard.id, editForm)
    if (res.success) {
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
      toast.success('Đã lưu thay đổi')
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
      toast.success('Đã xóa thẻ')
      closeEditModal()
    } else {
      toast.error(res.error || 'Đã xảy ra lỗi khi xóa thẻ.')
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
    <div className="flex flex-col h-full bg-green-50/40">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center px-6 md:px-8 py-4 md:py-5 bg-white/50 backdrop-blur-sm border-b border-green-900/5 gap-4">
        <div className="flex items-center justify-between w-full md:w-auto">
          <h2 className="text-xl md:text-2xl font-extrabold text-gray-900">{board.title}</h2>
          <button 
            className="md:hidden flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-green-700 hover:bg-green-100/50 rounded-full transition-all border border-gray-200 bg-white shadow-sm" 
            onClick={handleOpenHistory}
          >
            Lịch sử
          </button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {/* Mobile Column Selector */}
          <div className="flex md:hidden items-center gap-2 w-full">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider shrink-0">Cột:</label>
            <select 
              className="flex-1 px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all appearance-none shadow-sm cursor-pointer"
              value={selectedColumnId || ''}
              onChange={(e) => setSelectedColumnId(e.target.value)}
            >
              {board.columns.map(col => (
                <option key={col.id} value={col.id}>{col.title} ({col.cards.length})</option>
              ))}
            </select>
          </div>

          <button 
            className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 hover:text-green-700 hover:bg-green-100/50 rounded-full transition-all" 
            onClick={handleOpenHistory}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Lịch sử hoạt động
          </button>
        </div>
      </header>
      
      <div className="flex-1 relative overflow-hidden h-full">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex items-start p-6 md:p-8 h-full overflow-x-auto md:overflow-x-auto md:overflow-y-hidden gap-6 scroll-smooth">
            {board.columns.map((column, colIndex) => {
              // On mobile, only show the selected column
              const isSelectedOnMobile = selectedColumnId === column.id;
              
              const bgColors = ['bg-pink-50', 'bg-orange-50', 'bg-blue-50', 'bg-purple-50'];
              const dotColors = ['bg-pink-500', 'bg-orange-500', 'bg-blue-500', 'bg-purple-500'];
              const colBg = bgColors[colIndex % 4];
              const dotBg = dotColors[colIndex % 4];
              
              return (
                <div 
                  key={column.id} 
                  className={`w-full md:w-[340px] md:min-w-[340px] max-h-full flex flex-col rounded-[2rem] md:rounded-3xl ${colBg} border border-black/5 shadow-sm transition-all duration-300 ${isSelectedOnMobile ? 'flex' : 'hidden md:flex'}`}
                >
                  <div className="flex items-center gap-3 px-6 py-5 font-extrabold text-gray-900 border-b border-black/[0.03]">
                    <div className={`w-3 h-3 rounded-full ${dotBg} shadow-sm`} />
                    <span className="truncate">{column.title}</span>
                    <span className="ml-auto text-xs font-bold text-gray-500 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm border border-black/[0.02]">
                      {column.cards.length}
                    </span>
                  </div>
                  
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div 
                        className="flex-1 overflow-y-auto px-4 py-4 min-h-[100px] scrollbar-thin scrollbar-thumb-black/5 scrollbar-track-transparent"
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        {column.cards.map((card, index) => (
                          <KanbanCard 
                            key={card.id} 
                            card={card} 
                            index={index} 
                            openEditModal={openEditModal} 
                            getPreviewText={getPreviewText} 
                          />
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  <div className="p-4 border-t border-black/[0.03]">
                    {isAddingCardTo === column.id ? (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <textarea
                          autoFocus
                          className="w-full min-h-[100px] p-4 rounded-2xl border border-black/10 bg-white text-gray-900 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all resize-none shadow-sm mb-3 text-sm font-medium"
                          placeholder="Công việc mới..."
                          value={newCardTitle}
                          onChange={(e) => setNewCardTitle(e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, column.id)}
                          onBlur={() => handleAddCard(column.id)}
                        />
                        <div className="flex gap-2">
                          <button 
                            className="bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 rounded-full font-bold transition-all shadow-md shadow-green-500/20 hover:shadow-green-500/30 hover:-translate-y-0.5 text-sm"
                            onMouseDown={(e) => {
                              e.preventDefault()
                              handleAddCard(column.id)
                            }}
                          >
                            Thêm ngay
                          </button>
                          <button 
                            className="text-gray-500 hover:bg-black/5 hover:text-gray-900 px-5 py-2.5 rounded-full font-bold transition-all text-sm"
                            onClick={() => {
                              setIsAddingCardTo(null)
                              setNewCardTitle('')
                            }}
                          >
                            Hủy
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <button className="w-full text-left p-4 text-gray-500 hover:text-green-700 hover:bg-white/60 rounded-2xl flex items-center gap-3 font-bold transition-all border border-transparent hover:border-green-100 hover:shadow-sm" onClick={() => setIsAddingCardTo(column.id)}>
                        <div className="w-6 h-6 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                          </svg>
                        </div>
                        Thêm thẻ mới
                      </button>
                    )}
                  </div>
                </div>
              )})}
          </div>
        </DragDropContext>
      </div>

      {/* Edit Card Modal */}
      {mounted && createPortal(
        <AnimatePresence>
          {editingCard && (
            <motion.div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-start z-[9999] pt-16 px-4" onClick={closeEditModal} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <motion.div className="bg-white w-full max-w-[640px] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden max-h-[85vh] border border-white/10" onClick={e => e.stopPropagation()} initial={{ opacity: 0, y: 32, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }} transition={{ type: 'spring', damping: 28, stiffness: 380 }}>
                <div className="p-8 pb-4 border-b border-gray-100">
                  {editingCard.displayId && (
                    <div className="text-xs font-semibold text-gray-400 mb-2 font-mono">
                      {editingCard.displayId}
                    </div>
                  )}
                  <input 
                    type="text" 
                    value={editForm.title}
                    onChange={e => setEditForm({...editForm, title: e.target.value})}
                    placeholder="Tiêu đề thẻ..."
                    className="w-full text-2xl font-bold text-gray-800 bg-transparent border-none focus:outline-none focus:ring-0 p-0 placeholder-gray-300"
                  />
                </div>
                <div className="px-8 py-6 overflow-y-auto">
                  <div className="w-full">
                    <label className="text-sm font-semibold text-gray-500 mb-2 block ml-1">Người thực hiện</label>
                    <div className="relative mb-6">
                      <button
                        onClick={() => setIsAssigneeOpen(!isAssigneeOpen)}
                        className="w-full px-5 py-3.5 rounded-2xl border border-black/10 bg-gray-50 hover:bg-white text-gray-800 focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs border border-green-200 shrink-0">
                            {editForm.assigneeId ? (users.find(u => u.id === editForm.assigneeId)?.name?.charAt(0).toUpperCase() || '?') : '?'}
                          </div>
                          <span className="font-bold text-[15px]">
                            {editForm.assigneeId ? (users.find(u => u.id === editForm.assigneeId)?.name || users.find(u => u.id === editForm.assigneeId)?.username) : 'Chưa gán'}
                          </span>
                        </div>
                        <div className={`text-gray-400 group-hover:text-green-600 transition-transform duration-300 ${isAssigneeOpen ? 'rotate-180' : ''}`}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                        </div>
                      </button>

                      <AnimatePresence>
                        {isAssigneeOpen && (
                          <>
                            <div className="fixed inset-0 z-[100]" onClick={() => setIsAssigneeOpen(false)} />
                            <motion.div
                              initial={{ opacity: 0, y: 8, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 8, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-3xl shadow-2xl z-[110] overflow-hidden p-2 origin-top"
                            >
                              <button
                                onClick={() => {
                                  setEditForm({...editForm, assigneeId: null})
                                  setIsAssigneeOpen(false)
                                }}
                                className={`w-full text-left px-4 py-3 rounded-xl text-[14px] font-bold transition-all flex items-center gap-3 ${!editForm.assigneeId ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}
                              >
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                </div>
                                <span>Không có</span>
                              </button>
                              
                              <div className="h-px bg-gray-100 my-1 mx-2" />
                              
                              {users.map(user => (
                                <button
                                  key={user.id}
                                  onClick={() => {
                                    setEditForm({...editForm, assigneeId: user.id})
                                    setIsAssigneeOpen(false)
                                  }}
                                  className={`w-full text-left px-4 py-3 rounded-xl text-[14px] font-bold transition-all flex items-center justify-between group ${editForm.assigneeId === user.id ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-colors ${editForm.assigneeId === user.id ? 'bg-green-100 border-green-200 text-green-700' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                                      {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <span>{user.name || user.username}</span>
                                  </div>
                                  {editForm.assigneeId === user.id && (
                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                  )}
                                </button>
                              ))}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>

                    <label className="text-sm font-semibold text-gray-500 mb-2 block">Mô tả chi tiết</label>
                    <div className="rounded-2xl border border-black/10 overflow-hidden focus-within:ring-4 focus-within:ring-green-500/20 focus-within:border-green-500 transition-all bg-gray-50 focus-within:bg-white">
                      <div className="p-4">
                        <Editor 
                          value={editForm.description} 
                          onChange={(data) => setEditForm({...editForm, description: data})} 
                        />
                      </div>
                    </div>
                    
                    {showDeleteConfirm ? (
                      <div className="mt-8 flex justify-between items-center bg-red-50 p-4 rounded-2xl border border-red-200">
                        <span className="text-red-700 text-sm font-semibold">Bạn có chắc muốn xóa thẻ này không?</span>
                        <div className="flex gap-2">
                          <button className="text-red-800 hover:bg-red-100 px-4 py-2 rounded-full text-sm font-semibold transition-colors" onClick={() => setShowDeleteConfirm(false)}>Hủy</button>
                          <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-sm transition-all" onClick={executeDeleteCard}>Xác nhận Xóa</button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-8 flex justify-between items-center pt-4">
                        <button className="text-red-500 hover:bg-red-50 hover:text-red-600 px-5 py-2.5 rounded-full text-sm font-semibold transition-colors flex items-center gap-2" onClick={handleDeleteCard}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                          Xóa thẻ
                        </button>
                        <div className="flex gap-3">
                          <button className="text-gray-500 hover:bg-gray-100 hover:text-gray-800 px-6 py-2.5 rounded-full font-semibold transition-all text-sm" onClick={closeEditModal}>Hủy bỏ</button>
                          <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-full font-semibold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 text-sm" onClick={handleSaveCard}>Lưu thay đổi</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* History Modal */}
      {mounted && createPortal(
        <AnimatePresence>
          {showHistory && (
            <motion.div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-start z-[9999] pt-24 px-4" onClick={() => setShowHistory(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <motion.div className="bg-white w-full max-w-[500px] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/10" onClick={e => e.stopPropagation()} initial={{ opacity: 0, y: 32, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }} transition={{ type: 'spring', damping: 28, stiffness: 380 }}>
                <div className="flex justify-between items-center p-6 px-8">
                  <h3 className="text-xl font-bold text-gray-800">Lịch sử hoạt động</h3>
                  <button className="text-gray-400 hover:text-gray-700 hover:bg-gray-200 p-2 rounded-full transition-colors" onClick={() => setShowHistory(false)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
                <div className="p-0 max-h-[60vh] overflow-y-auto">
                  {loadingHistory ? (
                    <div className="p-6 space-y-4">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="flex gap-4 animate-pulse">
                          <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                          <div className="flex-1 space-y-2 py-1">
                            <div className="h-4 bg-gray-200 rounded-full w-3/4" />
                            <div className="h-3 bg-gray-100 rounded-full w-1/3" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : historyLogs.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      </div>
                      <p className="text-gray-500 font-semibold mb-1">Chưa có hoạt động nào</p>
                      <p className="text-gray-400 text-sm">Các thay đổi sẽ được ghi lại tại đây.</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100 m-0 p-0 list-none">
                      {historyLogs.map((log, i) => (
                        <motion.li key={log.id} className="p-5 px-8 flex gap-4 hover:bg-gray-50/50 transition-colors" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                          <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm shrink-0 border border-green-200">
                            {log.user.name ? log.user.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div>
                            <div className="text-[15px] text-gray-700 leading-snug">
                              <span className="font-bold text-gray-900">{log.user.name || log.user.username}</span>{' '}
                              {log.action} <span className="font-bold text-gray-900">{log.entityTitle}</span>
                            </div>
                            <div className="text-xs font-medium text-gray-400 mt-1.5">
                              {new Date(log.createdAt).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })}
                            </div>
                          </div>
                        </motion.li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
