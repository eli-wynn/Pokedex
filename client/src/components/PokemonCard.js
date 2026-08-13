import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePokemon } from '../context/PokemonContext'
import { queuedGet } from '../utils/requestQueue'
import './PokemonCard.css'

function PokemonCard({ name, url, rowIndex }) {
    const { pokemonDetails, registerDetails } = usePokemon()
    const navigate = useNavigate()
    const id = url.split('/').slice(-2, -1)[0]
    const cached = pokemonDetails[id]
    const [details, setDetails] = useState(cached || null)

    useEffect(() => {
        if (cached) {
            setDetails(cached)
            return // already have details, skip fetch
        }
        let cancelled = false
        const fetchDetails = async () => {
            try {
                const res = await queuedGet(`${process.env.REACT_APP_API_URL}/api/pokemon/${id}`)
                if (cancelled) return
                setDetails(res.data)
                registerDetails(id, res.data)
            } catch (err) {
                if (!cancelled) console.error(`Failed to fetch details for ${name}`, err)
            }
        }
        fetchDetails()
        return () => { cancelled = true }
    }, [id, name, cached, registerDetails])

    if (!details) return <div className="pokemon-card loading">Loading...</div>

    return (
        <div className="pokemon-card" onClick={() => {
            // Row index (not raw scrollY) survives the virtualized grid
            // re-measuring row heights on remount.
            if (rowIndex != null) sessionStorage.setItem('scrollRowIndex', rowIndex)
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