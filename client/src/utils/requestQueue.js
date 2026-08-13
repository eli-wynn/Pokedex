import axios from 'axios'

// Caps how many requests from this queue are in flight at once. Mounting
// hundreds of PokemonCards at the same time previously fired one axios call
// per card with no limit, which blows past the browser's per-host connection
// ceiling (net::ERR_INSUFFICIENT_RESOURCES) and the free-tier backend's
// capacity alike.
const MAX_CONCURRENT = 6
const MAX_RETRIES = 3
const BASE_DELAY_MS = 400

let activeCount = 0
const queue = []
const inFlight = new Map()

function runNext() {
    if (activeCount >= MAX_CONCURRENT || queue.length === 0) return
    activeCount++
    const { task, resolve, reject } = queue.shift()
    task()
        .then(resolve, reject)
        .finally(() => {
            activeCount--
            runNext()
        })
}

function enqueue(task) {
    return new Promise((resolve, reject) => {
        queue.push({ task, resolve, reject })
        runNext()
    })
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// Retries network errors and 5xx responses (transient); does not retry 4xx.
async function withRetry(fn) {
    let attempt = 0
    for (;;) {
        try {
            return await fn()
        } catch (err) {
            const status = err.response?.status
            const isClientError = status >= 400 && status < 500
            if (isClientError || attempt >= MAX_RETRIES) throw err
            const jitter = Math.random() * BASE_DELAY_MS
            await sleep(BASE_DELAY_MS * 2 ** attempt + jitter)
            attempt++
        }
    }
}

// Concurrency-limited, retrying, deduped GET. Use for bursty per-item
// fetches (e.g. one call per rendered card) instead of raw axios.get.
// Deduping matters here specifically: a card's own mount effect and any
// bulk background fetch (e.g. "load everything so a filter can search it")
// can both ask for the same id while a request is still in flight; without
// this they'd double up and re-trigger the same amplification bug fixed
// elsewhere in this file's callers.
export function queuedGet(url, config) {
    if (inFlight.has(url)) return inFlight.get(url)
    const promise = enqueue(() => withRetry(() => axios.get(url, config)))
    inFlight.set(url, promise)
    // Deferred via setTimeout (a macrotask) rather than chained onto the
    // promise directly (a microtask): callers' own .then() handlers -
    // e.g. registerDetails - are also microtasks queued off this same
    // promise, and a plain .finally() here could run its cleanup before
    // them, reopening a window where a second caller sees neither a
    // cached result nor an in-flight entry and fires a duplicate request.
    promise.finally(() => setTimeout(() => inFlight.delete(url), 0))
    return promise
}
