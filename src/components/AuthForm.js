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
          const errMsg = 'Invalid username or password.'
          setError(errMsg)
          toast.error(errMsg)
        } else if (res?.ok) {
          toast.success('Logged in successfully!')
          router.push('/')
          router.refresh()
        }
      } catch (err) {
        const errMsg = 'Something went wrong.'
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

  if (!isMounted) return <div className="min-h-screen bg-white" />

  return (
    <div className="flex flex-col justify-center items-center min-h-screen p-4 bg-[#F4F5F7]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-10 rounded shadow-[0_8px_24px_rgba(149,157,165,0.2)] w-full max-w-[400px] border border-border-subtle"
      >
        <div className="flex flex-col items-center mb-8">
           <svg width="40" height="40" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="mb-4">
              <rect width="32" height="32" rx="8" fill="#0052CC"/>
              <rect x="6" y="7" width="5" height="18" rx="1.5" fill="white" opacity="0.95"/>
              <rect x="13.5" y="7" width="5" height="12" rx="1.5" fill="white" opacity="0.95"/>
              <rect x="21" y="7" width="5" height="15" rx="1.5" fill="white" opacity="0.95"/>
          </svg>
          <h1 className="text-xl font-bold text-[#172B4D]">
            {isLogin ? 'Đăng nhập để tiếp tục' : 'Tạo tài khoản mới'}
          </h1>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded text-sm font-medium border border-red-100 flex items-center gap-2 mb-6">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 text-green-700 p-3 rounded text-sm font-medium border border-green-100 flex items-center gap-2 mb-6">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            {success}
          </div>
        )}
        
        <form className="flex flex-col gap-4" method="POST" onSubmit={handleSubmit}>
          <input 
            className="w-full px-3 py-2 rounded border-2 border-[#DFE1E6] bg-[#FAFBFC] text-text-main text-sm focus:bg-white focus:outline-none focus:border-primary transition-all placeholder:text-gray-400" 
            id="username" 
            name="username" 
            type="text" 
            placeholder="Tên đăng nhập"
            required 
          />
          
          {!isLogin && (
            <input 
              className="w-full px-3 py-2 rounded border-2 border-[#DFE1E6] bg-[#FAFBFC] text-text-main text-sm focus:bg-white focus:outline-none focus:border-primary transition-all placeholder:text-gray-400" 
              id="name" 
              name="name" 
              type="text" 
              placeholder="Họ và tên"
              required={!isLogin} 
            />
          )}
          
          <input 
            className="w-full px-3 py-2 rounded border-2 border-[#DFE1E6] bg-[#FAFBFC] text-text-main text-sm focus:bg-white focus:outline-none focus:border-primary transition-all placeholder:text-gray-400" 
            id="password" 
            name="password" 
            type="password" 
            placeholder="Mật khẩu"
            required 
          />
          
          <button 
            className="bg-primary hover:bg-primary-hover text-white w-full py-2 rounded font-bold transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2" 
            type="submit" 
            disabled={pending}
          >
            {pending && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {pending ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập' : 'Đăng ký')}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border-subtle text-center">
          {isLogin ? (
            <Link href="/register" className="text-primary text-sm font-medium hover:underline">
              Chưa có tài khoản? Đăng ký ngay
            </Link>
          ) : (
            <Link href="/login" className="text-primary text-sm font-medium hover:underline">
              Đã có tài khoản? Đăng nhập
            </Link>
          )}
        </div>
      </motion.div>

      <div className="mt-8 text-center text-xs text-text-muted">
        <p>© 2026 Aha Kanban</p>
      </div>
    </div>
  )
}
