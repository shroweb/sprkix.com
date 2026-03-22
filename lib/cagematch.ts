import { prisma } from './prisma'
import { uniqueWrestlerSlug } from './slug-utils'
import * as cheerio from 'cheerio'

interface ParsedMatch {
    wrestlers: string[]
    teams: number[]
    winners: boolean[]
    type: string
    title: string
    duration?: number
    result?: string
}

export interface ParsedEventInfo {
    title?: string
    date?: string        // DD.MM.YYYY
    promotion?: string
    venue?: string
    city?: string
    attendance?: number
    network?: string
    cagematchUrl?: string
}

export interface CagematchListEntry {
    title: string
    date: string          // DD.MM.YYYY
    promotion: string
    cagematchUrl: string
}

// ─── Cagematch link helpers ────────────────────────────────────────────────

/** True only for wrestler links (?id=2&nr=…) — NOT teams (?id=28&…) */
function isWrestlerHref(href: string): boolean {
    return /[?&]id=2[^0-9]/.test(href) || href.endsWith('id=2')
}

/** True only for team/faction links (?id=28&…) */
function isTeamHref(href: string): boolean {
    return /[?&]id=28[^0-9]/.test(href) || href.endsWith('id=28')
}

// ─── Cagematch event info (venue, city, attendance, network) ───────────────

/**
 * Parses the info-box table from a Cagematch event page and returns
 * structured metadata fields. Cagematch uses an InformationBoxTable with
 * rows like: "Attendance:" | "3.658"
 */
export function parseCagematchEventInfo(html: string): ParsedEventInfo {
    const $ = cheerio.load(html)
    const info: Record<string, string> = {}

    // Primary: Cagematch InformationBoxTable
    $('.InformationBoxTable .InformationBoxRow').each((_, row) => {
        const tds = $(row).find('td')
        if (tds.length >= 2) {
            const label = $(tds[0]).text().trim().toLowerCase().replace(/:$/, '').trim()
            const value = $(tds[1]).text().trim()
            if (label && value) info[label] = value
        }
    })

    // Fallback: any two-column table rows (Cagematch may vary by event type)
    if (Object.keys(info).length === 0) {
        $('table tr').each((_, row) => {
            const tds = $(row).find('td')
            if (tds.length === 2) {
                const label = $(tds[0]).text().trim().toLowerCase().replace(/:$/, '').trim()
                const value = $(tds[1]).text().trim()
                if (label && value && label.length < 50) info[label] = value
            }
        })
    }

    // Attendance: "3.658" or "3,658" → 3658
    const attendanceRaw = info['attendance'] || ''
    const attendanceNum = attendanceRaw
        ? parseInt(attendanceRaw.replace(/[.,\s]/g, ''))
        : NaN

    // Location: "Fresno, California, USA" → city = "Fresno"
    const locationRaw = info['location'] || ''
    const city = locationRaw ? locationRaw.split(',')[0].trim() : undefined

    // Event name & date from the page title / info box
    const title = info['name of the event'] || $('h1').first().text().trim() || undefined
    const date = info['date'] || undefined
    const promotionRaw = info['promotion'] || undefined

    return {
        title,
        date,
        promotion: promotionRaw,
        attendance: !isNaN(attendanceNum) && attendanceNum > 0 ? attendanceNum : undefined,
        network: info['tv station/network'] || info['tv station / network'] || info['network'] || undefined,
        city: city || undefined,
        venue: info['arena'] || info['venue'] || undefined,
    }
}

// ─── Cagematch event list parser ───────────────────────────────────────────

/**
 * Parses a Cagematch events listing page (e.g. ?id=1&view=list&dateFrom=…)
 * and returns a list of events with their URLs.
 */
export function parseCagematchEventList(html: string): CagematchListEntry[] {
    const $ = cheerio.load(html)
    const events: CagematchListEntry[] = []

    // Cagematch event list rows — class TRow1/TRow2 inside a TResults table
    $('tr.TRow1, tr.TRow2').each((_, row) => {
        const $row = $(row)

        // Event link: ?id=1&nr=XXXXX
        const eventLink = $row.find('a[href*="id=1&nr="]').first()
        if (!eventLink.length) return

        const title = eventLink.text().trim()
        const href = eventLink.attr('href') || ''
        if (!title || !href) return

        const cagematchUrl = href.startsWith('http')
            ? href
            : `https://www.cagematch.net/${href.startsWith('?') ? '' : ''}${href}`

        // Date: first cell, format DD.MM.YYYY
        const cells = $row.find('td')
        const firstCellText = $(cells[0]).text().trim()
        const dateMatch = firstCellText.match(/\d{2}\.\d{2}\.\d{4}/)
        const date = dateMatch ? dateMatch[0] : ''
        if (!date) return

        // Promotion: link with id=8 (Cagematch promotions)
        const promotionLink = $row.find('a[href*="id=8"]').first()
        const promotion = promotionLink.text().trim() || ''

        events.push({ title, date, promotion, cagematchUrl })
    })

    return events
}

