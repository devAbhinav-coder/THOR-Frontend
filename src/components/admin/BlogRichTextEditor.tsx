"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import { FontSize, FONT_SIZE_OPTIONS } from "@/lib/blogEditorFontSize";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  Undo,
  Redo,
  ImageIcon,
  Code2,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
} from "lucide-react";

import { BlogImageMarker } from "./BlogImageMarkerExtension";
import { BLOG_EDITOR_FONTS, BLOG_EDITOR_GOOGLE_FONTS_URL } from "@/lib/blogEditorFonts";
import {
  storageToEditorHtml,
  editorHtmlToStorage,
  normalizeBlogStorageContent,
  applyGalleryPreviewsToEditorHtml,
  type GalleryPreview,
} from "@/lib/blogContentEditor";
import { contentHasImageMarker, contentHasRowMarker, stripImageMarkersForIndices } from "@/lib/blogImageMarkers";
import { addPartnerToImageLine } from "@/lib/blogStoryPlanner";

export type BlogRichTextEditorHandle = {
  insertImage: (index: number) => void;
  insertRow: (a: number, b: number) => void;
  focus: () => void;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  gallery: GalleryPreview[];
  onOpenMediaLibrary?: () => void;
  placeholder?: string;
  className?: string;
};

function ToolbarBtn({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded-lg transition-colors ${
        active ?
          "bg-brand-100 text-brand-700"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      } disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function mergeIntoRowMarker(content: string, a: number, b: number): string {
  if (contentHasRowMarker([a, b], content)) return content;

  let merged = normalizeBlogStorageContent(addPartnerToImageLine(content, a, b));
  if (contentHasRowMarker([a, b], merged)) return merged;

  merged = normalizeBlogStorageContent(addPartnerToImageLine(content, b, a));
  if (contentHasRowMarker([a, b], merged)) return merged;

  const cleaned = stripImageMarkersForIndices(content, [a, b]);
  return normalizeBlogStorageContent(`${cleaned}\n[[row:${a},${b}]]\n`);
}

function syncStorage(
  editor: ReturnType<typeof useEditor>,
  onChange: (v: string) => void,
  lastValueRef: React.MutableRefObject<string>,
  skipNextUpdate: React.MutableRefObject<boolean>,
) {
  if (!editor) return;
  const storage = normalizeBlogStorageContent(editorHtmlToStorage(editor.getHTML()));
  skipNextUpdate.current = true;
  lastValueRef.current = storage;
  onChange(storage);
  queueMicrotask(() => {
    skipNextUpdate.current = false;
  });
}

function BlogRichTextEditorInner(
  {
    value,
    onChange,
    gallery,
    onOpenMediaLibrary,
    placeholder = "Start writing your story…",
    className = "",
  }: Props,
  ref: React.Ref<BlogRichTextEditorHandle>,
) {
  const [showSource, setShowSource] = useState(false);
  const [sourceText, setSourceText] = useState(value);
  const skipNextUpdate = useRef(false);
  const lastValueRef = useRef(value);

  useEffect(() => {
    const id = "blog-editor-google-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = BLOG_EDITOR_GOOGLE_FONTS_URL;
    document.head.appendChild(link);
  }, []);

  const buildEditorHtml = useCallback(
    (storage: string) => {
      const base = storageToEditorHtml(storage);
      return applyGalleryPreviewsToEditorHtml(base, gallery);
    },
    [gallery],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextStyle,
      FontFamily,
      Color,
      FontSize,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Placeholder.configure({ placeholder }),
      BlogImageMarker,
    ],
    content: buildEditorHtml(value),
    editorProps: {
      attributes: {
        class:
          "min-h-[320px] px-6 py-5 focus:outline-none text-gray-900 text-base leading-relaxed",
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (skipNextUpdate.current) return;
      const storage = normalizeBlogStorageContent(editorHtmlToStorage(ed.getHTML()));
      lastValueRef.current = storage;
      onChange(storage);
    },
  });

  useEffect(() => {
    if (!editor || showSource) return;
    const current = normalizeBlogStorageContent(editorHtmlToStorage(editor.getHTML()));
    if (current === value) {
      lastValueRef.current = value;
      return;
    }
    if (lastValueRef.current === value) return;
    lastValueRef.current = value;
    const html = buildEditorHtml(value);
    queueMicrotask(() => {
      if (editor.isDestroyed) return;
      skipNextUpdate.current = true;
      editor.commands.setContent(html, { emitUpdate: false });
      skipNextUpdate.current = false;
    });
  }, [editor, value, buildEditorHtml, showSource]);

  useEffect(() => {
    if (!editor || showSource) return;
    queueMicrotask(() => {
      if (editor.isDestroyed) return;
      const { tr } = editor.state;
      let modified = false;
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name !== "blogImageMarker") return;
        const attrs = { ...node.attrs };
        if (attrs.markerType === "image") {
          const g = gallery.find((x) => x.index === attrs.index);
          const newUrl = g?.url || "";
          const newCaption = g?.caption || "";
          const newLayout = g?.layout || "inline";
          const newPlacement = g?.placement || "article";
          if (
            newUrl !== attrs.previewUrl ||
            newCaption !== attrs.caption ||
            newLayout !== attrs.layout ||
            newPlacement !== attrs.placement
          ) {
            tr.setNodeMarkup(pos, undefined, {
              ...attrs,
              previewUrl: newUrl,
              caption: newCaption,
              layout: newLayout,
              placement: newPlacement,
            });
            modified = true;
          }
        } else if (attrs.markerType === "row") {
          const indices = String(attrs.indices)
            .split(",")
            .map((s) => Number(s.trim()))
            .filter((n) => !Number.isNaN(n));
          const urls = indices
            .map((i) => gallery.find((g) => g.index === i)?.url)
            .filter(Boolean);
          const layouts = indices
            .map((i) => gallery.find((g) => g.index === i)?.layout || "inline")
            .join(",");
          const newUrls = urls.join("|");
          if (newUrls !== attrs.previewUrls || layouts !== (attrs.layouts || "")) {
            tr.setNodeMarkup(pos, undefined, { ...attrs, previewUrls: newUrls, layouts });
            modified = true;
          }
        }
      });
      if (modified && tr.docChanged) {
        skipNextUpdate.current = true;
        editor.view.dispatch(tr);
        queueMicrotask(() => {
          skipNextUpdate.current = false;
          if (editor.isDestroyed) return;
          const storage = normalizeBlogStorageContent(editorHtmlToStorage(editor.getHTML()));
          lastValueRef.current = storage;
          onChange(storage);
        });
      }
    });
  }, [editor, gallery, showSource]);

  const insertImageMarker = useCallback(
    (index: number) => {
      if (!editor) return false;
      const img = gallery.find((g) => g.index === index);
      if (img?.placement === "cover") return false;
      const currentStorage = editorHtmlToStorage(editor.getHTML());
      if (contentHasImageMarker(index, currentStorage)) return false;

      editor
        .chain()
        .focus()
        .insertContent({
          type: "blogImageMarker",
          attrs: {
            markerType: "image",
            index,
            previewUrl: img?.url || "",
            caption: img?.caption || "",
            layout: img?.layout || "inline",
            placement: img?.placement || "article",
          },
        })
        .run();

      syncStorage(editor, onChange, lastValueRef, skipNextUpdate);
      return true;
    },
    [editor, gallery, onChange],
  );

  const insertRowMarker = useCallback(
    (a: number, b: number) => {
      if (!editor) return false;
      const currentStorage = normalizeBlogStorageContent(
        editorHtmlToStorage(editor.getHTML()),
      );
      if (contentHasRowMarker([a, b], currentStorage)) return false;

      const merged = mergeIntoRowMarker(currentStorage, a, b);
      skipNextUpdate.current = true;
      lastValueRef.current = merged;
      editor.commands.setContent(buildEditorHtml(merged), { emitUpdate: false });
      skipNextUpdate.current = false;
      onChange(merged);
      editor.commands.focus();
      return true;
    },
    [editor, gallery, onChange, buildEditorHtml],
  );

  useImperativeHandle(ref, () => ({
    insertImage: insertImageMarker,
    insertRow: insertRowMarker,
    focus: () => editor?.commands.focus(),
  }));

  const setLink = () => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter URL", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const toggleSource = () => {
    if (showSource) {
      onChange(sourceText);
      lastValueRef.current = sourceText;
      if (editor) {
        queueMicrotask(() => {
          if (editor.isDestroyed) return;
          skipNextUpdate.current = true;
          editor.commands.setContent(buildEditorHtml(sourceText), { emitUpdate: false });
          skipNextUpdate.current = false;
        });
      }
      setShowSource(false);
    } else {
      setSourceText(value);
      setShowSource(true);
    }
  };

  if (!editor) return null;

  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white shadow-sm ${className}`}
    >
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-gray-100 bg-white/95 backdrop-blur-sm rounded-t-2xl">
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarBtn>

        <div className="relative flex items-center">
          <Type className="w-3.5 h-3.5 text-gray-400 absolute left-2 pointer-events-none" />
          <select
            value={editor.getAttributes("textStyle").fontFamily || ""}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) editor.chain().focus().unsetFontFamily().run();
              else editor.chain().focus().setFontFamily(v).run();
            }}
            className="pl-7 pr-2 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-200 max-w-[130px]"
            title="Font family"
          >
            <option value="">Font</option>
            {BLOG_EDITOR_FONTS.map((f) => (
              <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <ToolbarBtn
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
          title="Align left"
        >
          <AlignLeft className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
          title="Align center"
        >
          <AlignCenter className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })}
          title="Align right"
        >
          <AlignRight className="w-4 h-4" />
        </ToolbarBtn>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <ToolbarBtn
          onClick={() => editor.chain().focus().setHeading({ level: 1 }).run()}
          active={editor.isActive("heading", { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().setHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().setHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().setParagraph().run()}
          active={editor.isActive("paragraph")}
          title="Normal paragraph"
        >
          <span className="text-xs font-bold w-4 h-4 flex items-center justify-center">P</span>
        </ToolbarBtn>

        <div className="relative flex items-center">
          <select
            value={editor.getAttributes("textStyle").fontSize || ""}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) editor.chain().focus().unsetFontSize().run();
              else editor.chain().focus().setFontSize(v).run();
            }}
            className="px-2 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-700 max-w-[88px]"
            title="Font size"
          >
            <option value="">Size</option>
            {FONT_SIZE_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <label
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-gray-200 bg-white cursor-pointer"
            title="Text color"
          >
            <span className="text-[10px] font-semibold text-gray-500">Color</span>
            <input
              type="color"
              value={editor.getAttributes("textStyle").color || "#1f2937"}
              onChange={(e) =>
                editor.chain().focus().setColor(e.target.value).run()
              }
              className="w-7 h-7 rounded border border-gray-200 cursor-pointer p-0.5 bg-white"
            />
          </label>
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetColor().run()}
            className="text-[10px] font-medium px-1.5 py-1 rounded text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            title="Reset color"
          >
            Reset
          </button>
        </div>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet list"
        >
          <List className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Numbered list"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal rule"
        >
          <Minus className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn onClick={setLink} active={editor.isActive("link")} title="Insert link">
          <Link2 className="w-4 h-4" />
        </ToolbarBtn>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <button
          type="button"
          onClick={() => {
            editor.commands.focus();
            onOpenMediaLibrary?.();
          }}
          title="Open media library"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors shadow-sm"
        >
          <ImageIcon className="w-4 h-4" />
          <span>Add Media</span>
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        <ToolbarBtn
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </ToolbarBtn>

        <div className="flex-1" />

        <ToolbarBtn onClick={toggleSource} active={showSource} title="HTML source">
          <Code2 className="w-4 h-4" />
        </ToolbarBtn>
      </div>

      {showSource ?
        <textarea
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          className="w-full min-h-[360px] px-6 py-5 font-mono text-sm text-gray-800 bg-gray-50 focus:outline-none resize-y rounded-b-2xl"
          spellCheck={false}
        />
      : <div className="blog-rich-editor rounded-b-2xl">
          <EditorContent editor={editor} />
        </div>}
    </div>
  );
}

const BlogRichTextEditor = forwardRef(BlogRichTextEditorInner);
BlogRichTextEditor.displayName = "BlogRichTextEditor";
export default BlogRichTextEditor;
