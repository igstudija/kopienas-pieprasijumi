import { describe, expect, it } from "vitest";
import { groupRequests } from "@/lib/request-grouping";

const base = { authorCompany: "Uzņēmums", authorCategory: "Pakalpojumi" };

describe("groupRequests", () => {
  it("sorts groups and records by their latest update", () => {
    const groups = groupRequests([
      { ...base, id: "a-old", authorId: "a", authorName: "Anna", updatedAt: "2026-07-20T08:00:00Z", createdAt: "2026-07-20T08:00:00Z" },
      { ...base, id: "b", authorId: "b", authorName: "Jānis", updatedAt: "2026-07-21T08:00:00Z", createdAt: "2026-07-21T08:00:00Z" },
      { ...base, id: "a-new", authorId: "a", authorName: "Anna", updatedAt: "2026-07-22T08:00:00Z", createdAt: "2026-07-19T08:00:00Z" },
    ]);
    expect(groups.map((group) => group.authorId)).toEqual(["a", "b"]);
    expect(groups[0].requests.map((request) => request.id)).toEqual(["a-new", "a-old"]);
  });

  it("uses a deterministic ID order when timestamps match", () => {
    const same = "2026-07-22T08:00:00Z";
    const groups = groupRequests([
      { ...base, id: "b", authorId: "a", authorName: "Anna", updatedAt: same, createdAt: same },
      { ...base, id: "a", authorId: "a", authorName: "Anna", updatedAt: same, createdAt: same },
    ]);
    expect(groups[0].requests.map((request) => request.id)).toEqual(["a", "b"]);
  });
});
