'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { useRef, useCallback, useEffect } from 'react';

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

function MenuBar({ editor, onUploadImage }) {
  if (!editor) return null;

  const btnStyle = (isActive) => ({
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    background: isActive ? 'var(--primary)' : 'transparent',
    color: isActive ? 'var(--primary-text)' : 'var(--text-secondary)',
    transition: 'all 0.15s ease',
  });

  return (
    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', paddingBottom: '12px', borderBottom: '1px solid rgba(0,0,0,0.06)', marginBottom: '12px' }}>
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} style={btnStyle(editor.isActive('bold'))}>
        <strong>B</strong>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} style={btnStyle(editor.isActive('italic'))}>
        <em>I</em>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} style={btnStyle(editor.isActive('strike'))}>
        <s>S</s>
      </button>

      <div style={{ width: '1px', background: 'rgba(0,0,0,0.1)', margin: '0 4px' }} />

      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} style={btnStyle(editor.isActive('heading', { level: 2 }))}>
        H2
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} style={btnStyle(editor.isActive('heading', { level: 3 }))}>
        H3
      </button>

      <div style={{ width: '1px', background: 'rgba(0,0,0,0.1)', margin: '0 4px' }} />

      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} style={btnStyle(editor.isActive('bulletList'))}>
        • List
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} style={btnStyle(editor.isActive('orderedList'))}>
        1. List
      </button>

      <div style={{ width: '1px', background: 'rgba(0,0,0,0.1)', margin: '0 4px' }} />

      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} style={btnStyle(editor.isActive('blockquote'))}>
        ❝ Quote
      </button>

      <div style={{ width: '1px', background: 'rgba(0,0,0,0.1)', margin: '0 4px' }} />

      <button type="button" onClick={onUploadImage} style={btnStyle(false)} title="Thêm ảnh">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
      </button>
    </div>
  );
}

export default function Editor({ value, onChange }) {
  const fileInputRef = useRef(null);
  const editorRef = useRef(null);

  const insertImage = useCallback(async (file) => {
    const ed = editorRef.current;
    if (!ed) return;
    try {
      const url = await uploadImage(file);
      ed.chain().focus().setImage({ src: url }).run();
    } catch (err) {
      alert(err.message || 'Lỗi khi upload ảnh');
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
    <div className="tiptap-editor" style={{ 
      background: '#ffffff', 
      border: '1px solid rgba(0,0,0,0.1)', 
      borderRadius: '12px', 
      padding: '16px',
      minHeight: '200px'
    }}>
      <MenuBar editor={editor} onUploadImage={handleUploadClick} />
      <EditorContent editor={editor} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
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
