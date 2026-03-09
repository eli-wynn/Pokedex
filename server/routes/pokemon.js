
const express = require('express');
const router = express.Router();
const axios = require('axios');

const POKEAPI = 'https://pokeapi.co/api/v2'

// Get all Pokemon
router.get('/pokemon', async (req, res) => {
    try {
        const response = await axios.get(`${POKEAPI}/pokemon?limit=151`)
        res.json(response.data.results)
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch Pokemon' })
    }
})

// Get Pokemon by ID
router.get('/pokemon/:id', async (req, res) => {
    try {
        const { id } = req.params
        const response = await axios.get(`${POKEAPI}/pokemon/${id}`)
        const data = response.data
        // console.log(data)

        res.json({
            id: data.id,
            name: data.name,
            sprite: data.sprites.front_default,
            abilities: data.abilities.map(ability => ability.ability.name),
            types: data.types.map(type => type.type.name),
            moves: data.moves.filter(m => m.version_group_details.some(v => v.move_learn_method.name === 'level-up')).map(m => m.move.name), // only include moves learned by leveling up
            stats: data.stats.map(stat => ({
                name: stat.stat.name,
                value: stat.base_stat
            })),
            height: data.height,
            weight: data.weight
        
        })
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch Pokemon details' })
    }
})

router.get('/types', async (req, res) => {
    try {
        const response = await axios.get(`${POKEAPI}/type`)
        const filtered = response.data.results.filter(
            type => type.name !== 'stellar' && type.name !== 'unknown' 
        )
        res.json(filtered)
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch Pokemon types' })
    }
})

module.exports = router