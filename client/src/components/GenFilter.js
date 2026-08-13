import React, { useEffect, useRef, useState } from 'react'
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
    const containerRef = useRef(null)

    useEffect(() => {
        if (!isOpen) return

        const handlePointerDown = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false)
            }
        }
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setIsOpen(false)
        }

        document.addEventListener('mousedown', handlePointerDown)
        document.addEventListener('touchstart', handlePointerDown)
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('mousedown', handlePointerDown)
            document.removeEventListener('touchstart', handlePointerDown)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [isOpen])

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
        <div className="gen-filter" ref={containerRef}>
            <button
                type="button"
                className="gen-toggle"
                aria-haspopup="true"
                aria-expanded={isOpen}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>{label}</span>
                <span className="gen-arrow" aria-hidden="true">{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
                <div className="gen-dropdown">
                    <button
                        type="button"
                        className={`gen-option ${selectedGens.length === 0 ? 'active' : ''}`}
                        aria-pressed={selectedGens.length === 0}
                        onClick={() => {
                            setSelectedGens([])
                            setIsOpen(false)
                        }}
                    >
                        All
                    </button>
                    {GENERATIONS.map(gen => (
                        <button
                            type="button"
                            key={gen.label}
                            className={`gen-option ${isActive(gen) ? 'active' : ''}`}
                            aria-pressed={isActive(gen)}
                            onClick={() => toggleGen(gen)}
                        >
                            {gen.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export default GenFilter
export { GENERATIONS }
