'use client'

import React from 'react'
import { ClockIcon, ChevronDownIcon } from '../icons'
import { UserAvatar } from '../ui'

export default function BoardHeader({ boardTitle, columns, selectedColumnId, setSelectedColumnId, users = [] }) {
  return (
    <div className="flex flex-col px-6 py-4 gap-4 shrink-0 bg-white border-b border-border-subtle">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[12px] text-text-muted font-medium">
        <span>Dự án</span>
        <span>/</span>
        <span>{boardTitle}</span>
      </div>

      {/* Title & Actions */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-main">Bảng công việc</h1>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <input 
              type="text" 
              placeholder="Tìm kiếm trong bảng..." 
              className="bg-gray-50 border border-border-subtle h-8 w-40 rounded px-9 text-sm focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Avatars */}
          <div className="flex -space-x-2 overflow-hidden">
            {users.slice(0, 4).map((user) => (
              <div key={user.id} className="ring-2 ring-white rounded-full">
                <UserAvatar 
                  name={user.name || user.username} 
                  image={user.image}
                  size="sm" 
                />
              </div>
            ))}
            {users.length > 4 && (
              <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-text-muted z-10">
                +{users.length - 4}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-text-muted font-medium">
             <span className="text-[11px] font-bold">NHÓM THEO</span>
             <button className="flex items-center gap-1 px-2 h-8 bg-gray-100 hover:bg-gray-200 rounded text-text-main transition-colors text-xs font-bold">
               Không <ChevronDownIcon size={10} />
             </button>
          </div>
        </div>
      </div>

      {/* Mobile Column Selector (styled for Jira) */}
      <div className="flex md:hidden bg-gray-100 p-1 rounded-lg gap-1 overflow-x-auto no-scrollbar mt-2">
        {columns.map((column) => (
          <button
            key={column.id}
            onClick={() => setSelectedColumnId(column.id)}
            className={`flex-1 min-w-[100px] py-2 px-3 rounded-md text-xs font-bold whitespace-nowrap transition-all ${
              selectedColumnId === column.id
                ? 'bg-white text-primary shadow-sm'
                : 'text-text-muted hover:bg-white/50'
            }`}
          >
            {column.title} ({column.cards.length})
          </button>
        ))}
      </div>
    </div>
  )
}
