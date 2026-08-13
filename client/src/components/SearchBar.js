import React from 'react'
import './SearchBar.css'

function SearchBar({ search, setSearch }) {
    return (
        <div className="search-bar">
            <input
                type="text"
                aria-label="Search Pokémon by name or number"
                placeholder="Search by name or number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>
    )
}

export default SearchBar