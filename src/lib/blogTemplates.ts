export type BlogArticleTemplate = "classic" | "magazine" | "minimal" | "lookbook";

export type BlogTemplateDef = {
  id: BlogArticleTemplate;
  label: string;
  description: string;
  contentWidth: string;
  starterContent: string;
};

/** Image #0 = featured cover (header). In-story markers start at index 1. */
export const BLOG_ARTICLE_TEMPLATES: BlogTemplateDef[] = [
  {
    id: "classic",
    label: "Classic Editorial",
    description: "Drop-cap opening, serif headings — timeless journal feel",
    contentWidth: "max-w-3xl",
    starterContent: `<p>Every weave tells a story passed down through generations of artisans who pour their soul into each thread. Today we explore what makes a saree more than fabric — it is heritage you can wear.</p>

[[image:1]]

<h2>The Art of Draping</h2>
<p>There is a rhythm to draping a saree that transforms six yards of silk into poetry in motion. Start with the pleats — crisp, even, falling like a waterfall — then let the pallu flow with intention.</p>

<blockquote><p>Style is knowing who you are — and letting the saree speak for you.</p></blockquote>

<h2>Styling for Every Occasion</h2>
<p>From morning pujas to evening receptions, the right drape adapts to every moment. Pair heritage weaves with contemporary blouses for a look that honours tradition while feeling utterly modern.</p>`,
  },
  {
    id: "magazine",
    label: "Magazine Spread",
    description: "Bold sections, wide layout, image-forward storytelling",
    contentWidth: "max-w-4xl",
    starterContent: `<p><strong>This season</strong> is all about bold colour, architectural drapes, and the return of heirloom weaves reimagined for the modern wardrobe.</p>

<h2>Cover Story</h2>
<p>The runway may set trends, but the streets of India have always been the true laboratory of saree styling. We spoke to three women who wear their heritage with unapologetic flair.</p>

[[image:1]]

<h2>Three Looks, One Weave</h2>
<p>One Banarasi. Three occasions. Here is how to style the same saree from boardroom to baraat without missing a beat.</p>
<ul>
<li><strong>Morning:</strong> Minimal jewellery, structured blouse, soft pleats</li>
<li><strong>Afternoon:</strong> Statement belt, contrast pallu drape</li>
<li><strong>Evening:</strong> Full regalia — temple jewellery and a dramatic shoulder drape</li>
</ul>

[[row:2,3]]

<h2>The Edit</h2>
<p>Our curators picked the pieces that define this season. Each one is a conversation starter — and a keeper for decades.</p>`,
  },
  {
    id: "minimal",
    label: "Minimal Clean",
    description: "Sans-serif body, no drop cap — modern and readable",
    contentWidth: "max-w-2xl",
    starterContent: `<p>Less is more when the fabric speaks for itself. This guide strips away the noise and focuses on what matters: fit, drape, and the quiet confidence of a well-chosen saree.</p>

<h2>Start with the fabric</h2>
<p>Cotton for everyday ease. Silk for celebrations. Linen for summer breathability. Choose one hero fabric and build your look around it.</p>

[[image:1]]

<h2>Three rules</h2>
<ol>
<li>One statement piece — either the saree or the jewellery, never both fighting for attention.</li>
<li>Neutral blouses are your best friend.</li>
<li>Let the pallu do the talking — a single dramatic fold beats ten accessories.</li>
</ol>

<p>That is it. No fuss. Just you and six yards of perfection.</p>`,
  },
  {
    id: "lookbook",
    label: "Lookbook Gallery",
    description: "Image-heavy layout with short captions — visual-first",
    contentWidth: "max-w-5xl",
    starterContent: `<p>A visual journey through this season's most coveted drapes. Scroll, save, and shop the story.</p>

[[image:1]]

<p><em>Look 01 — Morning light on raw silk</em></p>

[[row:2,3]]

<p><em>Look 02 &amp; 03 — Twin drapes, one wedding, one workday</em></p>

<h2>Shop the looks</h2>
<p>Each image links to pieces you can add to your wardrobe today. Tap through to explore the full collection.</p>`,
  },
];

export function getBlogTemplate(id?: string | null): BlogTemplateDef {
  return (
    BLOG_ARTICLE_TEMPLATES.find((t) => t.id === id) ?? BLOG_ARTICLE_TEMPLATES[0]
  );
}

export function templateContentWidth(id?: string | null): string {
  return getBlogTemplate(id).contentWidth;
}
