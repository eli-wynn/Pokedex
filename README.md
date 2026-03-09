# Pokedex

A full stack Pokédex web app built with React and Node.js, powered by the [PokéAPI](https://pokeapi.co). Browse, search, and filter Pokémon across all generations with a clean, colorful UI.

🔗 **Live Demo:** [pokedex-tawny-phi.vercel.app](https://pokedex-tawny-phi.vercel.app)

---

## ✨ Features

- **Browse all Pokémon** across Generations I–VIII
- **Search** by name or Pokédex number in real time
- **Filter by type** — all 18 types with color-coded pill badges
- **Filter by generation** — multi-select dropdown (mix and match gens)
- **Filter by rarity** — quickly find Legendary and Mythical Pokémon
- **Pokémon detail page** with:
  - Type-colored radial gradient behind the sprite
  - Rotating ring effect for Legendary (gold) and Mythical (purple) Pokémon
  - Base stats with animated progress bars
  - Abilities with hidden/normal label and description
  - Level-up moves only (no TMs)
  - Evolution chain with clickable cards
  - Pokémon description and generation label
  - 1 in 10 chance of a shiny sprite on each visit 🎲
- **State persistence** — search, type, rarity and gen filters are saved when navigating back
- **Scroll position restore** — returns to exactly where you were in the grid
- **Frontend caching** via React Context — cards load instantly after first visit
- **Backend caching** via node-cache — API responses cached for 1 hour

---

## 🛠️ Tech Stack

**Frontend**
![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)

**Backend**
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat-square&logo=axios&logoColor=white)

**Deployment**
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Render-46E3B7?style=flat-square&logo=render&logoColor=black)

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org) v16+
- npm

### Installation

**1. Clone the repo**
```bash
git clone https://github.com/eli-wynn/Pokedex.git
cd Pokedex
```

**2. Set up the backend**
```bash
cd server
npm install
node server.js
```
Server runs on `http://localhost:5000`

**3. Set up the frontend**

Open a new terminal:
```bash
cd client
npm install
```

Create a `.env` file in the `client` folder:
```
REACT_APP_API_URL=http://localhost:5000
```

Then start the app:
```bash
npm start
```

App runs on `http://localhost:3000`

---

## 📡 API Documentation

All endpoints are prefixed with `/api`.

### `GET /api/pokemon`
Returns a list of Pokémon.

| Query Param | Type | Default | Description |
|-------------|------|---------|-------------|
| `offset` | number | `0` | Starting index |
| `limit` | number | `905` | Number of Pokémon to return |

**Example:**
```
GET /api/pokemon?offset=0&limit=151
```

---

### `GET /api/pokemon/:id`
Returns full details for a single Pokémon by ID or name.

**Example:**
```
GET /api/pokemon/pikachu
GET /api/pokemon/25
```

**Response:**
```json
{
  "id": 25,
  "name": "pikachu",
  "description": "When several of these Pokémon gather...",
  "sprite": "https://...",
  "sprite_shiny": "https://...",
  "types": ["electric"],
  "abilities": [{ "ability": "static", "hidden": false }],
  "stats": [{ "name": "hp", "value": 35 }],
  "moves": ["thunder-shock", "tail-whip"],
  "height": 0.4,
  "weight": 6.0,
  "generation": "Generation I",
  "isLegendary": false,
  "isMythical": false,
  "evolutionChain": [
    { "name": "pichu", "id": "172" },
    { "name": "pikachu", "id": "25" },
    { "name": "raichu", "id": "26" }
  ]
}
```

---

### `GET /api/ability/:name`
Returns the name and description of a Pokémon ability.

**Example:**
```
GET /api/ability/static
```

**Response:**
```json
{
  "name": "static",
  "description": "The Pokémon is charged with static electricity..."
}
```

---

### `GET /api/types`
Returns all 18 Pokémon types (excludes `stellar` and `unknown`).

**Example:**
```
GET /api/types
```

---

## 🔮 Future Improvements

- [ ] Pokémon comparison tool — compare stats side by side
- [ ] Favourite/save Pokémon with persistent storage
- [ ] Type effectiveness chart on the detail page
- [ ] Animated sprite support
- [ ] Expand to Generation IX
- [ ] Loading skeleton cards instead of plain loading text
- [ ] Mobile responsiveness improvements
- [ ] Dark/light theme toggle

---

## 📸 Screenshots

> Add screenshots of your app here by dragging images into the GitHub editor!

| Home Page | Detail Page |
|-----------|-------------|
| ![Home](screenshots/home.png) | ![Detail](screenshots/detail.png) |

---

## 👤 Author

**Eli Wynn**

[![Portfolio](https://img.shields.io/badge/🌐_Portfolio-eliwynn.ca-black?style=flat-square)](https://eliwynn.ca)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-eli--wynn-0077B5?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/eliwynn/)
[![GitHub](https://img.shields.io/badge/GitHub-eli--wynn-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/eli-wynn)