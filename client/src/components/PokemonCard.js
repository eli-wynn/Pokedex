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
    const [failed, setFailed] = useState(false)
    const [retryCount, setRetryCount] = useState(0)

    useEffect(() => {
        if (cached) {
            setDetails(cached)
            setFailed(false)
            return // already have details, skip fetch
        }
        let cancelled = false
        setFailed(false)
        const fetchDetails = async () => {
            try {
                const res = await queuedGet(`${process.env.REACT_APP_API_URL}/api/pokemon/${id}`)
                if (cancelled) return
                setDetails(res.data)
                registerDetails(id, res.data)
            } catch (err) {
                if (!cancelled) {
                    console.error(`Failed to fetch details for ${name}`, err)
                    setFailed(true)
                }
            }
        }
        fetchDetails()
        return () => { cancelled = true }
        // retryCount is intentionally in the deps: it exists only to force
        // this effect to re-run when the user taps "retry" after the
        // request queue's own automatic retries were exhausted.
    }, [id, name, cached, registerDetails, retryCount])

    const goToDetail = () => {
        // Row index (not raw scrollY) survives the virtualized grid
        // re-measuring row heights on remount.
        if (rowIndex != null) sessionStorage.setItem('scrollRowIndex', rowIndex)
        navigate(`/pokemon/${id}`)
    }

    if (failed) {
        return (
            <button
                type="button"
                className="pokemon-card loading failed"
                onClick={() => { setFailed(false); setRetryCount(c => c + 1) }}
            >
                Couldn't load — tap to retry
            </button>
        )
    }

    if (!details) return <div className="pokemon-card loading">Loading...</div>

    return (
        <div
            className="pokemon-card"
            role="link"
            tabIndex={0}
            aria-label={`View details for ${details.name}`}
            onClick={goToDetail}
            onKeyDown={(e) => {
                if (e.key === 'Enter') goToDetail()
            }}
        >
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
