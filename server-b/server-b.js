const path = require('node:path');

// .env luetaan projektin juuresta
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const Database = require('better-sqlite3');

const app = express();

app.use(express.json());

const PORT = 4000;

// Luetaan tietokannan polku .env-tiedostosta tai käytetään oletuspolkua
const DB_PATH =
	process.env.DB_PATH || path.join(__dirname, '..', 'data', 'animals.db');

// Luo tai avaa SQLite-tietokanta
const db = new Database(DB_PATH);

//WAL-tila. Molemmat serverit voi lukea tietokantaa samaan aikaa, kun toinen kirjoittaa
// Vain yksi voi kuitenkin kirjoittaa kerrallaan
db.pragma('journal_mode = WAL');

// Healthcheck
app.get('/health', (req, res) => {
	try {
		const result = db.prepare('SELECT COUNT(*) AS count FROM animals').get();
		res
			.status(200)
			.json({ service: 'server-b', status: 'ok', animals: result.count });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Palvelinvirhe' });
	}
});

app.listen(PORT, () => {
	console.log(`Server B: http://localhost:${PORT}`);
});
