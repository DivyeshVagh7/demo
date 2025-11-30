import React from 'react';
import { Bold, Italic, Strikethrough, Pilcrow, Heading1, Heading2, Heading3, Indent as IndentIcon, Outdent as OutdentIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify, Underline as UnderlineIcon, Minus } from 'lucide-react';

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const ToolButton = ({ onClick, isActive, disabled, title, icon: IconComponent /* eslint-disable-line no-unused-vars */ }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded-lg transition-all duration-200 ${
        isActive 
          ? 'bg-gradient-to-r from-primary to-secondary text-foreground shadow-lg scale-105' 
          : 'text-muted-foreground hover:bg-foreground/10 hover:text-foreground hover:scale-105'
      } disabled:opacity-40 disabled:cursor-not-allowed`}
      title={title}
    >
      <IconComponent className="w-4 h-4" />
    </button>
  );

  const Divider = () => <div className="w-px h-6 bg-border/10 mx-1"></div>;

  return (
    <div className="flex items-center gap-1 p-3 bg-gradient-to-r from-card to-card border-b border-border/10 rounded-t-xl backdrop-blur-xl flex-wrap">
      <ToolButton onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold (Ctrl+B)" icon={Bold} />
      <ToolButton onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic (Ctrl+I)" icon={Italic} />
      <ToolButton onClick={() => editor.chain().focus().toggleUnderline().run()} disabled={!editor.can().chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline (Ctrl+U)" icon={UnderlineIcon} />
      <ToolButton onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough" icon={Strikethrough} />
      <Divider />
      <ToolButton onClick={() => editor.chain().focus().setParagraph().run()} isActive={editor.isActive('paragraph')} title="Paragraph" icon={Pilcrow} />
      <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Heading 1" icon={Heading1} />
      <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Heading 2" icon={Heading2} />
      <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} title="Heading 3" icon={Heading3} />
      <ToolButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule" icon={Minus} />
      <Divider />
      <ToolButton onClick={() => editor.commands.indent()} title="Indent" icon={IndentIcon} />
      <ToolButton onClick={() => editor.commands.outdent()} title="Outdent" icon={OutdentIcon} />
      <Divider />
      <ToolButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Align Left" icon={AlignLeft} />
      <ToolButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Align Center" icon={AlignCenter} />
      <ToolButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Align Right" icon={AlignRight} />
      <ToolButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} title="Align Justify" icon={AlignJustify} />
    </div>
  );
};

export default MenuBar;
