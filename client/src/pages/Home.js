import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import PokemonCard from '../components/PokemonCard'
import SearchBar from '../components/SearchBar'
import TypeFilter from '../components/TypeFilter'
import './Home.css'
import { useSearchParams, useLocation } from 'react-router-dom'
import { usePokemon } from '../context/PokemonContext'
import GenFilter, { GENERATIONS } from '../components/GenFilter'

function Home() {
    const [pokemon, setPokemon] = useState([])
    const [types, setTypes] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedGens, setSelectedGens] = useState(() => {
        const saved = sessionStorage.getItem('selectedGens')
        return saved ? JSON.parse(saved) : []
    })
    const [searchParams, setSearchParams] = useSearchParams()
    const location = useLocation()
    const { pokemonDetails, registerDetails } = usePokemon()
    const gridRef = useRef(null)

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

    // restore scroll position when navigating back
    useEffect(() => {
        if (loading || !gridRef.current) return

        const savedScroll = sessionStorage.getItem('scrollY')
        if (!savedScroll) return

        const observer = new ResizeObserver(() => {
            const gridHeight = gridRef.current?.scrollHeight
            if (gridHeight > window.innerHeight) {
                window.scrollTo(0, parseInt(savedScroll))
                sessionStorage.removeItem('scrollY')
                observer.disconnect()
            }
        })

        observer.observe(gridRef.current)
        return () => observer.disconnect()
    }, [loading])

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const gensToFetch = selectedGens.length > 0
                    ? selectedGens
                    : [{ offset: 0, limit: 905 }]

                const [pokemonResults, typesRes] = await Promise.all([
                    Promise.all(
                        gensToFetch.map(gen =>
                            axios.get(`http://localhost:5000/api/pokemon?offset=${gen.offset}&limit=${gen.limit}`)
                        )
                    ),
                    axios.get('http://localhost:5000/api/types')
                ])

                const combined = pokemonResults.flatMap(r => r.data)
                const unique = [...new Map(combined.map(p => [p.name, p])).values()]
                setPokemon(unique)
                setTypes(typesRes.data)
            } catch (err) {
                console.error('Failed to fetch data', err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [selectedGens])

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

    if (loading) return <p>Loading Pokédex...</p>

    return (
        <div className="home">
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
            <div className="pokemon-grid" ref={gridRef}>
                {filteredPokemon.length > 0
                    ? filteredPokemon.map(p => (
                        <PokemonCard
                            key={p.name}
                            name={p.name}
                            url={p.url}
                            onDetailsLoaded={registerDetails}
                        />
                    ))
                    : <p>No Pokémon found.</p>
                }
            </div>
        </div>
    )
}

export default Home