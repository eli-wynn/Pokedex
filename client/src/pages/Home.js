import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import PokemonCard from '../components/PokemonCard'
import SearchBar from '../components/SearchBar'
import TypeFilter from '../components/TypeFilter'
import './Home.css'
import { useSearchParams, useLocation } from 'react-router-dom'
import { usePokemon } from '../context/PokemonContext'

function Home() {
    console.log('Home component rendered')
    const [pokemon, setPokemon] = useState([])
    const [types, setTypes] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchParams, setSearchParams] = useSearchParams()
    const location = useLocation()
    const { pokemonDetails, registerDetails } = usePokemon()
    const search = searchParams.get('search') || ''
    const selectedType = searchParams.get('type') || ''
    const gridRef = useRef(null)

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

    // restore scroll position when navigating back
    useEffect(() => {
        if (loading || !gridRef.current) return

        const savedScroll = sessionStorage.getItem('scrollY')
        if (!savedScroll) return

        const observer = new ResizeObserver(() => {
            const gridHeight = gridRef.current?.scrollHeight
            if (gridHeight > window.innerHeight) {
                window.scrollTo(0, parseInt(savedScroll))
                sessionStorage.removeItem('scrollY') // clear after restoring
                observer.disconnect()
            }
        })

        observer.observe(gridRef.current)
        return () => observer.disconnect()
    }, [loading])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pokemonRes, typesRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/pokemon'),
                    axios.get('http://localhost:5000/api/types')
                ])
                setPokemon(pokemonRes.data)
                setTypes(typesRes.data)
            } catch (err) {
                console.error('Failed to fetch data', err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const filteredPokemon = pokemon.filter(p => {
        const id = p.url.split('/').slice(-2, -1)[0]
        const details = pokemonDetails[id]

        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            id.includes(search)

        const matchesType = !selectedType ||
            (details && details.types.includes(selectedType))

        return matchesSearch && matchesType
    })

    if (loading) return <p>Loading Pokédex...</p>

    return (
        <div className="home">
            <h1>Eli's Pokédex</h1>
            <div className="filters">
                <SearchBar search={search} setSearch={setSearch} />
                <TypeFilter types={types} selectedType={selectedType} setSelectedType={setSelectedType} />
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