/** Convert Cagematch date string "DD.MM.YYYY" to a JS Date */
export function parseCagematchDate(dateStr: string): Date | null {
    const m = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
    if (!m) return null
    return new Date(Date.UTC(parseInt(m[3]), parseInt(m[2]) - 1, parseInt(m[1])))
}

// ─── ProfightDB parser ────────────────────────────────────────────────────

export function parseProfightDbHtml(html: string): ParsedMatch[] {
    const $ = cheerio.load(html)
    const matches: ParsedMatch[] = []

    $('table tr').each((_, tr) => {
        const $tr = $(tr)
        const text = $tr.text().trim()
        if (!text) return

        const seen = new Set<string>()
        const wrestlerLinks: string[] = []
        $tr.find('a').each((_, a) => {
            const href = $(a).attr('href') || ''
            if (href.includes('/wrestlers/') || href.includes('wrestler')) {
                const name = $(a).text().trim()
                if (name && !seen.has(name.toLowerCase())) {
                    seen.add(name.toLowerCase())
                    wrestlerLinks.push(name)
                }
            }
        })
        if (wrestlerLinks.length < 2) return

        const lowerText = text.toLowerCase()
        const defeatIdx = lowerText.includes(' defeated ') ? lowerText.indexOf(' defeated ')
            : lowerText.includes(' def. ') ? lowerText.indexOf(' def. ')
            : lowerText.includes(' defeats ') ? lowerText.indexOf(' defeats ')
            : -1

        const isFFA = /triple threat|three.?way|four.?way|five.?way|chamber|rumble|battle royal|scramble/i.test(text)

        const wrestlers: string[] = []
        const teams: number[] = []
        const winners: boolean[] = []

        wrestlerLinks.forEach(name => {
            const ni = lowerText.indexOf(name.toLowerCase())
            let team = 1
            let isWinner = false
            if (isFFA) {
                team = wrestlers.length + 1
                isWinner = defeatIdx !== -1 && ni !== -1 && ni < defeatIdx
            } else {
                if (defeatIdx !== -1 && ni !== -1 && ni > defeatIdx) {
                    team = 2
                    isWinner = false
                } else {
                    team = 1
                    isWinner = defeatIdx !== -1
                }
            }
            wrestlers.push(name)
            teams.push(team)
            winners.push(isWinner)
        })

        let matchType = 'Singles Match'
        $tr.find('td').each((_, td) => {
            const t = $(td).text().trim()
            if (!t || /^\d+$/.test(t)) return
            if (t.length < 80 && !wrestlerLinks.some(w => t.includes(w))) {
                matchType = t
                return false as any
            }
        })

        const durationMatch = text.match(/\((\d{1,3}:\d{2})\)/)
        const duration = durationMatch ? parseDuration(durationMatch[1]) : undefined

        matches.push({
            wrestlers, teams, winners,
            type: matchType,
            title: matchType,
            duration,
            result: text.replace(/\(\d{1,3}:\d{2}\)/g, '').replace(/\s+/g, ' ').trim(),
        })
    })
    return matches
}

// ─── Cagematch match parser ────────────────────────────────────────────────

