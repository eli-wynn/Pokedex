import React, { useState } from 'react'
import './GenFilter.css'

const GENERATIONS = [
    { label: 'Gen I',    offset: 0,   limit: 151 },
    { label: 'Gen II',   offset: 151, limit: 100 },
    { label: 'Gen III',  offset: 251, limit: 135 },
    { label: 'Gen IV',   offset: 386, limit: 107 },
    { label: 'Gen V',    offset: 493, limit: 156 },
    { label: 'Gen VI',   offset: 649, limit: 72  },
    { label: 'Gen VII',  offset: 721, limit: 88  },
    { label: 'Gen VIII', offset: 809, limit: 96  },
]

function GenFilter({ selectedGens, setSelectedGens }) {
    const [isOpen, setIsOpen] = useState(false)

    const toggleGen = (gen) => {
        setSelectedGens(prev =>
            prev.find(g => g.label === gen.label)
                ? prev.filter(g => g.label !== gen.label)
                : [...prev, gen]
        )
    }

    const isActive = (gen) => selectedGens.some(g => g.label === gen.label)
    const label = selectedGens.length === 0
        ? 'All Gens'
        : selectedGens.map(g => g.label).join(', ')

    return (
        <div className="gen-filter">
            <div className="gen-toggle" onClick={() => setIsOpen(!isOpen)}>
                <span>{label}</span>
                <span className="gen-arrow">{isOpen ? '▲' : '▼'}</span>
            </div>

            {isOpen && (
                <div className="gen-dropdown">
                    {/* All button resets selection */}
                    <div
                        className={`gen-option ${selectedGens.length === 0 ? 'active' : ''}`}
                        onClick={() => {
                            setSelectedGens([])
                            setIsOpen(false)
                        }}
                    >
                        All
                    </div>
                    {GENERATIONS.map(gen => (
                        <div
                            key={gen.label}
                            className={`gen-option ${isActive(gen) ? 'active' : ''}`}
                            onClick={() => toggleGen(gen)}
                        >
                            {gen.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default GenFilter
export { GENERATIONS }