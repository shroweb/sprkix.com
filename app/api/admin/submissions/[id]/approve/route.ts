import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";
import { parseCagematchHtml, parseProfightDbHtml } from "@lib/cagematch";
import { uniqueWrestlerSlug } from "@lib/slug-utils";
import { sendSubmissionApprovedEmail } from "@lib/mail";

async function fetchWithFallback(url: string): Promise<string> {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
  };
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
    if (res.ok) return await res.text();
  } catch { /* fall through */ }

  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  const proxyRes = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) });
  if (!proxyRes.ok) throw new Error("Could not fetch page");
  const data = await proxyRes.json();
  if (!data.contents) throw new Error("Proxy returned empty content");
  return data.contents;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const submission = await prisma.eventSubmission.findUnique({ where: { id } });
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (submission.status !== "pending") return NextResponse.json({ error: "Already reviewed" }, { status: 400 });

  // Generate unique slug from title
  const baseSlug = submission.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  let slug = baseSlug;
  let counter = 2;
  while (await prisma.event.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  // Create the real event, marking who submitted it
  const event = await (prisma.event as any).create({
    data: {
      title: submission.title,
      slug,
      date: submission.date,
      promotion: submission.promotion,
      venue: submission.venue,
      city: submission.city,
      attendance: submission.attendance,
      network: submission.network,
      posterUrl: submission.posterUrl,
      description: submission.description,
      type: submission.type,
      profightdbUrl: submission.sourceUrl,
      submittedByUserId: submission.userId,
    },
  });

  // Mark submission as approved
  await prisma.eventSubmission.update({
    where: { id },
    data: { status: "approved", approvedEventId: event.id },
  });

  // Notify the submitter
  await (prisma as any).notification.create({
    data: {
      userId: submission.userId,
      type: "submission_approved",
      message: `Your event submission "${submission.title}" has been approved!`,
      link: `/events/${event.slug}`,
    },
  });

  // Also send an email
  try {
    const submitter = await prisma.user.findUnique({ where: { id: submission.userId }, select: { email: true, name: true } });
    if (submitter) {
      await sendSubmissionApprovedEmail(submitter.email, submitter.name ?? "Wrestling Fan", submission.title, event.slug);
    }
  } catch (emailErr) {
    console.error("Email failed for approved submission:", emailErr);
  }

  // Auto-import matches from the source URL (non-blocking — approval succeeds even if import fails)
  let matchesImported = 0;
  try {
    const sourceUrl = submission.sourceUrl;
    const html = await fetchWithFallback(sourceUrl);
    const isProfightDb = sourceUrl.includes("profightdb.com");
    const parsedMatches = isProfightDb
      ? parseProfightDbHtml(html)
      : await parseCagematchHtml(html);

    if (parsedMatches.length > 0) {
      const existingWrestlers = await prisma.wrestler.findMany();
      const wrestlerByName = new Map(
        existingWrestlers.map((w) => [w.name.toLowerCase(), w]),
      );

      for (const parsed of parsedMatches) {
        const participants = [];

        for (let i = 0; i < parsed.wrestlers.length; i++) {
          const rawName = parsed.wrestlers[i];
          const key = rawName.toLowerCase();
          let wrestler = wrestlerByName.get(key);

          if (!wrestler) {
            for (const [k, w] of wrestlerByName) {
              if (k.includes(key) || key.includes(k)) {
                wrestler = w;
                break;
              }
            }
          }

          if (!wrestler) {
            wrestler = await prisma.wrestler.create({
              data: { name: rawName, slug: await uniqueWrestlerSlug(rawName) },
            });
            wrestlerByName.set(key, wrestler);
          }

          participants.push({
            wrestlerId: wrestler.id,
            team: parsed.teams[i],
            isWinner: parsed.winners[i],
          });
        }

        await prisma.match.create({
          data: {
            eventId: event.id,
            title: parsed.title,
            type: parsed.type,
            result: parsed.result || null,
            duration: parsed.duration || null,
            participants: { create: participants },
          },
        });

        matchesImported++;
      }
    }
  } catch (err) {
    // Import failure is non-fatal — event is already created
    console.error("Auto-import matches failed for approved submission:", err);
  }

  return NextResponse.json({ success: true, eventId: event.id, slug: event.slug, matchesImported });
}
