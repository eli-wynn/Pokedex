const express = require('express');
const cors = require('cors');
const app = express();
const pokemonRoutes = require('./routes/pokemon');



app.use(cors());
app.use(express.json());

app.use('/api', pokemonRoutes);

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});