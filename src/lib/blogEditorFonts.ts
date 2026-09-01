/** Free / system fonts available in the blog rich-text editor. */
export type BlogEditorFont = {
  label: string;
  value: string;
  category: "sans" | "serif" | "display" | "script" | "mono";
};

export const BLOG_EDITOR_FONTS: BlogEditorFont[] = [
  { label: "Default", value: "Inter, system-ui, sans-serif", category: "sans" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif", category: "sans" },
  { label: "Open Sans", value: '"Open Sans", sans-serif', category: "sans" },
  { label: "Georgia", value: "Georgia, serif", category: "serif" },
  { label: "Times New Roman", value: '"Times New Roman", Times, serif', category: "serif" },
  { label: "Playfair Display", value: '"Playfair Display", Georgia, serif', category: "display" },
  { label: "Lora", value: "Lora, Georgia, serif", category: "serif" },
  { label: "Merriweather", value: "Merriweather, Georgia, serif", category: "serif" },
  { label: "Dancing Script", value: '"Dancing Script", cursive', category: "script" },
  { label: "Courier New", value: '"Courier New", Courier, monospace', category: "mono" },
];

/** Google Fonts to load for the editor (subset). */
export const BLOG_EDITOR_GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600&family=Lora:ital,wght@0,400;0,600;1,400&family=Merriweather:ital,wght@0,400;0,700;1,400&family=Open+Sans:wght@400;600&family=Playfair+Display:wght@400;600;700&display=swap";
