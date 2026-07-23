export type GroupableRequest = {
  id: string;
  authorId: string;
  authorName: string;
  authorCompany: string;
  authorCategory?: string | null;
  authorEmail?: string | null;
  authorPhone?: string | null;
  authorWebsite?: string | null;
  updatedAt: Date | string;
  createdAt: Date | string;
};

export type RequestGroup<T extends GroupableRequest> = {
  authorId: string;
  authorName: string;
  authorCompany: string;
  authorCategory?: string | null;
  authorEmail?: string | null;
  authorPhone?: string | null;
  authorWebsite?: string | null;
  lastActivityAt: string;
  requests: T[];
};

export function groupRequests<T extends GroupableRequest>(items: T[]): RequestGroup<T>[] {
  const byAuthor = new Map<string, T[]>();
  for (const item of items) {
    const group = byAuthor.get(item.authorId) ?? [];
    group.push(item);
    byAuthor.set(item.authorId, group);
  }

  return [...byAuthor.entries()]
    .map(([authorId, requests]) => {
      const sorted = requests.sort(compareRequests);
      const first = sorted[0];
      return {
        authorId,
        authorName: first.authorName,
        authorCompany: first.authorCompany,
        authorCategory: first.authorCategory,
        authorEmail: first.authorEmail,
        authorPhone: first.authorPhone,
        authorWebsite: first.authorWebsite,
        lastActivityAt: toIso(first.updatedAt),
        requests: sorted,
      };
    })
    .sort((a, b) => compareIsoDesc(a.lastActivityAt, b.lastActivityAt) || a.authorId.localeCompare(b.authorId));
}

function compareRequests<T extends GroupableRequest>(a: T, b: T) {
  return compareIsoDesc(toIso(a.updatedAt), toIso(b.updatedAt)) || compareIsoDesc(toIso(a.createdAt), toIso(b.createdAt)) || a.id.localeCompare(b.id);
}

function compareIsoDesc(a: string, b: string) {
  return b.localeCompare(a);
}

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
