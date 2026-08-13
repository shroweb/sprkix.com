import { cache } from "react";
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

/**
 * Cloudflare Workers bind I/O (sockets, streams) to the request that created
 * it. A single global Prisma client therefore fails on cold start / concurrent
 * requests with "Cannot perform I/O on behalf of a different request".
 *
 * OpenNext's documented fix is a per-request client. We expose it through the
 * same `prisma` export every route already imports, memoized per request with
 * React's `cache()`.
 */
const createClient = cache(() => {
    const adapter = new PrismaNeon({
        connectionString: process.env.DATABASE_URL ?? 'postgresql://localhost:5432/postgres',
        // Fresh connection per request — never reuse sockets across requests.
        maxUses: 1,
    })
    return new PrismaClient({ adapter })
})

function getClient(): PrismaClient {
    return createClient()
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
    get(_target, prop, receiver) {
        const client = getClient()
        const value = Reflect.get(client as unknown as object, prop, receiver)
        // Bind client-level methods ($transaction, $connect, …) to the real
        // client so `this` is correct when called through the proxy.
        return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(client) : value
    },
    has(_target, prop) {
        return prop in getClient()
    },
    set() {
        throw new Error('prisma is read-only')
    },
})
