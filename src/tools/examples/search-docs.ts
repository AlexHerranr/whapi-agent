import { z } from "zod";
import type { ToolDefinition } from "../types.js";

const schema = z.object({
  query: z.string().min(1),
  limit: z.number().int().positive().max(10).optional(),
});

interface Doc {
  title: string;
  body: string;
}

const DEFAULT_CORPUS: Doc[] = [
  {
    title: "Refund policy",
    body: "Refunds are available within 30 days of purchase. Shipping fees are non-refundable.",
  },
  {
    title: "Shipping times",
    body: "Orders ship within 1-2 business days. Delivery takes 3-7 days depending on region.",
  },
  {
    title: "Opening hours",
    body: "Customer support is available Monday to Friday, 9:00 to 18:00 local time.",
  },
];

export function createSearchDocsTool(
  corpus: Doc[] = DEFAULT_CORPUS,
): ToolDefinition<z.infer<typeof schema>> {
  return {
    name: "search_docs",
    description:
      "Full-text search over the application's knowledge base. Returns the top matching passages.",
    schema,
    execute: ({ query, limit = 3 }) => {
      const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
      const scored = corpus
        .map((doc) => {
          const haystack = `${doc.title} ${doc.body}`.toLowerCase();
          const score = terms.reduce(
            (acc, term) => acc + (haystack.includes(term) ? 1 : 0),
            0,
          );
          return { doc, score };
        })
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((r) => r.doc);

      return { query, results: scored };
    },
  };
}

export const searchDocsTool = createSearchDocsTool();
