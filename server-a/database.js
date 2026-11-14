const Database = require('better-sqlite3');
const fs = require('node:fs');
const path = require('node:path');

// Luetaan tietokannan polku .env-tiedostosta tai käytetään oletuspolkua
const DB_PATH =
	process.env.DB_PATH || path.join(__dirname, '..', 'data', 'animals.db');

// Luodaan data-kansio, jos sitä ei ole (se ei ole githubissa .gitignoren takia)
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

// Luo tai avaa SQLite-tietokanta
const db = new Database(DB_PATH);

//WAL-tila
db.pragma('journal_mode = WAL');

// Luodaan animals-taulu
db.exec(`
  CREATE TABLE IF NOT EXISTS animals (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    type        TEXT NOT NULL,
    age         INTEGER,
    breed       TEXT,
    image_url   TEXT,
    likes       INTEGER NOT NULL DEFAULT 0,
    status      TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'adopted')),
    description TEXT,
  )
`);

// Luodaan adoptiot-taulu
db.exec(`
  CREATE TABLE IF NOT EXISTS adoptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    animal_id INTEGER NOT NULL,
    applicant_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT,
    created_at DATETIME DEFAULT (datetime('now')),
    FOREIGN KEY (animal_id) REFERENCES animals(id),
    UNIQUE(animal_id)
  )
`);

// Tarkista, onko tietokannassa jo eläimiä
const result = db.prepare('SELECT COUNT(*) AS count FROM animals').get();

// Lisätään testidataa, jos tietokanta on tyhjä
if (result.count === 0) {
	const insert = db.prepare(`
     INSERT INTO animals (name, type, age, breed, image_url, description)
     VALUES (?, ?, ?, ?, ?, ?)
  `);
	insert.run(
		'Sosuli',
		'cat',
		3,
		'Maine Coon',
		null,
		'Rauhallinen sylikissa, joka tulee toimeen lasten kanssa.',
	);
	insert.run(
		'Albon',
		'dog',
		5,
		'Sekarotuinen',
		null,
		'Hieman ujo alussa, mutta lämpenee nopeasti. Sopii rauhalliseen kotiin.',
	);
	insert.run(
		'Nappi',
		'cat',
		1,
		'Maatiainen',
		null,
		'Leikkisä pentu, joka jahtaa kaikkea mikä liikkuu, myös omaa häntäänsä.',
	);
	insert.run(
		'Väinö',
		'dog',
		5,
		'Bordercollie',
		null,
		'Älykäs ja vauhdikas, tarvitsee tekemistä päivittäin. Sopii harrastuskoiraksi.',
	);
	insert.run(
		'Aarre',
		'cat',
		4,
		'Ragdoll',
		null,
		'Puhelias ja seurallinen, kertoo mielipiteensä äänekkäästi.',
	);
	insert.run(
		'Ruska',
		'dog',
		4,
		'Suomenpystykorva',
		null,
		'Iloinen ja puhelias metsäkoira, joka rakastaa pitkiä lenkkejä ja rapsutuksia.',
	);
	console.log('Testidata lisätty');
}

console.log(`Tietokanta valmis: ${DB_PATH}`);

module.exports = db;
