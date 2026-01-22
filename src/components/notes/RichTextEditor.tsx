'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';

interface RichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
}

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
    const [uploading, setUploading] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Image.configure({
                HTMLAttributes: {
                    class: 'max-w-full h-auto rounded-lg my-2',
                },
            }),
        ],
        content: content,
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none p-4 min-h-[200px] focus:outline-none',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    // Update editor content when prop changes
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    const handleImageUpload = useCallback(async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';

        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('รูปภาพต้องมีขนาดไม่เกิน 5MB');
                return;
            }

            setUploading(true);
            try {
                // Convert to base64
                const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                });

                // Upload to server
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        data: base64,
                        fileName: file.name,
                        type: 'image',
                    }),
                });

                const result = await response.json();

                if (result.success && result.url) {
                    editor?.chain().focus().setImage({ src: result.url }).run();
                    toast.success('อัพโหลดรูปสำเร็จ!');
                } else {
                    throw new Error(result.error || 'Upload failed');
                }
            } catch (error) {
                console.error('Upload error:', error);
                toast.error('อัพโหลดรูปไม่สำเร็จ');
            } finally {
                setUploading(false);
            }
        };

        input.click();
    }, [editor]);

    if (!editor) {
        return <div className="p-4 text-gray-400">Loading editor...</div>;
    }

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
                    title="Bold"
                >
                    <Bold className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
                    title="Italic"
                >
                    <Italic className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}`}
                    title="Heading 1"
                >
                    <Heading1 className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
                    title="Heading 2"
                >
                    <Heading2 className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
                    title="Bullet List"
                >
                    <List className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
                    title="Numbered List"
                >
                    <ListOrdered className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <button
                    type="button"
                    onClick={handleImageUpload}
                    disabled={uploading}
                    className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 flex items-center gap-1"
                    title="Insert Image"
                >
                    {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <ImageIcon className="w-4 h-4" />
                    )}
                    <span className="text-xs">รูปภาพ</span>
                </button>
            </div>

            {/* Editor Content */}
            <EditorContent editor={editor} />

            {/* Placeholder */}
            {editor.isEmpty && placeholder && (
                <div className="absolute top-12 left-4 text-gray-400 pointer-events-none">
                    {placeholder}
                </div>
            )}
        </div>
    );
}
