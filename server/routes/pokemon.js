
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
       const [pokemonRes, speciesRes] = await Promise.all([
            axios.get(`${POKEAPI}/pokemon/${id}`),
            axios.get(`${POKEAPI}/pokemon-species/${id}`)
        ])
        const data = pokemonRes.data
        const species = speciesRes.data

        const description = species.flavor_text_entries
            .find(e => e.language.name === 'en')
            ?.flavor_text
            .replace(/[\n\f]/g, ' ')
        // console.log(data)

        res.json({
            id: data.id,
            name: data.name,
            description: description,
            sprite: data.sprites.front_default,
            abilities: data.abilities.map(a => ({
                ability: a.ability.name,
                hidden: a.is_hidden
            })),
            types: data.types.map(type => type.type.name),
            moves: data.moves.filter(m => m.version_group_details.some(v => v.move_learn_method.name === 'level-up')).map(m => m.move.name), // only include moves learned by leveling up
            stats: data.stats.map(stat => ({
                name: stat.stat.name,
                value: stat.base_stat
            })),
            height: data.height,
            weight: data.weight,
        
        })
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch Pokemon details' })
    }
})

// Get Ability Information
router.get('/ability/:name', async (req, res) => {
    try {
        const { name } = req.params
        const response = await axios.get(`${POKEAPI}/ability/${name}`)
        const data = response.data

        const description = data.effect_entries
            .find(e => e.language.name === 'en')
            ?.short_effect

        res.json({
            name: data.name,
            description
        })
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch Ability information' })
    }
})

// Get all Pokemon types
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