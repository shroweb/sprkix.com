/**
 * Shared utility for fetching event metadata from a Cagematch URL.
 * Used by both the /api/admin/events/fetch-cagematch-info route
 * and the /api/admin/cron/sync-nxt cron job.
 */
import * as cheerio from 'cheerio'
import { prisma } from './prisma'

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'

export interface CagematchEventInfo {
    title: string
    date: string        // YYYY-MM-DD
    promotion: string   // resolved short name, or full name as fallback
    promotionFull: string
    type: string        // 'tv' | 'ppv'
    posterUrl: string
    venue?: string
}

export async function fetchCagematchEventInfo(url: string): Promise<CagematchEventInfo> {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
    if (!res.ok) throw new Error(`Failed to fetch Cagematch page: ${res.status}`)
    const html = await res.text()
    const $ = cheerio.load(html)

    // Title: "<title>WWE NXT #828 « Events Database « CAGEMATCH..."
    const pageTitle = $('title').text().trim()
    const title = pageTitle.split('«')[0].trim()

    // InformationBox: pairs of td.InformationBoxTitle + td.InformationBoxContents
    const infoMap: Record<string, string> = {}
    const titles = $('.InformationBoxTitle').toArray()
    const contents = $('.InformationBoxContents').toArray()
    titles.forEach((el, i) => {
        const label = $(el).text().trim().replace(/:$/, '').toLowerCase()
        const value = contents[i] ? $(contents[i]).text().trim() : ''
        if (label && value) infoMap[label] = value
    })

    // Fallback tr scan
    if (Object.keys(infoMap).length === 0) {
        $('tr').each((_, row) => {
            const cells = $(row).find('td')
            if (cells.length >= 2) {
                const label = $(cells[0]).text().trim().replace(/:$/, '').toLowerCase()
                const value = $(cells[1]).text().trim()
                if (label && value) infoMap[label] = value
            }
        })
    }

    // Date: try infoMap first, then anchor href, then body regex
    let dateText = infoMap['date'] || ''
    if (!dateText) {
        $('a[href*="Day="]').each((_, el) => {
            const href = $(el).attr('href') || ''
            const m = href.match(/Day=(\d+)&Month=(\d+)&Year=(\d+)/)
            if (m) { dateText = `${m[1].padStart(2,'0')}.${m[2].padStart(2,'0')}.${m[3]}`; return false as any }
        })
    }
    if (!dateText) {
        const m = $('body').text().match(/\b(\d{2})\.(\d{2})\.(\d{4})\b/)
        if (m) dateText = m[0]
    }

    // Parse DD.MM.YYYY → YYYY-MM-DD
    let formattedDate = ''
    if (dateText) {
        const parts = dateText.split('.')
        if (parts.length >= 3) {
            const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2]
            formattedDate = `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
        }
    }

    const promotionFull = infoMap['promotion'] || ''
    const typeText = infoMap['type'] || ''
    const venue = infoMap['arena'] || infoMap['location'] || ''

    // Resolve alias from DB
    let promotionShort = promotionFull
    if (promotionFull) {
        try {
            const alias = await prisma.promotionAlias.findFirst({
                where: { fullName: { equals: promotionFull, mode: 'insensitive' } },
                include: { promotion: true }
            })
            if (alias) promotionShort = alias.promotion.shortName
        } catch { /* DB lookup failure should not break the import */ }
    }

    const type = /pay.per.view|premium.live.event/i.test(typeText) ? 'ppv' : 'tv'

    // Poster
    let posterUrl = ''
    const imageEl = $('img[src*="pics/"]').first()
    if (imageEl.length) {
        const src = imageEl.attr('src') || ''
        posterUrl = src.startsWith('http') ? src : `https://www.cagematch.net/${src.replace(/^\//, '')}`
    }

    return { title, date: formattedDate, promotion: promotionShort, promotionFull, type, posterUrl, venue }
}
