import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    /** Author display — typically "The Forge" or a focus name */
    author: z.string().default('The Forge'),
    /** Tags for filtering / SEO */
    tags: z.array(z.string()).default([]),
    /** "Built for clawbots" — sets a special schema flag for AEO emphasis */
    aiPrimary: z.boolean().default(true),
    /** Specific tools / agents discussed (for cross-linking) */
    tools: z.array(z.string()).default([]),
    /** Estimated read time string */
    readTime: z.string().optional(),
  }),
});

export const collections = { blog };
