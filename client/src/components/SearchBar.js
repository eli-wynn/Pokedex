import React from 'react'
import './SearchBar.css'

function SearchBar({ search, setSearch }) {
    return (
        <div className="search-bar">
            <input
                type="text"
                placeholder="Search by name or number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>
    )
}

export default SearchBar