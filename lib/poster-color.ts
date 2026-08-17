// Extracts dominant poster colors for themed gradients.
//
// Decodes the poster via node-vibrant (pure-JS jimp), so JPEG/PNG posters get
// accurate palettes everywhere. WebP posters fall back to the default palette
// (native decoders like sharp can't run on Cloudflare Workers).

function toRgb(swatch: { rgb: number[] } | null | undefined): string | null {
    if (!swatch) return null
    const [r, g, b] = swatch.rgb
    return `${Math.round(r)},${Math.round(g)},${Math.round(b)}`
}

async function getImageBuffer(url: string): Promise<Buffer | null> {
    try {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            const res = await fetch(url)
            if (!res.ok) return null
            const ab = await res.arrayBuffer()
            return Buffer.from(ab)
        } else {
            // Local path e.g. /media/foo.webp (dev-only filesystem fallback)
            const { readFile } = await import('fs/promises')
            const { join } = await import('path')
            return await readFile(join(process.cwd(), 'public', url))
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

        const { Vibrant } = await import('node-vibrant/node')
        const palette = await Vibrant.from(rawBuffer).getPalette()

        const c1 = toRgb(palette.Vibrant)      ?? toRgb(palette.LightVibrant) ?? '80,40,20'
        const c2 = toRgb(palette.DarkVibrant)  ?? toRgb(palette.Muted)        ?? c1
        const c3 = toRgb(palette.DarkMuted)    ?? toRgb(palette.LightMuted)   ?? c2

        return [c1, c2, c3]
    } catch (e) {
        console.log('[poster-color] error for', url, (e as any)?.message)
        return fallback
    }
}
