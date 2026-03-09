import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import PokemonCard from '../components/PokemonCard'
import SearchBar from '../components/SearchBar'
import TypeFilter from '../components/TypeFilter'
import './Home.css'

function Home() {
    const [pokemon, setPokemon] = useState([])
    const [pokemonDetails, setPokemonDetails] = useState({})
    const [types, setTypes] = useState([])
    const [search, setSearch] = useState('')
    const [selectedType, setSelectedType] = useState('')
    const [loading, setLoading] = useState(true)

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

    // called by each PokemonCard once it has fetched its details
    const registerDetails = useCallback((id, details) => {
        setPokemonDetails(prev => ({ ...prev, [id]: details }))
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
            <div className="pokemon-grid">
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