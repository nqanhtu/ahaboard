'use client'

import React, { useState, useEffect, Suspense, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { DragDropContext, Draggable } from '@hello-pangea/dnd'
import { updateCardOrder, createCard, updateCardDetails, deleteCard, getHistory } from '@/actions/kanban'
import dynamic from 'next/dynamic'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { PlusIcon, UserIcon, CommentIcon } from './icons'
import { UserAvatar } from './ui'
import { getPreviewText } from '@/utils/text'
import KanbanColumn from './KanbanColumn'
import CardEditModal from './kanban/CardEditModal'
import HistorySidebar from './kanban/HistorySidebar'
import BoardHeader from './kanban/BoardHeader'

import BoardSkeleton from './kanban/Skeleton'

export default function KanbanBoardWrapper(props) {
  return (
    <Suspense fallback={<BoardSkeleton />}>
      <KanbanBoard {...props} />
    </Suspense>
  )
}

// Separate Card Component to allow memoization
const KanbanCard = React.memo(({ card, index, openEditModal }) => {
  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          className={`bg-white p-3 mb-2 cursor-grab relative border border-border-subtle hover:bg-gray-50 transition-all ${snapshot.isDragging ? 'shadow-xl z-50 ring-2 ring-primary/20 rotate-1' : 'shadow-sm'} ${card.isPlaceholder ? 'opacity-50 grayscale pointer-events-none' : ''}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => openEditModal(card)}
          style={{
            ...provided.draggableProps.style,
          }}
        >
          {/* Tags / Epic (Optional) */}
          <div className="flex flex-wrap gap-1 mb-2">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-blue-100 text-blue-700 uppercase tracking-tight">ACCOUNTS</span>
          </div>

          <div className="text-[14px] text-text-main leading-snug mb-3">
            {card.title}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               {/* Task ID */}
               <span className="text-[11px] font-bold text-text-muted hover:underline cursor-pointer">
                 {card.displayId || 'KAN-000'}
               </span>
               
               {/* Comments Count */}
               {card._count?.comments > 0 && (
                 <div className="flex items-center gap-1 text-text-muted opacity-60" title={`${card._count.comments} comments`}>
                    <CommentIcon size={12} />
                    <span className="text-[10px] font-bold">{card._count.comments}</span>
                 </div>
               )}
            </div>

            <div className="flex items-center gap-2">
               {/* Priority Icon (Placeholder for High) */}
               <div title="High Priority" className="text-red-500 opacity-80">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21l-12-18h24z"/></svg>
               </div>

               {/* Assignee */}
               {card.assignee ? (
                 <div className="ring-2 ring-white rounded-full">
                   <UserAvatar 
                     name={card.assignee.name} 
                     image={card.assignee.image} 
                     size="xs" 
                     isActive={true} 
                   />
                 </div>
               ) : (
                 <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border border-border-subtle">
                    <UserIcon size={10} />
                 </div>
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

function KanbanBoard({ initialBoard, users = [], currentUser }) {
  // --- Board State ---
  const [board, setBoard] = useState(initialBoard)
  const [isMounted, setIsMounted] = useState(false)
  const [selectedColumnId, setSelectedColumnId] = useState(null)

  // --- Card Creation State ---
  const [isAddingCardTo, setIsAddingCardTo] = useState(null)
  const [newCardTitle, setNewCardTitle] = useState('')

  // --- Edit Modal State ---
  const [editingCard, setEditingCard] = useState(null)
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', description: '', assigneeId: null })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // --- UI Logic State ---
  const [isSaving, setIsSaving] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Find card helper (by internal id or displayId)
  const findCardById = useCallback((identifier) => {
    for (const col of board.columns) {
      const card = col.cards.find(c => c.id === identifier || c.displayId === identifier)
      if (card) return card
    }
    return null
  }, [board.columns])

  // Extract plain text from rich editor JSON for card preview (moved to utils/text.js)



  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true)
      if (board.columns.length > 0) {
        setSelectedColumnId(id => id || board.columns[0].id)
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [board.columns])

  // Sync URL with Modal state
  useEffect(() => {
    if (!isMounted) return

    const cardIdFromUrl = searchParams.get('card')
    if (cardIdFromUrl) {
      const card = findCardById(cardIdFromUrl)
      if (card) {
        // Only update if it's a different card to avoid double-triggering
        if (!editingCard || (editingCard.displayId || editingCard.id) !== cardIdFromUrl) {
          setEditingCard(card)
          setEditForm({ 
            title: card.title, 
            description: card.description || '',
            assigneeId: card.assigneeId || null
          })
          setShowDeleteConfirm(false)
          
          if (card.columnId !== selectedColumnId) {
            setSelectedColumnId(card.columnId)
          }
        }
      } else {
        // If card ID in URL is invalid, clear it
        setEditingCard(null)
      }
    } else if (editingCard) {
      setEditingCard(null)
      setShowDeleteConfirm(false)
      setIsAssigneeOpen(false)
    }
  }, [searchParams, isMounted, findCardById, selectedColumnId, editingCard])

  const openEditModal = useCallback((card) => {
    // Only update URL, the useEffect above will handle the state update
    router.push(`${pathname}?card=${card.displayId || card.id}`, { scroll: false })
  }, [pathname, router])

  const closeEditModal = useCallback(() => {
    // Only update URL, the useEffect will handle the state cleanup
    router.push(pathname, { scroll: false })
  }, [pathname, router])

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

      // Save previous state for rollback
      const previousBoard = { ...board }
      setBoard({ ...board, columns: newColumns })

      // Call server action
      try {
        const res = await updateCardOrder(updatedCards)
        if (res.error) {
          throw new Error(res.error)
        }
      } catch (error) {
        console.error("Failed to update card order:", error)
        toast.error("Không thể lưu vị trí thẻ. Đang hoàn tác...")
        setBoard(previousBoard)
      }
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

    // Save previous state for rollback
    const previousBoard = { ...board }
    setBoard({ ...board, columns: newColumns })

    // Update server
    try {
      const res = await updateCardOrder([...updatedSourceCards, ...updatedDestCards])
      if (res.error) {
        throw new Error(res.error)
      }
    } catch (error) {
      console.error("Failed to update card order:", error)
      toast.error("Không thể lưu vị trí thẻ. Đang hoàn tác...")
      setBoard(previousBoard)
    }
  }

  const handleAddCard = async (columnId) => {
    if (!newCardTitle.trim()) {
      setIsAddingCardTo(null)
      return
    }

    const tempId = `temp-${Date.now()}`
    const placeholderCard = {
      id: tempId,
      title: newCardTitle,
      description: '',
      displayId: 'NEW',
      order: 9999,
      columnId,
      assigneeId: null,
      isPlaceholder: true
    }

    // Save previous state for rollback
    const previousBoard = { ...board }
    
    // Add placeholder immediately
    const newColumns = board.columns.map(col => {
      if (col.id === columnId) {
        return { ...col, cards: [...col.cards, placeholderCard] }
      }
      return col
    })
    
    setBoard({ ...board, columns: newColumns })
    const titleToSave = newCardTitle
    setNewCardTitle('')
    setIsAddingCardTo(null)

    // Call server API
    try {
      const res = await createCard({
        title: titleToSave,
        columnId
      })

      if (res.success) {
        // Replace placeholder with real card
        setBoard(currentBoard => ({
          ...currentBoard,
          columns: currentBoard.columns.map(col => {
            if (col.id === columnId) {
              return {
                ...col,
                cards: col.cards.map(c => c.id === tempId ? res.card : c)
              }
            }
            return col
          })
        }))
      } else {
        throw new Error(res.error)
      }
    } catch (error) {
      console.error("Failed to create card:", error)
      toast.error("Không thể tạo thẻ. Đang hoàn tác...")
      setBoard(previousBoard)
    }
  }

  const handleKeyDown = (e, columnId) => {
    if (e.key === 'Enter') {
      handleAddCard(columnId)
    } else if (e.key === 'Escape') {
      setIsAddingCardTo(null)
      setNewCardTitle('')
    }
  }



  const handleSaveCard = async () => {
    if (!editForm.title.trim() || !editingCard) return

    setIsSaving(true)
    try {
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
        closeEditModal()
      } else {
        toast.error(res.error || 'Lỗi khi lưu thay đổi')
      }
    } catch (error) {
      toast.error('Đã xảy ra lỗi không xác định')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteCard = () => {
    setShowDeleteConfirm(true)
  }

  const executeDeleteCard = async () => {
    if (!editingCard) return
    
    setIsSaving(true)
    try {
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
    } catch (error) {
      toast.error('Đã xảy ra lỗi khi xóa thẻ')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden">
      <BoardHeader 
        boardTitle={board.title}
        columns={board.columns}
        selectedColumnId={selectedColumnId}
        setSelectedColumnId={setSelectedColumnId}
        users={users}
      />
      
      <div className="flex-1 relative overflow-hidden h-full">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex items-start p-6 h-full overflow-x-auto gap-4 scroll-smooth">
            {board.columns.map((column, colIndex) => (
              <KanbanColumn
                key={column.id}
                column={column}
                colIndex={colIndex}
                isSelectedOnMobile={selectedColumnId === column.id}
                isAddingCardTo={isAddingCardTo}
                setIsAddingCardTo={setIsAddingCardTo}
                newCardTitle={newCardTitle}
                setNewCardTitle={setNewCardTitle}
                handleAddCard={handleAddCard}
                handleKeyDown={handleKeyDown}
                renderCard={(card, index) => (
                  <KanbanCard 
                    key={card.id} 
                    card={card} 
                    index={index} 
                    openEditModal={openEditModal} 
                  />
                )}
              />
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Modals & Overlays */}
      {isMounted && createPortal(
        <>
          <AnimatePresence>
            {editingCard && (
              <CardEditModal 
                editingCard={editingCard}
                editForm={editForm}
                setEditForm={setEditForm}
                closeEditModal={closeEditModal}
                isAssigneeOpen={isAssigneeOpen}
                setIsAssigneeOpen={setIsAssigneeOpen}
                users={users}
                handleDeleteCard={handleDeleteCard}
                handleSaveCard={handleSaveCard}
                showDeleteConfirm={showDeleteConfirm}
                setShowDeleteConfirm={setShowDeleteConfirm}
                executeDeleteCard={executeDeleteCard}
                isSaving={isSaving}
                currentUser={currentUser}
              />
            )}
          </AnimatePresence>
        </>,
        document.body
      )}
    </div>
  )
}
