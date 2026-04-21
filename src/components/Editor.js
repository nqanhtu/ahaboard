'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { useRef, useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

async function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Upload thất bại');
  }

  const data = await res.json();
  return data.url;
}

function MenuBar({ editor, onUploadImage, isUploading }) {
  if (!editor) return null;

  const btnClass = (isActive) => `px-2.5 py-1.5 rounded-lg text-sm font-semibold cursor-pointer transition-all ${isActive ? 'bg-green-500 text-white shadow-sm' : 'bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`;

  return (
    <div className="flex gap-1 flex-wrap pb-3 border-b border-gray-100 mb-3">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))} title="In đậm">
        <strong>B</strong>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))} title="In nghiêng">
        <em>I</em>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btnClass(editor.isActive('strike'))} title="Gạch ngang">
        <s>S</s>
      </button>

      <div className="w-[1px] bg-gray-200 mx-1" />

      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive('heading', { level: 2 }))} title="Tiêu đề 2">
        H2
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btnClass(editor.isActive('heading', { level: 3 }))} title="Tiêu đề 3">
        H3
      </button>

      <div className="w-[1px] bg-gray-200 mx-1" />

      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))} title="Danh sách dấu chấm">
        • List
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))} title="Danh sách số">
        1. List
      </button>

      <div className="w-[1px] bg-gray-200 mx-1" />

      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive('blockquote'))} title="Trích dẫn">
        ❝ Quote
      </button>

      <div className="w-[1px] bg-gray-200 mx-1" />

      <button type="button" onClick={onUploadImage} disabled={isUploading} className={`${btnClass(false)} ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`} title="Thêm ảnh">
        {isUploading ? (
          <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
        )}
      </button>
    </div>
  );
}

export default function Editor({ value, onChange }) {
  const fileInputRef = useRef(null);
  const editorRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  const insertImage = useCallback(async (file) => {
    const ed = editorRef.current;
    if (!ed) return;
    
    setIsUploading(true);
    const toastId = toast.loading('Đang tải ảnh lên...');
    
    try {
      const url = await uploadImage(file);
      ed.chain().focus().setImage({ src: url }).run();
      toast.success('Đã tải ảnh lên thành công', { id: toastId });
    } catch (err) {
      toast.error(err.message || 'Lỗi khi upload ảnh', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
    ],
    content: parseContent(value),
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()));
    },
    editorProps: {
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (const item of items) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) insertImage(file);
            return true;
          }
        }
        return false;
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;

        const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (imageFiles.length === 0) return false;

        event.preventDefault();
        imageFiles.forEach(file => insertImage(file));
        return true;
      },
    },
  });

  // Keep editorRef in sync
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        insertImage(file);
      }
    });

    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  return (
    <div className="tiptap-editor min-h-[200px]">
      <MenuBar editor={editor} onUploadImage={handleUploadClick} isUploading={isUploading} />
      <EditorContent editor={editor} className={`text-gray-800 transition-opacity ${isUploading ? 'opacity-60' : 'opacity-100'}`} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

function parseContent(value) {
  if (!value) return '<p></p>';
  try {
    const data = typeof value === 'string' ? JSON.parse(value) : value;
    // If it's Editor.js format (has "blocks" array), convert to HTML
    if (data.blocks) {
      return data.blocks.map(block => {
        switch (block.type) {
          case 'paragraph': return `<p>${block.data.text || ''}</p>`;
          case 'header': return `<h${block.data.level || 2}>${block.data.text || ''}</h${block.data.level || 2}>`;
          case 'list': {
            const tag = block.data.style === 'ordered' ? 'ol' : 'ul';
            const items = (block.data.items || []).map(item => `<li>${item}</li>`).join('');
            return `<${tag}>${items}</${tag}>`;
          }
          default: return `<p>${block.data?.text || ''}</p>`;
        }
      }).join('');
    }
    // If it's Tiptap JSON format, return as-is (useEditor will handle it)
    if (data.type === 'doc') return data;
    return '<p></p>';
  } catch (e) {
    // Plain text fallback
    return `<p>${value}</p>`;
  }
}
