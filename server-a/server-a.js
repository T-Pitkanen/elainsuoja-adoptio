const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const db = require('./database');

const app = express();
app.use(express.json());

const PORT = 3000;

const API_KEY = process.env.API_KEY;

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

// GET /animals
app.get('/animals', (req, res) => {
	try {
		const animals = db.prepare('SELECT * FROM animals').all();
		res.status(200).json(animals);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Palvelinvirhe' });
	}
});

// GET /animals/:id
app.get('/animals/:id', (req, res) => {
	try {
		const animal = db
			.prepare('SELECT * FROM animals WHERE id = ?')
			.get(req.params.id);
		if (!animal) {
			return res.status(404).json({ error: 'Eläintä ei löytynyt' });
		}
		res.json(animal);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Palvelinvirhe' });
	}
});

// POST /animals/:id/adopt
app.post('/animals/:id/adopt', async (req, res) => {
	try {
		const { applicant_name, email, phone, message } = req.body;

		if (!applicant_name || !email) {
			return res.status(400).json({ error: 'Puutteelliset hakemuksen tiedot' });
		}

		const animal = db
			.prepare('SELECT * FROM animals WHERE id = ?')
			.get(req.params.id);

		if (!animal) {
			return res.status(404).json({ error: 'Eläintä ei löytynyt' });
		}

		// Adoptiopyyntö B:lle
		const response = await fetch(`${SERVER_B_URL}/adoptions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
			body: JSON.stringify({
				animal_id: animal.id,
				applicant_name,
				email,
				phone,
				message,
			}),
		});

		// Eläin on jo adoptoitu
		if (response.status === 409) {
			return res.status(409).json({ error: 'Eläin on jo adoptoitu' });
		}

		// Onko vastaus ok?
		if (!response.ok) {
			throw new Error(`Server B vastasi: ${response.status}`);
		}

		// JSON:iksi muuttaminen
		const data = await response.json();
		res.status(201).json(data);
		
	} catch (err) {
		console.error('POST /animals/:id/adopt error:', err.message);
		res.status(500).json({ error: 'Palvelinvirhe' });
	}
});

app.listen(PORT, () => {
	console.log(`Server A: http://localhost:${PORT}`);
});
