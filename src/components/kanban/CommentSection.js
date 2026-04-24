'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { UserAvatar } from '../ui'
import { TrashIcon } from '../icons'
import { addComment, deleteComment, getComments } from '@/actions/comments'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import dynamic from 'next/dynamic'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'

const Editor = dynamic(() => import('@/components/Editor'), { 
  ssr: false,
  loading: () => <div className="p-4 border border-black/5 rounded-xl min-h-[100px] bg-gray-50/50 animate-pulse">Đang tải trình soạn thảo...</div>
})

// Simple viewer for Tiptap JSON content
function RichTextViewer({ content }) {
  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: parseJSON(content),
    editable: false,
    immediatelyRender: false,
  })

  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(parseJSON(content))
    }
  }, [content, editor])

  return <EditorContent editor={editor} className="prose prose-sm max-w-none text-gray-700" />
}

function parseJSON(val) {
  try {
    return JSON.parse(val)
  } catch (e) {
    return `<p>${val}</p>`
  }
}

export default function CommentSection({ cardId, currentUser }) {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const fetchComments = useCallback(async () => {
    setIsLoading(true)
    const res = await getComments(cardId)
    if (res.success) {
      setComments(res.comments)
    }
    setIsLoading(false)
  }, [cardId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleSubmit = async () => {
    if (!newComment || newComment === '<p></p>' || newComment === '{"type":"doc","content":[{"type":"paragraph"}]}') {
      return
    }

    setIsSubmitting(true)
    const res = await addComment(cardId, newComment)
    if (res.success) {
      setComments([...comments, res.comment])
      setNewComment('')
      toast.success('Đã thêm bình luận')
    } else {
      toast.error(res.error || 'Lỗi khi thêm bình luận')
    }
    setIsSubmitting(false)
  }

  const handleDelete = async (id) => {
    const res = await deleteComment(id)
    if (res.success) {
      setComments(comments.filter(c => c.id !== id))
      toast.success('Đã xóa bình luận')
    } else {
      toast.error(res.error || 'Lỗi khi xóa bình luận')
    }
  }

  return (
    <div className="mt-6 pt-6">
      <h3 className="text-sm font-bold text-text-main mb-4">Bình luận ({comments.length})</h3>
      
      {/* New Comment Input */}
      <div className="flex gap-3 mb-8">
        <UserAvatar 
          name={currentUser?.name || currentUser?.username} 
          image={currentUser?.image}
          size="sm" 
        />
        <div className="flex-1 flex flex-col gap-2">
          <div className="rounded border-2 border-transparent hover:border-border-subtle focus-within:border-primary transition-all overflow-hidden bg-white">
            <Editor 
              value={newComment} 
              onChange={setNewComment} 
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !newComment}
              className="bg-primary hover:bg-primary-hover text-white px-4 py-1.5 rounded text-sm font-bold transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Lưu
            </button>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                  <div className="h-10 bg-gray-50 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length > 0 ? (
          comments.map(comment => (
            <div key={comment.id} className="flex gap-3 group">
              <UserAvatar 
                name={comment.user.name || comment.user.username} 
                image={comment.user.image}
                size="sm" 
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm text-text-main">{comment.user.name || comment.user.username}</span>
                  <span className="text-xs text-text-muted">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: vi })}
                  </span>
                </div>
                <div className="text-text-main text-sm">
                  <RichTextViewer content={comment.content} />
                </div>
                {currentUser?.id === comment.userId && (
                  <div className="mt-2 flex gap-3 text-xs font-bold text-text-muted">
                    <button className="hover:underline">Chỉnh sửa</button>
                    <button 
                      onClick={() => handleDelete(comment.id)}
                      className="hover:underline hover:text-red-600"
                    >
                      Xóa
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded border border-dashed border-gray-200">
            <p className="text-text-muted text-sm font-medium">Chưa có bình luận nào.</p>
          </div>
        )}
      </div>
    </div>
  )
}
