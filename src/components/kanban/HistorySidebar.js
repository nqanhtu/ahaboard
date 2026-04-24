'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ModalOverlay, ModalPanel, UserAvatar } from '../ui'
import { CloseIcon, ClockIcon } from '../icons'

export default function HistorySidebar({
  showHistory,
  setShowHistory,
  loadingHistory,
  historyLogs
}) {
  return (
    <AnimatePresence>
      {showHistory && (
        <ModalOverlay onClose={() => setShowHistory(false)} className="pt-24">
          <ModalPanel className="max-w-[500px] max-h-[80vh]">
            <div className="flex justify-between items-center p-6 px-8 border-b border-gray-50 bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1">Lịch sử hoạt động</h3>
                <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Recent Activity Logs</p>
              </div>
              <button 
                className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2.5 rounded-full transition-all active:scale-90" 
                onClick={() => setShowHistory(false)}
              >
                <CloseIcon size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30">
              {loadingHistory ? (
                <div className="p-8 space-y-6">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="flex gap-4 animate-pulse">
                      <div className="w-11 h-11 rounded-2xl bg-gray-200 shrink-0" />
                      <div className="flex-1 space-y-3 py-1">
                        <div className="h-4 bg-gray-200 rounded-full w-3/4" />
                        <div className="h-3 bg-gray-100 rounded-full w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : historyLogs.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-[2rem] bg-white shadow-xl flex items-center justify-center text-gray-300">
                    <ClockIcon size={32} />
                  </div>
                  <p className="text-gray-500 font-black text-lg tracking-tight mb-1">Chưa có hoạt động nào</p>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Everything is quiet here</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100 m-0 p-0 list-none">
                  {historyLogs.map((log, i) => (
                    <motion.li 
                      key={log.id} 
                      className="p-6 px-8 flex gap-4 hover:bg-white transition-colors group"
                      initial={{ opacity: 0, x: -12 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      transition={{ delay: i * 0.04 }}
                    >
                      <UserAvatar 
                        name={log.user.name || log.user.username} 
                        image={log.user.image}
                        size="sm" 
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] text-gray-700 leading-snug">
                          <span className="font-black text-gray-900">{log.user.name || log.user.username}</span>{' '}
                          <span className="text-gray-500 font-medium">{log.action}</span>{' '}
                          <span className="font-black text-gray-900 break-words">{log.entityTitle}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-1 h-1 rounded-full bg-green-500/40" />
                          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                            {new Date(log.createdAt).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })}
                          </div>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="p-4 bg-white border-t border-gray-50 text-center">
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">End of activity history</span>
            </div>
          </ModalPanel>
        </ModalOverlay>
      )}
    </AnimatePresence>
  )
}