export async function parseCagematchHtml(html: string): Promise<ParsedMatch[]> {
    const $ = cheerio.load(html)
    const matches: ParsedMatch[] = []

    const matchDivs = $('.Match')
    if (matchDivs.length > 0) {
        matchDivs.each((_, el) => {
            const $el = $(el)
            const rawMatchText = $el.find('.MatchResults').text().trim() || $el.text().trim()

            let rawHtml = $el.html() || ''
            rawHtml = rawHtml.replace(/\(w\/.*?\)/gi, '')
            const $clean = cheerio.load(rawHtml)

            const wrestlers: string[] = []
            const teams: number[] = []
            const winners: boolean[] = []

            const isFreeForAll = /triple threat|three way|four way|five way|six way|chamber|rumble|battle royal|scramble|survival/i.test(rawMatchText)
            const lowerText = rawMatchText.toLowerCase()
            const defeatIndex = lowerText.indexOf(' defeats ') !== -1
                ? lowerText.indexOf(' defeats ')
                : lowerText.indexOf(' def. ') !== -1
                    ? lowerText.indexOf(' def. ')
                    : -1

            $clean('a').each((_, a) => {
                const href = $clean(a).attr('href') || ''
                // Only include individual wrestler links — skip team/faction links (?id=28&…)
                if (!isWrestlerHref(href)) return

                const name = $clean(a).text().trim()
                if (name && !wrestlers.includes(name)) {
                    wrestlers.push(name)
                    const nameIndex = lowerText.indexOf(name.toLowerCase())
                    let isWinner = false
                    let teamId = 1

                    if (isFreeForAll) {
                        teamId = wrestlers.length
                        isWinner = defeatIndex !== -1 && nameIndex !== -1 && nameIndex < defeatIndex
                    } else {
                        if (defeatIndex !== -1 && nameIndex !== -1 && nameIndex > defeatIndex) {
                            teamId = 2
                            isWinner = false
                        } else {
                            teamId = 1
                            isWinner = defeatIndex !== -1
                        }
                    }
                    teams.push(teamId)
                    winners.push(isWinner)
                }
            })

            const typeEl = $el.find('.MatchType, [class*="Type"], .matchtype').first()
            let matchType = typeEl.text().trim()
            if (!matchType || matchType === rawMatchText) {
                const matchGuess = rawMatchText.match(/^(.*?):/i)
                matchType = matchGuess ? matchGuess[1].trim() : (isFreeForAll ? 'Free-For-All Match' : 'Singles Match')
            }

            const timeEl = $el.find('.MatchTime, .Time, .time').first()
            let durationText = timeEl.text().trim()
            if (!durationText) {
                const parenMatch = rawMatchText.match(/\((\d{1,3}:\d{2})\)$/)
                if (parenMatch) durationText = parenMatch[1]
            }
            const duration = durationText ? parseDuration(durationText) : undefined

            if (wrestlers.length >= 2) {
                matches.push({
                    wrestlers,
                    teams,
                    winners,
                    type: matchType,
                    title: matchType,
                    duration,
                    result: rawMatchText.replace(/\(\d+:\d+\)/, '').trim(),
                })
            }
        })
    }
    return matches
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function slugify(name: string) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

function parseDuration(text: string): number | undefined {
    const colonMatch = text.match(/(\d+):(\d+)/)
    if (colonMatch) return parseInt(colonMatch[1]) * 60 + parseInt(colonMatch[2])
    const minMatch = text.match(/(\d+)\s*min/i)
    if (minMatch) return parseInt(minMatch[1]) * 60
    return undefined
}

export async function importMatchesFromCagematch(eventId: string, url: string) {
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    if (!res.ok) throw new Error('Cagematch fetch failed')
    const html = await res.text()
    const parsedMatches = await parseCagematchHtml(html)

    const existingWrestlers = await prisma.wrestler.findMany()
    const wrestlerByName = new Map(existingWrestlers.map(w => [w.name.toLowerCase(), w]))

    for (const parsed of parsedMatches) {
        const participants = []
        for (let i = 0; i < parsed.wrestlers.length; i++) {
            const rawName = parsed.wrestlers[i]
            const key = rawName.toLowerCase()
            let wrestler = wrestlerByName.get(key)

            if (!wrestler) {
                for (const [k, w] of wrestlerByName) {
                    if (k.includes(key) || key.includes(k)) {
                        wrestler = w
                        break
                    }
                }
            }

            if (!wrestler) {
                wrestler = await prisma.wrestler.create({
                    data: { name: rawName, slug: await uniqueWrestlerSlug(rawName) }
                })
                wrestlerByName.set(key, wrestler)
            }

            participants.push({
                wrestlerId: wrestler.id,
                team: parsed.teams[i],
                isWinner: parsed.winners[i]
            })
        }

        await prisma.match.create({
            data: {
                eventId,
                title: parsed.title,
                type: parsed.type,
                result: parsed.result || null,
                duration: parsed.duration || null,
                participants: { create: participants }
            }
        })
    }
}
