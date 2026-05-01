import { defineCollection, z } from 'astro:content';

/**
 * The Forge — content schema for Forged Format posts.
 *
 * See FORGE-OPERATIONS-PLAN.md for the full spec. Every post must include
 * the citation manifest, author credentials, and entity declarations.
 */

const claimSchema = z.object({
  /** The factual claim, in full */
  text: z.string(),
  /** Source URL backing the claim */
  source: z.string().url(),
  /** Date the claim was true (ISO 8601). For evergreen claims, the source's published date. */
  date: z.string(),
  /** Confidence: high (verified, recent, primary), medium (secondary, derivative), low (conjecture, opinion) */
  confidence: z.enum(['high', 'medium', 'low']).default('high'),
  /** Optional: the published-on date of the source itself, for freshness signal */
  sourceDate: z.string().optional(),
});

const updateLogEntry = z.object({
  version: z.string(),
  date: z.coerce.date(),
  notes: z.string(),
});

const authorSchema = z.object({
  name: z.string().default('The Forge'),
  /** Short credentials line for SEO/AEO author block */
  credentials: z.string().default('AI editorial team focused on agent workflows. All posts reviewed by humans before publishing.'),
  /** Optional URL for author page / verifiable identity */
  url: z.string().url().optional(),
});

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    /** Required: the post title (use as H1) */
    title: z.string().max(120),

    /** Required: 1-2 sentence description for the homepage card and SEO */
    description: z.string().max(220),

    /** Required: TL;DR shown directly under H1. Aim for ~50 words. */
    tldr: z.string().min(120).max(500),

    /** ISO date the post is published — controls homepage vs archive placement */
    publishDate: z.coerce.date(),

    /** Optional: most recent update date */
    updatedDate: z.coerce.date().optional(),

    /** Author block — see authorSchema */
    author: authorSchema.default({}),

    /** Tags for filtering / SEO. Use approved set in BACKFILL.md. */
    tags: z.array(z.string()).default([]),

    /** AI-first emphasis flag */
    aiPrimary: z.boolean().default(true),

    /** Tools mentioned in post (1-3 typical) */
    tools: z.array(z.string()).default([]),

    /** Read time string */
    readTime: z.string().optional(),

    /**
     * Forged Format mandatory fields
     * ================================
     */

    /** Citation manifest: every factual claim with source, date, confidence */
    claims: z.array(claimSchema).min(3),

    /** Entity declarations: people, products, companies, concepts mentioned */
    entities: z.array(z.string()).min(2),

    /** Per-post update log */
    updateLog: z.array(updateLogEntry).default([]),

    /**
     * Citation density target — auto-validated at build time:
     * - Minimum 1 inline [cite: URL · date · confidence] marker per ~100 words of body
     * - Minimum 1 Wikipedia link in body or claims
     * - Minimum 2 Reddit / UGC / community links in body or claims
     * - Minimum 1 Q-shaped section header (### Q: ... or ## ...?)
     */

    /** Optional commercial disclosure for affiliate posts */
    affiliate: z.boolean().default(false),
  }),
});

export const collections = { blog };
