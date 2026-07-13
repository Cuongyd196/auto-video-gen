export function toSlug(input: string): string {
  if (!input || !input.trim()) return "untitled";

  const noDiacritics = input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");

  let slug = noDiacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (slug.length > 40) {
    slug = slug.substring(0, 40).replace(/-+[^-]*$/, "");
    if (!slug) {
      slug = noDiacritics
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .substring(0, 40);
    }
    slug = slug.replace(/^-+|-+$/g, "");
  }

  return slug || "untitled";
}
