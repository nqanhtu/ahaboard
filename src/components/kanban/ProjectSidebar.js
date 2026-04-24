import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function ProjectSidebar({ activeBoard, currentView = 'board' }) {
  const navGroups = [
    {
      title: 'LẬP KẾ HOẠCH',
      items: [
        { 
          label: 'Bảng công việc', 
          id: 'board',
          icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2', 
          active: currentView === 'board',
          href: `/?boardId=${activeBoard?.id}&view=board`
        },
        { 
          label: 'Lịch sử hoạt động', 
          id: 'history',
          icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', 
          active: currentView === 'history',
          href: `/?boardId=${activeBoard?.id}&view=history`
        },
      ]
    },
  ]

  return (
    <aside className="w-64 bg-bg-sidebar border-r border-border-subtle flex flex-col h-full shrink-0">
      {/* Project Identity */}
      <div className="p-6 flex items-start gap-3 mb-2">
        <div className="w-10 h-10 rounded bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        <div className="flex flex-col min-w-0">
          <h2 className="text-text-main font-bold text-sm truncate leading-tight">{activeBoard?.title || 'Dự án Aha'}</h2>
          <span className="text-text-muted text-[11px] font-medium">Quản lý phần mềm</span>
        </div>
      </div>

      {/* Nav Groups */}
      <div className="flex-1 overflow-y-auto px-3 space-y-8 py-2">
        {navGroups.map((group) => (
          <div key={group.title}>
            <h3 className="px-3 text-[11px] font-bold text-text-muted mb-2 tracking-wider uppercase">{group.title}</h3>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 h-10 rounded cursor-pointer transition-colors ${
                    item.active 
                      ? 'bg-blue-50 text-blue-700 border-l-[3px] border-blue-700 rounded-l-none -ml-3 pl-[11px]' 
                      : 'text-text-main hover:bg-gray-200/60'
                  }`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={item.active ? 'text-blue-700' : 'text-text-muted opacity-80'}>
                    <path d={item.icon} />
                  </svg>
                  <span className={`text-[14px] ${item.active ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer / Context */}
      <div className="p-6 border-t border-border-subtle">
         <p className="text-[10px] text-text-muted leading-relaxed italic opacity-70">
           Dự án được quản lý bởi nhóm. <a href="#" className="text-primary hover:underline not-italic">Tìm hiểu thêm</a>
         </p>
      </div>
    </aside>
  )
}
