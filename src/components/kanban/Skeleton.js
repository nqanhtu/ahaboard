'use client'

import React from 'react'

export function CardSkeleton() {
  return (
    <div className="bg-white p-3 mb-2 border border-gray-200 shadow-sm animate-pulse">
      <div className="h-3 bg-gray-100 rounded w-1/2 mb-3" />
      <div className="h-4 bg-gray-200 rounded w-full mb-4" />
      <div className="flex justify-between items-center mt-4">
        <div className="h-3 bg-gray-100 rounded w-16" />
        <div className="w-6 h-6 bg-gray-100 rounded-full" />
      </div>
    </div>
  )
}

export function ColumnSkeleton() {
  return (
    <div className="w-[280px] shrink-0 h-full flex flex-col bg-[#F4F5F7] rounded-md p-2">
      <div className="flex items-center gap-2 mb-4 px-2 py-1">
        <div className="h-3 bg-gray-300 rounded w-24 animate-pulse" />
        <div className="h-3 bg-gray-200 rounded w-6 animate-pulse" />
      </div>
      
      <div className="space-y-1">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  )
}

export default function BoardSkeleton() {
  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Topbar Skeleton (simplified) */}
      <header className="h-12 px-3 border-b border-gray-200 flex justify-between items-center bg-white">
        <div className="flex items-center gap-4">
           <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
           <div className="h-4 bg-gray-100 rounded w-24 animate-pulse" />
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Skeleton */}
        <aside className="w-64 bg-[#F4F5F7] border-r border-gray-200 p-6 space-y-8 shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gray-200 rounded animate-pulse" />
             <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                <div className="h-2 bg-gray-200 rounded w-16 animate-pulse" />
             </div>
          </div>
          <div className="space-y-4">
             <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
          </div>
        </aside>

        {/* Content Skeleton */}
        <main className="flex-1 flex flex-col overflow-hidden">
           <div className="px-6 py-6 space-y-4">
              <div className="h-3 bg-gray-100 rounded w-32 animate-pulse" />
              <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
              <div className="flex gap-4">
                 <div className="h-8 bg-gray-100 rounded w-40 animate-pulse" />
                 <div className="h-8 bg-gray-100 rounded w-32 animate-pulse" />
              </div>
           </div>
           <div className="flex-1 p-6 flex gap-4 overflow-hidden">
             <ColumnSkeleton />
             <ColumnSkeleton />
             <ColumnSkeleton />
             <ColumnSkeleton />
           </div>
        </main>
      </div>
    </div>
  )
}

