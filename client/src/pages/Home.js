import React, { useState, useEffect, useRef, useLayoutEffect, useMemo, useCallback } from 'react'
import axios from 'axios'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import PokemonCard from '../components/PokemonCard'
import SearchBar from '../components/SearchBar'
import TypeFilter from '../components/TypeFilter'
import './Home.css'
import { useSearchParams } from 'react-router-dom'
import { usePokemon } from '../context/PokemonContext'
import GenFilter from '../components/GenFilter'
import { queuedGet } from '../utils/requestQueue'

// Mirrors the .pokemon-grid CSS rule (grid-template-columns: repeat(auto-fill,
// minmax(150px, 1fr))) so the JS-side row chunking used for virtualization
// produces exactly as many columns per row as the CSS itself would render.
const CARD_MIN_WIDTH = 150
const CARD_GAP = 20
const ESTIMATED_ROW_HEIGHT = 280

function computeColumnCount(containerWidth) {
    if (!containerWidth) return 1
    return Math.max(1, Math.floor((containerWidth + CARD_GAP) / (CARD_MIN_WIDTH + CARD_GAP)))
}

function Home() {
    const [pokemon, setPokemon] = useState([])
    const [types, setTypes] = useState([])
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState(false)
    const [fetchAttempt, setFetchAttempt] = useState(0)
    const [selectedGens, setSelectedGens] = useState(() => {
        const saved = sessionStorage.getItem('selectedGens')
        return saved ? JSON.parse(saved) : []
    })
    const [searchParams, setSearchParams] = useSearchParams()
    const { pokemonDetails, registerDetails } = usePokemon()
    const homeRef = useRef(null)
    const gridRef = useRef(null)
    const gridOffsetRef = useRef(0)
    // Seed with the viewport width so the first render already picks close
    // to the right column count instead of flashing a single column before
    // the ResizeObserver below can measure the real container.
    const [containerWidth, setContainerWidth] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth : 0
    )

    const search = searchParams.get('search') || ''
    const selectedType = searchParams.get('type') || ''
    const selectedRarity = searchParams.get('rarity') || ''

    const setSearch = (value) => {
        setSearchParams(prev => {
            if (value) prev.set('search', value)
            else prev.delete('search')
            return prev
        })
    }

    const setSelectedType = (value) => {
        setSearchParams(prev => {
            if (value) prev.set('type', value)
            else prev.delete('type')
            return prev
        })
    }

    const setSelectedRarity = (value) => {
        setSearchParams(prev => {
            if (value) prev.set('rarity', value)
            else prev.delete('rarity')
            return prev
        })
    }

    // save selectedGens to sessionStorage whenever it changes
    useEffect(() => {
        sessionStorage.setItem('selectedGens', JSON.stringify(selectedGens))
    }, [selectedGens])

    // track available width so the virtualized rows use the same column
    // count the .pokemon-grid CSS (auto-fill) would have produced. Observes
    // the always-mounted .home container (not the grid itself, which
    // unmounts whenever a search/filter yields zero results) so resizes
    // during an empty-results state aren't missed.
    useLayoutEffect(() => {
        if (!homeRef.current) return
        const el = homeRef.current
        const observer = new ResizeObserver(entries => {
            setContainerWidth(entries[0].contentRect.width)
        })
        observer.observe(el)
        setContainerWidth(el.getBoundingClientRect().width)
        return () => observer.disconnect()
    }, [loading])

    useLayoutEffect(() => {
        gridOffsetRef.current = gridRef.current?.offsetTop ?? 0
    }, [loading])

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            setFetchError(false)
            try {
                const gensToFetch = selectedGens.length > 0
                    ? selectedGens
                    : [{ offset: 0, limit: 905 }]

                const [pokemonResults, typesRes] = await Promise.all([
                    Promise.all(
                        gensToFetch.map(gen =>
                            axios.get(`${process.env.REACT_APP_API_URL}/api/pokemon?offset=${gen.offset}&limit=${gen.limit}`)
                        )
                    ),
                    axios.get(`${process.env.REACT_APP_API_URL}/api/types`)
                ])

                const combined = pokemonResults.flatMap(r => r.data)
                const unique = [...new Map(combined.map(p => [p.name, p])).values()]
                setPokemon(unique)
                setTypes(typesRes.data)
            } catch (err) {
                console.error('Failed to fetch data', err)
                setFetchError(true)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [selectedGens, fetchAttempt])

    // The type/rarity filters need every Pokemon's details (type, legendary/
    // mythical) to know what matches, but virtualization only fetches cards
    // that actually get mounted (near the viewport). Without this, filtering
    // silently only searches whatever's already been scrolled past. When a
    // details-dependent filter is active, backfill details for the whole
    // (currently loaded) list in the background, still through the same
    // concurrency-limited/deduped/retrying queue as card mounts use.
    useEffect(() => {
        if (!selectedType && !selectedRarity) return
        let cancelled = false
        pokemon.forEach(p => {
            const id = p.url.split('/').slice(-2, -1)[0]
            if (pokemonDetails[id]) return
            queuedGet(`${process.env.REACT_APP_API_URL}/api/pokemon/${id}`)
                .then(res => { if (!cancelled) registerDetails(id, res.data) })
                .catch(err => { if (!cancelled) console.error(`Failed to fetch details for ${p.name}`, err) })
        })
        return () => { cancelled = true }
    }, [selectedType, selectedRarity, pokemon, pokemonDetails, registerDetails])

    const filteredPokemon = pokemon.filter(p => {
        const id = p.url.split('/').slice(-2, -1)[0]
        const details = pokemonDetails[id]

        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            id.includes(search)

        const matchesType = !selectedType ||
            (details && details.types.includes(selectedType))

        const matchesRarity = !selectedRarity ||
            (selectedRarity === 'legendary' && details?.isLegendary) ||
            (selectedRarity === 'mythical' && details?.isMythical)

        return matchesSearch && matchesType && matchesRarity
    })

    const columnCount = computeColumnCount(containerWidth)
    const rows = useMemo(() => {
        const chunked = []
        for (let i = 0; i < filteredPokemon.length; i += columnCount) {
            chunked.push(filteredPokemon.slice(i, i + columnCount))
        }
        return chunked
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredPokemon, columnCount])

    const getScrollMargin = useCallback(() => gridOffsetRef.current, [])

    const rowVirtualizer = useWindowVirtualizer({
        count: rows.length,
        estimateSize: () => ESTIMATED_ROW_HEIGHT,
        overscan: 3,
        scrollMargin: getScrollMargin(),
    })

    // restore scroll position (by row, not raw pixels) when navigating back
    useEffect(() => {
        if (loading || rows.length === 0) return
        const saved = sessionStorage.getItem('scrollRowIndex')
        if (saved == null) return
        const index = Math.min(Number(saved), rows.length - 1)
        rowVirtualizer.scrollToIndex(index, { align: 'start' })
        // Row heights start from an estimate and get corrected as they're
        // measured; scroll again once that settles so the target row ends
        // up under the same offset it estimated on the first pass.
        const raf = requestAnimationFrame(() => {
            rowVirtualizer.scrollToIndex(index, { align: 'start' })
            sessionStorage.removeItem('scrollRowIndex')
        })
        return () => cancelAnimationFrame(raf)
    }, [loading, rows.length, rowVirtualizer])

    if (loading) return <p>Loading Pokédex...</p>

    if (fetchError) {
        return (
            <div className="home">
                <p>Couldn't load the Pokédex. Check your connection and try again.</p>
                <button type="button" onClick={() => setFetchAttempt(a => a + 1)}>
                    Retry
                </button>
            </div>
        )
    }

    return (

        <div className="home" ref={homeRef}>
            <h1>Eli's Pokédex</h1>
            <div className="filters">
                <SearchBar search={search} setSearch={setSearch} />
                <TypeFilter types={types} selectedType={selectedType} setSelectedType={setSelectedType} />
                <GenFilter selectedGens={selectedGens} setSelectedGens={setSelectedGens} />
                <div className="rarity-filter">
                    {['', 'legendary', 'mythical'].map(rarity => (
                        <button
                            key={rarity || 'all'}
                            className={`rarity-button ${selectedRarity === rarity ? 'active' : ''}`}
                            onClick={() => setSelectedRarity(rarity)}
                        >
                            {rarity === '' ? 'All' : rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
            <h2 className="visually-hidden">Pokémon list</h2>
            {filteredPokemon.length > 0
                ? (
                    <div ref={gridRef} style={{ position: 'relative', width: '100%', height: rowVirtualizer.getTotalSize() }}>
                        {rowVirtualizer.getVirtualItems().map(virtualRow => (
                            <div
                                key={virtualRow.key}
                                data-index={virtualRow.index}
                                ref={rowVirtualizer.measureElement}
                                className="pokemon-grid"
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    transform: `translateY(${virtualRow.start - rowVirtualizer.options.scrollMargin}px)`,
                                }}
                            >
                                {rows[virtualRow.index].map(p => (
                                    <PokemonCard
                                        key={p.name}
                                        name={p.name}
                                        url={p.url}
                                        rowIndex={virtualRow.index}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                )
                : <p>No Pokémon found.</p>
            }
        </div>
    )
}

export default Home