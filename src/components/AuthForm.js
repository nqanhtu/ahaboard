'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { register } from '@/actions/auth'
import { signIn } from 'next-auth/react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

export default function AuthForm({ type }) {
  const isLogin = type === 'login'
  const router = useRouter()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pending, setPending] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setPending(true)
    setError('')
    setSuccess('')

    const formData = new FormData(e.currentTarget)

    if (isLogin) {
      try {
        const username = formData.get('username')
        const password = formData.get('password')
        
        const res = await signIn('credentials', {
          username,
          password,
          redirect: false,
        })
        
        if (res?.error) {
          const errMsg = 'Sai tên đăng nhập hoặc mật khẩu.'
          setError(errMsg)
          toast.error(errMsg)
        } else if (res?.ok) {
          toast.success('Đăng nhập thành công!')
          router.push('/')
          router.refresh()
        }
      } catch (err) {
        const errMsg = 'Đã có lỗi xảy ra.'
        setError(errMsg)
        toast.error(errMsg)
      }
    } else {
      const res = await register(formData)
      if (res?.error) {
        setError(res.error)
        toast.error(res.error)
      } else {
        setSuccess(res.success)
        toast.success(res.success)
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      }
    }
    
    setPending(false)
  }

  if (!isMounted) return <div className="min-h-screen" />

  return (
    <div className="flex justify-center items-center min-h-screen p-4 bg-green-50/20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white p-10 md:p-12 rounded-[2.5rem] shadow-xl w-full max-w-[460px] text-center border border-green-900/5 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-green-500" />
        
        <div className="flex justify-center mb-8">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-20 h-20 bg-green-50 rounded-[2rem] flex items-center justify-center text-green-500 shadow-sm border border-green-100"
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </motion.div>
        </div>
        
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
          {isLogin ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}
        </h1>
        <p className="text-gray-500 mb-8 font-medium">
          {isLogin ? 'Đăng nhập để tiếp tục quản lý công việc' : 'Bắt đầu hành trình tối ưu năng suất cùng Aha Kanban'}
        </p>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm font-semibold border border-red-100 flex items-center gap-3"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            {error}
          </motion.div>
        )}
        
        {success && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 text-green-700 p-4 rounded-2xl mb-6 text-sm font-semibold border border-green-100 flex items-center gap-3"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            {success}
          </motion.div>
        )}
        
        <form className="flex flex-col gap-5 text-left" method="POST" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="text-sm font-bold text-gray-700 mb-2 block ml-1">Tên đăng nhập</label>
            <input 
              className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all placeholder:text-gray-400" 
              id="username" 
              name="username" 
              type="text" 
              placeholder="nhap_ten_cua_ban"
              required 
            />
          </div>
          
          {!isLogin && (
            <div>
              <label htmlFor="name" className="text-sm font-bold text-gray-700 mb-2 block ml-1">Họ và tên</label>
              <input 
                className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all placeholder:text-gray-400" 
                id="name" 
                name="name" 
                type="text" 
                placeholder="Nguyễn Văn A"
                required={!isLogin} 
              />
            </div>
          )}
          
          <div>
            <label htmlFor="password" className="text-sm font-bold text-gray-700 mb-2 block ml-1">Mật khẩu</label>
            <input 
              className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all placeholder:text-gray-400" 
              id="password" 
              name="password" 
              type="password" 
              placeholder="••••••••"
              required 
            />
          </div>
          
          <button 
            className="bg-green-500 hover:bg-green-600 text-white w-full py-4 rounded-2xl font-bold transition-all shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 mt-4 flex items-center justify-center gap-2" 
            type="submit" 
            disabled={pending}
          >
            {pending && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {pending ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập ngay' : 'Đăng ký tài khoản')}
          </button>
        </form>
        
        <div className="mt-10 text-sm text-gray-500 font-semibold bg-gray-50 py-4 rounded-2xl">
          {isLogin ? (
            <p>
              Chưa có tài khoản?{' '}
              <Link href="/register" className="text-green-600 font-bold hover:text-green-700 transition-colors">Tham gia ngay</Link>
            </p>
          ) : (
            <p>
              Đã có tài khoản?{' '}
              <Link href="/login" className="text-green-600 font-bold hover:text-green-700 transition-colors">Đăng nhập</Link>
            </p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
