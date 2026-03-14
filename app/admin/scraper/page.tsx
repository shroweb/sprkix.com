import { prisma } from "@lib/prisma";
import ScraperDashboard from "./ScraperDashboard";

export default async function ScraperPage() {
    const eventsWithMissingData = await prisma.event.findMany({
        where: {
            OR: [
                { posterUrl: null },
                { description: null },
                { description: "" }
            ]
        },
        orderBy: { date: 'desc' },
        take: 50,
        select: { id: true, title: true, slug: true, date: true, promotion: true, posterUrl: true, description: true, tmdbId: true },
    });

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-foreground uppercase italic">Metadata Scraper</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Identify and repair events missing posters or descriptions.
                </p>
            </div>

            <ScraperDashboard 
                initialEvents={eventsWithMissingData} 
                hasTmdbKey={!!process.env.TMDB_API_KEY}
            />
        </div>
    );
}
