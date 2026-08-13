import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'

const PokemonContext = createContext()

export function PokemonProvider({ children }) {
    const [pokemonDetails, setPokemonDetails] = useState({})

    // Stable identity: registering one Pokemon's details must not change
    // this function's reference, or every mounted PokemonCard's useEffect
    // (which depends on it) re-fires on every single detail load.
    const registerDetails = useCallback((id, details) => {
        setPokemonDetails(prev => (
            prev[id] ? prev : { ...prev, [id]: details }
        ))
    }, [])

    const value = useMemo(() => ({ pokemonDetails, registerDetails }), [pokemonDetails, registerDetails])

    return (
        <PokemonContext.Provider value={value}>
            {children}
        </PokemonContext.Provider>
    )
}

export function usePokemon() {
    return useContext(PokemonContext)
}