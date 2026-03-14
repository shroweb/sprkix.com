import { prisma } from "./prisma";

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Returns a unique slug for a wrestler by checking the DB.
 * Tries the clean slug first, then appends -2, -3, etc.
 */
export async function uniqueWrestlerSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name);
  const candidates = [base, ...Array.from({ length: 20 }, (_, i) => `${base}-${i + 2}`)];
  for (const candidate of candidates) {
    const existing = await prisma.wrestler.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
  }
  // Fallback: extremely unlikely but safe
  return `${base}-${Date.now()}`;
}

/**
 * Returns a unique slug for an event.
 */
export async function uniqueEventSlug(title: string): Promise<string> {
  const base = slugify(title);
  const candidates = [base, ...Array.from({ length: 20 }, (_, i) => `${base}-${i + 2}`)];
  for (const candidate of candidates) {
    const existing = await prisma.event.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
  }
  return `${base}-${Date.now()}`;
}
