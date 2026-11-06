export const blockTypes = [
  "hero",
  "text",
  "image",
  "button",
  "features",
  "gallery",
  "testimonial",
  "faq",
  "contact",
  "divider",
  "spacer",
  "post-list",
  "post-header",
  "post-content",
];
export function newBlock(type) {
  return {
    id: crypto.randomUUID(),
    layout: "grid",
    pageSize: 9,
    showImage: true,
    showExcerpt: true,
    showDate: true,
    type,
    title:
      {
        hero: "Make something remarkable.",
        features: "A little more possibility.",
        contact: "Let’s work together.",
        faq: "Good questions.",
      }[type] || "Your story starts here",
    text: "Add your own words. Make this space yours.",
    label: type === "contact" ? "Get in touch" : "Explore more",
    url: type === "contact" ? "mailto:hello@example.com" : "#",
    image: "",
    alt: "",
    align: type === "hero" ? "center" : "left",
    tone: "light",
    spacing: type === "hero" ? 96 : 48,
    items: [
      {
        title: "Thoughtfully made",
        text: "Tell visitors what makes your work special.",
        image: "",
      },
      {
        title: "Built for people",
        text: "Share the details that matter.",
        image: "",
      },
      {
        title: "Room to grow",
        text: "Create something worth coming back to.",
        image: "",
      },
    ],
  };
}
export function newSite(template = "studio") {
  const hero = newBlock("hero");
  if (template === "portfolio") {
    hero.title = "Independent mind. Meaningful work.";
    hero.text = "A selection of projects, ideas, and things I care about.";
  }
  if (template === "business") {
    hero.title = "Good ideas deserve a great partner.";
    hero.text = "We turn ambitious plans into thoughtful experiences.";
  }
  return {
    version: 1,
    name: "Untitled site",
    theme: {
      accent: "#6658e8",
      background: "#faf9f6",
      text: "#20202a",
      font: "sans-serif",
    },
    pages: [
      {
        id: crypto.randomUUID(),
        name: "Home",
        path: "/",
        metaTitle: "",
        metaDescription: "",
        blocks: [hero, newBlock("features"), newBlock("contact")],
      },
    ],
  };
}
export function safeUrl(value) {
  return typeof value === "string" &&
    /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(value) &&
    !/[\s<>"\\]/.test(value)
    ? value
    : "#";
}
