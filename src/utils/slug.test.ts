import { describe, it, expect } from "vitest";
import { toSlug } from "./slug.js";

describe("toSlug", () => {
  it("converts Vietnamese diacritics to ASCII", () => {
    expect(toSlug("iPhone 17 ra mắt với camera 200MP"))
      .toBe("iphone-17-ra-mat-voi-camera-200mp");
  });

  it("collapses whitespace and special chars to single dash", () => {
    expect(toSlug("Hello   --   World!!!")).toBe("hello-world");
  });

  it("strips leading/trailing dashes", () => {
    expect(toSlug("---abc---")).toBe("abc");
  });

  it("truncates to 40 chars without breaking words", () => {
    const long = "this is a very long title that should be truncated nicely";
    const s = toSlug(long);
    expect(s.length).toBeLessThanOrEqual(40);
    expect(s).not.toMatch(/-$/);
  });

  it("handles empty/whitespace input", () => {
    expect(toSlug("")).toBe("untitled");
    expect(toSlug("   ")).toBe("untitled");
  });
});
