import axios from 'axios';
import { JSDOM } from 'jsdom';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function scrapeMatchesFromProfightDB(eventId, url) {
    const res = await axios.get(url);
    const dom = new JSDOM(res.data);
    const rows = [...dom.window.document.querySelectorAll('tr')];

    let order = 1;
    for (let row of rows) {
        const cells = row.querySelectorAll('td');
        if (cells.length < 4) continue;

        const result = cells[2].textContent.trim();
        const winner = cells[1].textContent.trim();
        const loser = cells[3].textContent.trim();
        const duration = cells[4]?.textContent.trim() || null;
        const type = cells[5]?.textContent.trim() || null;
        const title = cells[6]?.textContent.trim() || null;

        await prisma.match.create({
            data: {
                eventId,
                order,
                result,
                winner,
                loser,
                duration,
                type,
                title,
            },
        });

        order++;
    }
}