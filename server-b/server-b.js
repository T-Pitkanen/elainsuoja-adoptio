const path = require('node:path');

// .env luetaan projektin juuresta
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const Database = require('better-sqlite3');

const PORT = 4000;

// Luetaan tietokannan polku .env-tiedostosta tai käytetään oletuspolkua
const DB_PATH =
	process.env.DB_PATH || path.join(__dirname, '..', 'data', 'animals.db');

// Luo tai avaa SQLite-tietokanta
const db = new Database(DB_PATH);

//WAL-tila. Molemmat serverit voi lukea tietokantaa samaan aikaa, kun toinen kirjoittaa
// Vain yksi voi kuitenkin kirjoittaa kerrallaan
db.pragma('journal_mode = WAL');

// Transaktio jossa päivitetään eläimen status ja lisätään adoptointi
// Tässä tehdään molemmat tai ei kumpikaan
const adopt = db.transaction((animalId, name, email, phone, message) => {
	db.prepare("UPDATE animals SET status = 'adopted' WHERE id = ?").run(animalId);
	return db
		.prepare(
			'INSERT INTO adoptions (animal_id, applicant_name, email, phone, message) VALUES (?, ?, ?, ?, ?)',
		)
		.run(animalId, name, email, phone, message);
});

const app = express();

app.use(express.json());

// Healthcheck
app.get('/health', (req, res) => {
	try {
		// Lasketaan eläimet tietokannasta, jotta voidaan varmistaa että tietokanta toimii
		const { count } = db
			.prepare('SELECT COUNT(*) AS count FROM animals')
			.get();
		res.status(200).json({ service: 'server-b', status: 'ok', animals: count });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Palvelinvirhe' });
	}
});

// API-avain suojaus
app.use((req, res, next) => {
	// Jos .env-tiedostosta puuttuu API_KEY, palvelinta ei voi käyttää
	if (!process.env.API_KEY) {
		console.error('API_KEY puuttuu .env tiedostosta!');
		return res.status(500).json({ error: 'Palvelimen asetukset puuttuvat' });
	}

	// A lähettää API-avaimen headerissa, tarkistetaan se
	if (req.headers['x-api-key'] !== process.env.API_KEY) {
		return res.status(401).json({ error: 'Virheellinen API-avain' });
	}

	next();
});

// POST /adoptions
app.post('/adoptions', (req, res) => {
	const { animal_id, applicant_name, email, phone, message } = req.body;

	if (!animal_id || !applicant_name || !email) {
		return res
			.status(400)
			.json({ error: 'animal_id, applicant_name ja email vaaditaan' });
	}

	try {
		const animal = db
			.prepare('SELECT * FROM animals WHERE id = ?')
			.get(animal_id);

		if (!animal) {
			return res.status(404).json({ error: 'Eläintä ei löytynyt' });
		}

		if (animal.status === 'adopted') {
			return res.status(409).json({ error: 'Eläin on jo adoptoitu' });
		}

		// Jos puhelin tai viesti puuttuu, tallennetaan null
		const result = adopt(
			animal_id,
			applicant_name,
			email,
			phone || null,
			message || null,
		);

		const adoption = db
			.prepare('SELECT * FROM adoptions WHERE id = ?')
			.get(result.lastInsertRowid);
		res.status(201).json(adoption);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Palvelinvirhe' });
	}
});

// Palvelimen käynnistys
app.listen(PORT, () => {
	console.log(`Server B: http://localhost:${PORT}`);
});
