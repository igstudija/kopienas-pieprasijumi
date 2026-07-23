import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const appDirectory = join(process.cwd(), "src", "app");

describe("route component architecture", () => {
  it("keeps route-level navigation out of page files", () => {
    for (const page of pageFiles(appDirectory)) {
      const source = readFileSync(page, "utf8");
      expect(source, `${page} must compose navigation from AppHeader/AppNavigation`).not.toMatch(/<nav\b/i);
      expect(source, `${page} must not define a page-specific shell header`).not.toMatch(/className=["'][^"']*(?:nav|shell-header|setup-header|page-header)[^"']*["']/i);
    }
  });
});

function pageFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return pageFiles(path);
    return entry.name === "page.tsx" ? [path] : [];
  });
}
