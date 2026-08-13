import React, { useEffect, useRef, useState } from 'react'
import './TypeFilter.css'

function TypeFilter({ types, selectedType, setSelectedType }) {
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

    return (
        <div className="type-filter" ref={containerRef}>
            <button
                type="button"
                className="dropdown-toggle"
                aria-haspopup="true"
                aria-expanded={isOpen}
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedType ? (
                    <span className={`type-badge ${selectedType}`}>
                        {selectedType}
                    </span>
                ) : 'All Types'}
                <span className="dropdown-arrow" aria-hidden="true">{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
                <div className="dropdown-list">
                    <button
                        type="button"
                        className="type-badge all-types"
                        aria-pressed={!selectedType}
                        onClick={() => {
                            setSelectedType('')
                            setIsOpen(false)
                        }}
                    >
                        All Types
                    </button>
                    {types.map(type => (
                        <button
                            type="button"
                            key={type.name}
                            className={`type-badge ${type.name}`}
                            aria-pressed={selectedType === type.name}
                            onClick={() => {
                                setSelectedType(type.name)
                                setIsOpen(false)
                            }}
                        >
                            {type.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export default TypeFilter
