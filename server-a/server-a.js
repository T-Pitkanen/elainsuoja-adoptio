const fs = require('node:fs');
const path = require('node:path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const yaml = require('js-yaml');
const db = require('./database');

const PORT = 3000;
const API_KEY = process.env.API_KEY;

// Etsitään B:n osoite .env-tiedostosta tai käytetään oletusosoitetta
const SERVER_B_URL = process.env.SERVER_B_URL || 'http://localhost:4000';

const countAnimals = db.prepare('SELECT COUNT(*) AS count FROM animals');
const allAnimals = db.prepare('SELECT * FROM animals');
const findAnimal = db.prepare('SELECT * FROM animals WHERE id = ?');
const findLikes = db.prepare('SELECT id, likes FROM animals WHERE id = ?');
const addLike = db.prepare('UPDATE animals SET likes = likes + 1 WHERE id = ?');
const removeLike = db.prepare(
	'UPDATE animals SET likes = MAX(likes - 1, 0) WHERE id = ?',
);

const app = express();

app.use(cors());
app.use(express.json());

function serverError(res, err) {
	console.error(err);
	res.status(500).json({ error: 'Palvelinvirhe' });
}

// A:n tila
app.get('/health', (req, res) => {
	try {
		const { count } = countAnimals.get();
		res.status(200).json({ service: 'server-a', status: 'ok', animals: count });
	} catch (err) {
		serverError(res, err);
	}
});

// Tarkistetaan saako A yhteyttä B:hen
app.get('/health/server-b', async (req, res) => {
	try {
		const response = await fetch(`${SERVER_B_URL}/health`);

		if (!response.ok) {
			throw new Error(`Server B vastasi: ${response.status}`);
		}

		res.status(200).json(await response.json());
	} catch (err) {
		console.error('GET /health/server-b:', err.message);
		res.status(500).json({ error: 'Server B ei vastaa' });
	}
});

// GET /animals
app.get('/animals', (req, res) => {
	try {
		res.status(200).json(allAnimals.all());
	} catch (err) {
		serverError(res, err);
	}
});

// GET /animals/:id
app.get('/animals/:id', (req, res) => {
	try {
		const animal = findAnimal.get(req.params.id);
		if (!animal) {
			return res.status(404).json({ error: 'Eläintä ei löytynyt' });
		}
		res.status(200).json(animal);
	} catch (err) {
		serverError(res, err);
	}
});

function changeLikes(statement) {
	return (req, res) => {
		try {
			const result = statement.run(req.params.id);
			if (result.changes === 0) {
				return res.status(404).json({ error: 'Eläintä ei löytynyt' });
			}
			res.status(200).json(findLikes.get(req.params.id));
		} catch (err) {
			serverError(res, err);
		}
	};
}

app.post('/animals/:id/like', changeLikes(addLike));
app.delete('/animals/:id/like', changeLikes(removeLike));

// POST /animals/:id/adopt
app.post('/animals/:id/adopt', async (req, res) => {
	try {
		const { applicant_name, email, phone, message } = req.body;

		if (!applicant_name || !email) {
			return res.status(400).json({ error: 'Puutteelliset hakemuksen tiedot' });
		}

		const animal = findAnimal.get(req.params.id);
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
		}).catch((err) => {
			console.error('POST /animals/:id/adopt:', err.message);
			return null;
		});

		if (!response) {
			return res.status(503).json({ error: 'Server B ei ole käytettävissä' });
		}

		// Eläin on jo adoptoitu
		if (response.status === 409) {
			return res.status(409).json({ error: 'Eläin on jo adoptoitu' });
		}

		if (!response.ok) {
			throw new Error(`Server B vastasi: ${response.status}`);
		}

		res.status(201).json(await response.json());
	} catch (err) {
		serverError(res, err);
	}
});

// Swagger-dokumentaatio
const swaggerDocument = yaml.load(
	fs.readFileSync(path.join(__dirname, 'swagger.yaml'), 'utf8'),
);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(PORT, () => {
	console.log(`Server A: http://localhost:${PORT}`);
});
