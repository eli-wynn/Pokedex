import React, { createContext, useContext, useState } from 'react'

const PokemonContext = createContext()

export function PokemonProvider({ children }) {
    const [pokemonDetails, setPokemonDetails] = useState({})

    const registerDetails = (id, details) => {
        setPokemonDetails(prev => ({ ...prev, [id]: details }))
    }

    return (
        <PokemonContext.Provider value={{ pokemonDetails, registerDetails }}>
            {children}
        </PokemonContext.Provider>
    )
}

export function usePokemon() {
    return useContext(PokemonContext)
}