import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useParams, useNavigate } from 'react-router-dom'
import './PokemonDetail.css'

function PokemonDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [pokemon, setPokemon] = useState(null)
    const [loading, setLoading] = useState(true)
    const [abilityDetails, setAbilityDetails] = useState({})
    const [isShiny] = useState(() => Math.random() < 1/10)
    useEffect(() => {
        const fetchPokemon = async () => {
            try {
                const res = await axios.get(`${process.env.URL}/api/pokemon/${id}`)
                setPokemon(res.data)
            } catch (err) {
                console.error('Failed to fetch pokemon details', err)
            } finally {
                setLoading(false)
            }
        }
        fetchPokemon()
    }, [id])

    useEffect(() => {
        if (!pokemon) return
        const fetchAbilities = async () => {
            const details = {}
            await Promise.all(
                pokemon.abilities.map(async (a) => {
                    try {
                        const res = await axios.get(`${process.env.URL}/api/ability/${a.ability}`)
                        details[a.ability] = res.data.description
                    } catch (err) {
                        console.error(`Failed to fetch ability ${a.ability}`, err)
                    }
                })
            )
            setAbilityDetails(details)
        }
        fetchAbilities()
    }, [pokemon])

    if (loading) return <p>Loading...</p>
    if (!pokemon) return <p>Pokémon not found.</p>

    const spriteStyle = pokemon.types.length === 2
    ? { background: `radial-gradient(circle, var(--type-${pokemon.types[0]}), var(--type-${pokemon.types[1]}))` }
    : { background: `radial-gradient(circle, var(--type-${pokemon.types[0]}), transparent)` }



    return (
        <div className="pokemon-detail">
            <div className="detail-buttons">
                <button onClick={() => navigate(-1)}>← Back</button>
                <button onClick={() => navigate('/')}>Home</button>
            </div>
                <div className="detail-header">
                    <div className={`sprite-container ${pokemon.isLegendary ? 'legendary' : pokemon.isMythical ? 'mythical' : ''}`} style={spriteStyle}>
                        <img src={isShiny ? pokemon.sprite_shiny : pokemon.sprite} alt={pokemon.name} />
                        {isShiny && <span className="shiny-label">✨</span>}
                    </div>
                    <div>
                        <h1>#{String(pokemon.id).padStart(3, '0')} {pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</h1>
                        <div className="types">
                            {pokemon.types.map(type => (
                                <span key={type} className={`type-badge ${type}`}>
                                    {type}
                                </span>
                            ))}
                        </div>
                        {pokemon.isLegendary && (
                            <span className="rarity-badge legendary">⭐ Legendary</span>
                        )}
                        {pokemon.isMythical && (
                            <span className="rarity-badge mythical">✨ Mythical</span>
                        )}
                        <p>Height: {pokemon.height / 10}m</p>
                        <p>Weight: {pokemon.weight / 10}kg</p>
                        <p>Generation: {pokemon.generation}</p>
                    </div>
                </div>

            <div className="detail-description">
                <p>{pokemon.description}</p>
            </div>

            <div className="detail-stats">
                <h2>Base Stats</h2>
                {pokemon.stats.map(stat => (
                    <div key={stat.name} className="stat-row">
                        <span className="stat-name">{stat.name}</span>
                        <span className="stat-value">{stat.value}</span>
                        <div className="stat-bar">
                            <div
                                className="stat-fill"
                                style={{ width: `${(stat.value / 255) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="detail-abilities">
                <h2>Abilities</h2>
                {pokemon.abilities.map(ability => (
                    <div key={ability.ability} className="ability-row">
                        <div className="ability-header">
                            <span className="ability-name">{ability.ability}</span>
                            <span className={`ability-type ${ability.hidden ? 'hidden' : 'normal'}`}>
                                {ability.hidden ? 'hidden' : 'normal'}
                            </span>
                        </div>
                        <p className="ability-description">
                            {abilityDetails[ability.ability] || 'Loading...'}
                        </p>
                    </div>
                ))}
            </div>

            <div className="detail-evolution">
                <h2>Evolution Chain</h2>
                <div className="evolution-chain">
                    {pokemon.evolutionChain.map((evo, index) => (
                        <React.Fragment key={evo.id}>
                            <div
                                className={`evolution-card ${evo.id === String(pokemon.id) ? 'current' : ''}`}
                                onClick={() => navigate(`/pokemon/${evo.id}`)}
                            >
                                <img
                                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evo.id}.png`}
                                    alt={evo.name}
                                />
                                <span>{evo.name}</span>
                            </div>
                            {index < pokemon.evolutionChain.length - 1 && (
                                <span className="evolution-arrow">→</span>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            <div className="detail-moves">
                <h2>Moves</h2>
                <ul>
                    {pokemon.moves.map(move => (
                        <li key={move}>{move}</li>
                    ))}
                </ul>
            </div>
        </div>
    )
}

export default PokemonDetail