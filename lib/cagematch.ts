import { prisma } from './prisma'
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

export function parseProfightDbHtml(html: string): ParsedMatch[] {
    const $ = cheerio.load(html)
    const matches: ParsedMatch[] = []

    // ProfightDB: each match is a <tr> that contains wrestler links (/wrestlers/...)
    $('table tr').each((_, tr) => {
        const $tr = $(tr)
        const text = $tr.text().trim()
        if (!text) return

        // Collect wrestler names from links
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

        // Match type: look for a short td that isn't a number and doesn't contain wrestler names
        let matchType = 'Singles Match'
        $tr.find('td').each((_, td) => {
            const t = $(td).text().trim()
            if (!t || /^\d+$/.test(t)) return
            if (t.length < 80 && !wrestlerLinks.some(w => t.includes(w))) {
                matchType = t
                return false // break
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

export function parseHtmlForSite(url: string, html: string): ParsedMatch[] {
    if (url.includes('profightdb.com')) {
        return parseProfightDbHtml(html)
    }
    // Default: cagematch
    return [] // will be filled by parseCagematchHtml caller
}

function slugify(name: string) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

function parseDuration(text: string): number | undefined {
    const colonMatch = text.match(/(\d+):(\d+)/)
    // Return total seconds (minutes * 60 + seconds)
    if (colonMatch) return parseInt(colonMatch[1]) * 60 + parseInt(colonMatch[2])
    const minMatch = text.match(/(\d+)\s*min/i)
    if (minMatch) return parseInt(minMatch[1]) * 60
    return undefined
}

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
            const defeatIndex = lowerText.indexOf(' defeats ') !== -1 ? lowerText.indexOf(' defeats ') : (lowerText.indexOf(' def. ') !== -1 ? lowerText.indexOf(' def. ') : -1)

            $clean('a').each((_, a) => {
                const href = $clean(a).attr('href') || ''
                if (href.includes('id=2')) {
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
                // Fuzzy check
                for (const [k, w] of wrestlerByName) {
                    if (k.includes(key) || key.includes(k)) {
                        wrestler = w
                        break
                    }
                }
            }

            if (!wrestler) {
                wrestler = await prisma.wrestler.create({
                    data: { name: rawName, slug: slugify(rawName) + '-' + Date.now() }
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
