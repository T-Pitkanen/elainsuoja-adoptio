const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const db = require('./database');

const app = express();
app.use(express.json());

const PORT = 3000;

// Etsitään B:n osoite .env-tiedostosta tai käytetään oletusosoitetta
const SERVER_B_URL = process.env.SERVER_B_URL || 'http://localhost:4000';

// A:n tila
app.get('/health', (req, res) => {
	try {
		const result = db.prepare('SELECT COUNT(*) AS count FROM animals').get();
		res
			.status(200)
			.json({ service: 'server-a', status: 'ok', animals: result.count });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Palvelinvirhe' });
	}
});

// Tarkistetaan saako A yhteyttä B:hen
app.get('/health/server-b', async (req, res) => {
	try {
		const response = await fetch(`${SERVER_B_URL}/health`);

		if (!response.ok) {
			throw new Error(`Server B vastasi: ${response.status}`);
		}

		const data = await response.json();
		res.status(200).json(data);
	} catch (err) {
		console.error('GET /health/server-b error:', err.message);
		res.status(500).json({ error: 'Server B ei vastaa' });
	}
});

app.listen(PORT, () => {
	console.log(`Server A: http://localhost:${PORT}`);
});
