import { Vibrant } from 'node-vibrant/node'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs'

function toRgb(swatch: { rgb: number[] } | null | undefined): string | null {
    if (!swatch) return null
    const [r, g, b] = swatch.rgb
    return `${Math.round(r)},${Math.round(g)},${Math.round(b)}`
}

async function getImageBuffer(url: string): Promise<Buffer | null> {
    try {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            // Remote URL — fetch as buffer
            const res = await fetch(url)
            if (!res.ok) return null
            const ab = await res.arrayBuffer()
            return Buffer.from(ab)
        } else {
            // Local path e.g. /uploads/foo.webp
            const filePath = path.join(process.cwd(), 'public', url)
            if (!fs.existsSync(filePath)) return null
            return fs.readFileSync(filePath)
        }
    } catch {
        return null
    }
}

export async function getPosterColors(url: string | null | undefined): Promise<[string, string, string]> {
    const fallback: [string, string, string] = ['20,20,30', '10,10,20', '5,5,15']
    if (!url) return fallback

    try {
        const rawBuffer = await getImageBuffer(url)
        if (!rawBuffer) return fallback

        // Convert to JPEG via sharp — handles webp, avif, png, jpg, etc.
        const jpegBuffer = await sharp(rawBuffer)
            .resize(200, 300, { fit: 'cover' }) // downsample for speed
            .jpeg({ quality: 80 })
            .toBuffer()

        const palette = await Vibrant.from(jpegBuffer).getPalette()

        const c1 = toRgb(palette.Vibrant)      ?? toRgb(palette.LightVibrant) ?? '80,40,20'
        const c2 = toRgb(palette.DarkVibrant)  ?? toRgb(palette.Muted)        ?? c1
        const c3 = toRgb(palette.DarkMuted)    ?? toRgb(palette.LightMuted)   ?? c2

        return [c1, c2, c3]
    } catch (e) {
        console.log('[poster-color] error for', url, (e as any)?.message)
        return fallback
    }
}
