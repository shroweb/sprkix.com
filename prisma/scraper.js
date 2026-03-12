const { chromium } = require("playwright");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

(async () => {
    console.log("🔍 Looking for events with ProfightDB URLs...");

    const events = await prisma.event.findMany({
        where: { profightdbUrl: { not: null } },
    });

    if (events.length === 0) {
        console.log("⚠️ No events found.");
        return;
    }

    const browser = await chromium.launch();
    const page = await browser.newPage();

    for (const event of events) {
        console.log(`📂 Scraping ${event.title} from ${event.profightdbUrl}`);
        await page.goto(event.profightdbUrl);

        const rows = await page.$$eval("div.table-wrapper table tr", (trs) => {
            return trs
                .slice(1) // Skip header
                .map((tr) => {
                    const tds = tr.querySelectorAll("td");
                    if (tds.length < 8) return null;

                    const winner = tds[1].textContent.trim().replace(/\u00a0/g, " ");
                    const result = tds[2].textContent.trim().replace(/\u00a0/g, " ");
                    const loser = tds[3].textContent.trim().replace(/\u00a0/g, " ");
                    const duration = tds[4].textContent.trim();
                    const type = tds[5].textContent.trim();
                    const title = tds[6].textContent.trim();

                    return {
                        winner,
                        loser,
                        result: `${winner} ${result} ${loser}`,
                        duration,
                        type,
                        title,
                    };
                })
                .filter(Boolean);
        });

        // Save to DB
        for (let i = 0; i < rows.length; i++) {
            const m = rows[i];

            await prisma.match.create({
                data: {
                    eventId: event.id,
                    order: i + 1,
                    result: m.result,
                    winner: m.winner || "Unknown",
                    loser: m.loser || "Unknown",
                    duration: m.duration || null,
                    type: m.type || null,
                    title: m.title || null,
                },
            });

            console.log(`✅ Match ${i + 1}: ${m.result}`);
        }
    }

    await browser.close();
    console.log("✅ Done.");
})();