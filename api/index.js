// api/index.js
require('dotenv').config();
const app = require('../backend/server'); // Memanggil logika dari file server.js

// Vercel mengharapkan export default app
module.exports = app;