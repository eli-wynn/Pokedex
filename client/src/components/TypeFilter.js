import React from 'react'
import './TypeFilter.css'


function TypeFilter({ types, selectedType, setSelectedType }) {
    const [isOpen, setIsOpen] = React.useState(false)

    return (
        <div className="type-filter">
            <div className="dropdown-toggle" onClick={() => setIsOpen(!isOpen)}>
                {selectedType ? (
                    <span className={`type-badge ${selectedType}`}>
                        {selectedType}
                    </span>
                ) : 'All Types'}
                <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
            </div>

            {isOpen && (
                <div className="dropdown-list">
                    <span
                        className="type-badge all-types"
                        onClick={() => {
                            setSelectedType('')
                            setIsOpen(false)
                        }}
                    >
                        All Types
                    </span>
                    {types.map(type => (
                        <span
                            key={type.name}
                            className={`type-badge ${type.name}`}
                            onClick={() => {
                                setSelectedType(type.name)
                                setIsOpen(false)
                            }}
                        >
                            {type.name}
                        </span>
                    ))}
                </div>
            )}
        </div>
    )
}

export default TypeFilter