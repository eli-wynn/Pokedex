import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import './App.css'
import { PokemonProvider } from './context/PokemonContext'

const PokemonDetail = lazy(() => import('./pages/PokemonDetail'))

function App() {
  return (
    <PokemonProvider>
    <Router>
      <div className="app-container">
        <Suspense fallback={<p>Loading...</p>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/pokemon/:id" element={<PokemonDetail />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
    </PokemonProvider>
  )
}

export default App
