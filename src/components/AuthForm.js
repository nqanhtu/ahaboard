'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { register } from '@/actions/auth'
import { signIn } from 'next-auth/react'

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
          setError('Sai tên đăng nhập hoặc mật khẩu.')
        } else if (res?.ok) {
          router.push('/')
          router.refresh()
        }
      } catch (err) {
        setError('Đã có lỗi xảy ra.')
      }
    } else {
      const res = await register(formData)
      if (res?.error) {
        setError(res.error)
      } else {
        setSuccess(res.success)
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      }
    }
    
    setPending(false)
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>{isLogin ? 'Đăng nhập vào Aha Kanban' : 'Đăng ký tài khoản'}</h1>
        
        {error && <div className="error-msg">{error}</div>}
        {success && <div className="success-msg">{success}</div>}
        
        <form className="auth-form" method="POST" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username">Tên đăng nhập</label>
            <input 
              className="input-field" 
              id="username" 
              name="username" 
              type="text" 
              required 
            />
          </div>
          
          {!isLogin && (
            <div>
              <label htmlFor="name">Họ và tên</label>
              <input 
                className="input-field" 
                id="name" 
                name="name" 
                type="text" 
                required={!isLogin} 
              />
            </div>
          )}
          
          <div>
            <label htmlFor="password">Mật khẩu</label>
            <input 
              className="input-field" 
              id="password" 
              name="password" 
              type="password" 
              required 
            />
          </div>
          
          <button className="btn btn-primary" type="submit" disabled={!isMounted || pending} style={{ marginTop: '8px' }}>
            {pending ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập' : 'Đăng ký')}
          </button>
        </form>
        
        <div className="auth-switch">
          {isLogin ? (
            <p>
              Chưa có tài khoản?{' '}
              <Link href="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Đăng ký ngay</Link>
            </p>
          ) : (
            <p>
              Đã có tài khoản?{' '}
              <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Đăng nhập</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
