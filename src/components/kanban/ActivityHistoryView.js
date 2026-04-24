'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ClockIcon } from '../icons'
import { UserAvatar } from '../ui'

export default function ActivityHistoryView({ historyLogs }) {
  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border-subtle bg-white">
        <h1 className="text-2xl font-bold text-text-main">Lịch sử hoạt động</h1>
        <p className="text-sm text-text-muted mt-1">Danh sách các hoạt động gần đây của dự án</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/20 p-8">
        <div className="max-w-4xl mx-auto">
          {historyLogs.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-xl border border-dashed border-border-subtle">
              <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-300">
                <ClockIcon size={32} />
              </div>
              <p className="text-text-main font-bold text-lg mb-1">Chưa có hoạt động nào</p>
              <p className="text-text-muted text-sm">Các thay đổi trong dự án sẽ xuất hiện tại đây</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-border-subtle shadow-sm overflow-hidden">
              <ul className="divide-y divide-gray-100 m-0 p-0 list-none">
                {historyLogs.map((log, i) => (
                  <motion.li 
                    key={log.id} 
                    className="p-6 flex gap-4 hover:bg-gray-50/50 transition-colors group"
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: i * 0.02 }}
                  >
                    <UserAvatar 
                      name={log.user.name || log.user.username} 
                      image={log.user.image}
                      size="sm" 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] text-text-main leading-snug">
                        <span className="font-bold text-[#172B4D]">{log.user.name || log.user.username}</span>{' '}
                        <span className="text-text-muted">{log.action}</span>{' '}
                        <span className="font-bold text-[#172B4D] break-words">{log.entityTitle}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
                        <div className="text-xs font-medium text-text-muted uppercase tracking-wider">
                          {new Date(log.createdAt).toLocaleString('vi-VN', { 
                            dateStyle: 'medium', 
                            timeStyle: 'short' 
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="py-10 text-center">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest opacity-50">
              Kết thúc lịch sử hoạt động
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
