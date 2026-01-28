import { useEffect } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    List,
    ListOrdered,
    Heading1,
    Heading2,
    Heading3,
    Link as LinkIcon,
    Image as ImageIcon,
    RotateCcw,
    RotateCw,
    Quote
} from 'lucide-react';
import { uploadImage } from '../../lib/storage';
import { toast } from 'sonner';

interface BlogRichTextEditorProps {
    content: string;
    onChange: (content: string) => void;
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
    if (!editor) return null;

    const addLink = () => {
        const url = window.prompt('URL Girin:');
        if (url) {
            editor.chain().focus().setLink({ href: url }).run();
        }
    };

    const addImage = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async () => {
            if (input.files?.length) {
                const file = input.files[0];
                const toastId = toast.loading('Resim yükleniyor...');
                try {
                    const url = await uploadImage(file);
                    editor.chain().focus().setImage({ src: url }).run();
                    toast.success('Resim yüklendi', { id: toastId });
                } catch {
                    toast.error('Yükleme başarısız', { id: toastId });
                }
            }
        };
        input.click();
    };

    const buttons = [
        { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: 'bold' },
        { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: 'italic' },
        { icon: UnderlineIcon, action: () => editor.chain().focus().toggleUnderline().run(), active: 'underline' },
        { icon: Strikethrough, action: () => editor.chain().focus().toggleStrike().run(), active: 'strike' },
        { icon: Heading1, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: { heading: { level: 1 } } },
        { icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: { heading: { level: 2 } } },
        { icon: Heading3, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: { heading: { level: 3 } } },
        { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), active: 'bulletList' },
        { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), active: 'orderedList' },
        { icon: Quote, action: () => editor.chain().focus().toggleBlockquote().run(), active: 'blockquote' },
        { icon: LinkIcon, action: addLink, active: 'link' },
        { icon: ImageIcon, action: addImage },
        { icon: RotateCcw, action: () => editor.chain().focus().undo().run(), disabled: !editor.can().undo() },
        { icon: RotateCw, action: () => editor.chain().focus().redo().run(), disabled: !editor.can().redo() },
    ];

    return (
        <div className="flex flex-wrap gap-1 p-2 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
            {buttons.map((btn, i) => (
                <button
                    key={i}
                    onClick={(e) => {
                        e.preventDefault();
                        btn.action();
                    }}
                    disabled={btn.disabled}
                    className={`p - 2 rounded - lg transition - colors ${btn.active && editor.isActive(btn.active)
                        ? 'bg-indigo-100 text-indigo-600'
                        : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                        } ${btn.disabled ? 'opacity-30 cursor-not-allowed' : ''} `}
                >
                    <btn.icon className="w-4 h-4" />
                </button>
            ))}
        </div>
    );
};

const BlogRichTextEditor = ({ content, onChange }: BlogRichTextEditorProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-indigo-600 underline cursor-pointer',
                },
            }),
            Image.configure({
                HTMLAttributes: {
                    class: 'rounded-2xl max-w-full h-auto border border-slate-200 my-4',
                },
            }),
        ],
        content: content,
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4 text-slate-800',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    // Content prop değiştiğinde editor'ü güncelle (AI Writer gibi dış müdahaleler için)
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    return (
        <div className="border border-slate-300 rounded-xl overflow-hidden bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            <MenuBar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
};

export default BlogRichTextEditor;
