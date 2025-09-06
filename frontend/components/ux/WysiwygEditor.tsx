import * as React from 'react';
import CloudinaryUpload from '@/components/ux/CloudinaryUpload';

interface WysiwygEditorProps {
  value: string;
  onChange: (html: string) => void;
  className?: string;
  enableImageUpload?: boolean;
}

// Lightweight dependency-free WYSIWYG using contenteditable
export default function WysiwygEditor({ value, onChange, className = '', enableImageUpload = true }: WysiwygEditorProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    // Only set innerHTML when external value changes materially to avoid caret jumps
    const el = ref.current;
    if (el.innerHTML !== value) {
      el.innerHTML = value || '<p></p>';
    }
  }, [value]);

  const exec = (cmd: string, arg?: string) => {
    document.execCommand(cmd, false, arg);
    // Sync content
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const onInput = () => {
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const insertImageAtCaret = (url: string) => {
    // Use execCommand for broad compatibility
    exec('insertImage', url);
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2 mb-2">
        <button type="button" onClick={() => exec('bold')} className="px-2 py-1 border rounded text-sm">B</button>
        <button type="button" onClick={() => exec('italic')} className="px-2 py-1 border rounded text-sm italic">I</button>
        <button type="button" onClick={() => exec('underline')} className="px-2 py-1 border rounded text-sm">U</button>
        <button type="button" onClick={() => exec('insertUnorderedList')} className="px-2 py-1 border rounded text-sm">• List</button>
        <button type="button" onClick={() => exec('insertOrderedList')} className="px-2 py-1 border rounded text-sm">1. List</button>
        <button type="button" onClick={() => exec('formatBlock', '<h3>')} className="px-2 py-1 border rounded text-sm">H3</button>
        <button type="button" onClick={() => exec('formatBlock', '<p>')} className="px-2 py-1 border rounded text-sm">P</button>
        <button type="button" onClick={() => exec('createLink', prompt('Enter URL') || '')} className="px-2 py-1 border rounded text-sm">Link</button>
        <button type="button" onClick={() => insertImageAtCaret(prompt('Enter Image URL') || '')} className="px-2 py-1 border rounded text-sm">Image</button>
        {enableImageUpload && <CloudinaryUpload onUploaded={insertImageAtCaret} buttonText="Upload & Insert" className="inline-block" />}
        <button type="button" onClick={() => exec('removeFormat')} className="px-2 py-1 border rounded text-sm">Clear</button>
      </div>
      <div
        ref={ref}
        onInput={onInput}
        contentEditable
        className="min-h-[220px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
        suppressContentEditableWarning
      />
    </div>
  );
}
