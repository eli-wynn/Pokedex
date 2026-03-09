import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { usePokemon } from '../context/PokemonContext'
import './PokemonCard.css'

function PokemonCard({ name, url, onDetailsLoaded }) {
    const { pokemonDetails, registerDetails } = usePokemon()
    const navigate = useNavigate()
    const id = url.split('/').slice(-2, -1)[0]
    const cached = pokemonDetails[id]
    const [details, setDetails] = useState(cached || null)

    useEffect(() => {
        if (cached) return // already have details, skip fetch
        const fetchDetails = async () => {
            try {
                const res = await axios.get(`${process.env.URL}/api/pokemon/${id}`)
                setDetails(res.data)
                registerDetails(id, res.data)
                onDetailsLoaded(id, res.data)
            } catch (err) {
                console.error(`Failed to fetch details for ${name}`, err)
            }
        }
        fetchDetails()
    }, [id, name, cached, onDetailsLoaded, registerDetails])

    if (!details) return <div className="pokemon-card loading">Loading...</div>

    return (
        <div className="pokemon-card" onClick={() => {
            sessionStorage.setItem('scrollY', window.scrollY)
            navigate(`/pokemon/${id}`)
        }}>
            <img className="pokemon-image" src={details.sprite} alt={details.name} />
            <h3>
                <span className="pokemon-number">#{String(details.id).padStart(3, '0')}</span>
                <span className="pokemon-name">{details.name}</span>
            </h3>
            <div className="types">
                {details.types.map(type => (
                    <span key={type} className={`type-badge ${type}`}>
                        {type}
                    </span>
                ))}
            </div>
        </div>
    )
}

export default PokemonCard