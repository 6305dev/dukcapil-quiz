require('dotenv').config();
const app = require('./app');
const db = require('./config/db');

const PORT = Number(process.env.PORT || 3000);

async function start() {
  try {
    await db.query('SELECT 1');
    console.log('Database MySQL connected successfully.');
  } catch (err) {
    console.warn('Warning: Unable to connect to MySQL at startup:', err.message);
    console.warn('Pastikan kredensial di server/.env sudah benar dan database sudah dibuat.');
  }

  app.listen(PORT, () => {
    console.log(`Dukcapil Quiz API running at http://localhost:${PORT}`);
  });
}

start();
