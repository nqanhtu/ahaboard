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
  const bgColors = ['bg-pink-50', 'bg-orange-50', 'bg-blue-50', 'bg-purple-50']
  const dotColors = ['bg-pink-500', 'bg-orange-500', 'bg-blue-500', 'bg-purple-500']
  const colBg = bgColors[colIndex % 4]
  const dotBg = dotColors[colIndex % 4]

  return (
    <div 
      className={`w-full md:w-[340px] md:min-w-[340px] max-h-full flex flex-col rounded-[2rem] md:rounded-3xl ${colBg} border border-black/5 shadow-sm transition-all duration-300 ${isSelectedOnMobile ? 'flex' : 'hidden md:flex'}`}
    >
      {/* Column Header */}
      <div className="flex items-center gap-3 px-6 py-5 font-extrabold text-gray-900 border-b border-black/[0.03]">
        <div className={`w-3 h-3 rounded-full ${dotBg} shadow-sm`} />
        <span className="truncate">{column.title}</span>
        <span className="ml-auto text-xs font-bold text-gray-500 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm border border-black/[0.02]">
          {column.cards.length}
        </span>
      </div>
      
      {/* Cards Area */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div 
            className="flex-1 overflow-y-auto px-4 py-4 min-h-[100px] scrollbar-thin scrollbar-thumb-black/5 scrollbar-track-transparent"
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {column.cards.map((card, index) => renderCard(card, index))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add Card Footer */}
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
          <button 
            className="w-full text-left p-4 text-gray-500 hover:text-green-700 hover:bg-white/60 rounded-2xl flex items-center gap-3 font-bold transition-all border border-transparent hover:border-green-100 hover:shadow-sm" 
            onClick={() => setIsAddingCardTo(column.id)}
          >
            <div className="w-6 h-6 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center">
              <PlusIcon />
            </div>
            Thêm thẻ mới
          </button>
        )}
      </div>
    </div>
  )
}
