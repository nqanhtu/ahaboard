'use client'

import React from 'react'
import { Droppable } from '@hello-pangea/dnd'
import { motion } from 'framer-motion'
import { PlusIcon } from './icons'

export default function KanbanColumn({ 
  column, 
  colIndex, 
  isSelectedOnMobile, 
  isAddingCardTo, 
  setIsAddingCardTo, 
  newCardTitle, 
  setNewCardTitle, 
  handleAddCard, 
  handleKeyDown,
  renderCard
}) {
  return (
    <div 
      className={`w-full md:w-[280px] md:min-w-[280px] max-h-full flex flex-col bg-bg-sidebar rounded-md transition-all duration-300 ${isSelectedOnMobile ? 'flex' : 'hidden md:flex'}`}
    >
      {/* Column Header */}
      <div className="flex items-center gap-2 px-3 py-3 font-bold text-text-muted text-[11px] uppercase tracking-wider">
        <span className="truncate">{column.title}</span>
        <span>{column.cards.length}</span>
      </div>
      
      {/* Cards Area */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div 
            className={`flex-1 overflow-y-auto px-2 py-1 min-h-[100px] transition-colors ${snapshot.isDraggingOver ? 'bg-gray-200/50' : ''}`}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {column.cards.map((card, index) => renderCard(card, index))}
            {provided.placeholder}

            {/* Inline Add Card */}
            {isAddingCardTo === column.id ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-2 mb-4 px-1">
                <textarea
                  autoFocus
                  className="w-full min-h-[80px] p-3 rounded border-2 border-primary bg-white text-text-main focus:outline-none transition-all resize-none shadow-sm mb-2 text-sm font-medium"
                  placeholder="Công việc cần làm..."
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, column.id)}
                  onBlur={() => handleAddCard(column.id)}
                />
                <div className="flex gap-2">
                  <button 
                    className="bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded text-sm font-bold transition-all shadow-sm"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      handleAddCard(column.id)
                    }}
                  >
                    Thêm
                  </button>
                  <button 
                    className="text-text-muted hover:text-text-main px-3 py-1.5 rounded text-sm font-bold transition-all"
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
              <button 
                className="w-full text-left p-2 mt-1 text-text-muted hover:bg-gray-200/80 rounded flex items-center gap-2 font-bold transition-all text-sm mb-10" 
                onClick={() => setIsAddingCardTo(column.id)}
              >
                <PlusIcon size={14} strokeWidth={3} />
                <span>Tạo công việc</span>
              </button>
            )}
          </div>
        )}
      </Droppable>
    </div>
  )
}
