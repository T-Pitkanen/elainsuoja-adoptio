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
    description TEXT
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

// Testidata
const seedAnimals = [
	{
		name: 'Sosuli',
		image_url: 'images/animals/sosuli.jpg',
		type: 'cat',
		age: 3,
		breed: 'Maine Coon',
		description: 'Rauhallinen sylikissa, joka tulee toimeen lasten kanssa.',
	},
	{
		name: 'Albon',
		image_url: 'images/animals/albon.jpg',
		type: 'dog',
		age: 5,
		breed: 'Sekarotuinen',
		description:
			'Hieman ujo alussa, mutta lämpenee nopeasti. Sopii rauhalliseen kotiin.',
	},
	{
		name: 'Nappi',
		image_url: 'images/animals/nappi.jpg',
		type: 'cat',
		age: 1,
		breed: 'Maatiainen',
		description:
			'Leikkisä pentu, joka jahtaa kaikkea mikä liikkuu, myös omaa häntäänsä.',
	},
	{
		name: 'Väinö',
		image_url: 'images/animals/vaino.jpg',
		type: 'dog',
		age: 5,
		breed: 'Bordercollie',
		description:
			'Älykäs ja vauhdikas, tarvitsee tekemistä päivittäin. Sopii harrastuskoiraksi.',
	},
	{
		name: 'Aarre',
		image_url: 'images/animals/aarre.jpg',
		type: 'cat',
		age: 4,
		breed: 'Ragdoll',
		description: 'Puhelias ja seurallinen, kertoo mielipiteensä äänekkäästi.',
	},
	{
		name: 'Ruska',
		image_url: 'images/animals/ruska.jpg',
		type: 'dog',
		age: 4,
		breed: 'Suomenpystykorva',
		description:
			'Iloinen ja puhelias metsäkoira, joka rakastaa pitkiä lenkkejä ja rapsutuksia.',
	},
	{
		name: 'Mirri',
		image_url: 'images/animals/mirri.jpg',
		type: 'cat',
		age: 9,
		breed: 'Maatiainen',
		description:
			'Rauhallinen seniorikissa, joka nauttii aurinkoisista ikkunalaudoista ja hiljaisesta kodista.',
	},
	{
		name: 'Pörrö',
		image_url: 'images/animals/porro.jpg',
		type: 'dog',
		age: 2,
		breed: 'Lagotto romagnolo',
		description:
			'Kihara ja utelias nuori koira, joka oppii uusia temppuja nopeasti.',
	},
	{
		name: 'Hilla',
		image_url: 'images/animals/hilla.jpg',
		type: 'cat',
		age: 2,
		breed: 'Norjalainen metsäkissa',
		status: 'adopted',
		description:
			'Ujo mutta lempeä kaunotar, joka kiintyy omaan ihmiseensä syvästi.',
	},
	{
		name: 'Topi',
		image_url: 'images/animals/topi.jpg',
		type: 'dog',
		age: 10,
		breed: 'Labradorinnoutaja',
		description:
			'Lempeä vanha herra, joka rakastaa rauhallisia kävelyitä ja pitkiä päiväunia.',
	},
	{
		name: 'Sisu',
		image_url: 'images/animals/sisu.jpg',
		type: 'dog',
		age: 1,
		breed: 'Suomenlapinkoira',
		status: 'adopted',
		description:
			'Energinen ja sosiaalinen nuori koira, joka tulee toimeen kaikkien kanssa.',
	},
	{
		name: 'Pippuri',
		image_url: 'images/animals/pippuri.jpg',
		type: 'cat',
		age: 1,
		breed: 'Bengali',
		description:
			'Vilkas kiipeilijä, joka tarvitsee paljon leikkiä ja oman kiipeilypuun.',
	},
	{
		name: 'Onni',
		image_url: 'images/animals/onni.jpg',
		type: 'dog',
		age: 6,
		breed: 'Jackrussellinterrieri',
		status: 'adopted',
		description:
			'Pieni mutta pippurinen, rakastaa palloleikkejä ja seikkailuja.',
	},
	{
		name: 'Lumi',
		image_url: 'images/animals/lumi.jpg',
		type: 'cat',
		age: 7,
		breed: 'Turkkilainen angora',
		description:
			'Valkoinen ja hellä sisäkissa, joka viihtyy sylissä ja harjattavana.',
	},
	{
		name: 'Kaapo',
		image_url: 'images/animals/kaapo.jpg',
		type: 'dog',
		age: 4,
		breed: 'Saksanpaimenkoira',
		description:
			'Uskollinen ja oppivainen, kaipaa kokenutta omistajaa ja paljon liikuntaa.',
	},
	{
		name: 'Muru',
		image_url: 'images/animals/muru.jpg',
		type: 'cat',
		age: 3,
		breed: 'Brittiläinen lyhytkarva',
		description:
			'Rauhallinen herrasmies, joka seuraa kodin menoa mieluiten sohvan nurkasta.',
	},
	{
		name: 'Nalle',
		image_url: 'images/animals/nalle.jpg',
		type: 'dog',
		age: 7,
		breed: 'Berninpaimenkoira',
		description:
			'Iso ja lempeä karhu, joka rakastaa lapsia ja talvisia ulkoiluja.',
	},
	{
		name: 'Viiru',
		type: 'cat',
		age: 5,
		breed: 'Maatiainen',
		description:
			'Utelias raitakissa, joka tervehtii jokaista vierasta ovella.',
	},
	{
		name: 'Pilkku',
		type: 'dog',
		age: 1,
		breed: 'Dalmatialainen',
		description:
			'Vauhdikas nuori koira, joka oppii nopeasti ja jaksaa leikkiä tuntikausia.',
	},
	{
		name: 'Siiri',
		type: 'cat',
		age: 11,
		breed: 'Siamilainen',
		description:
			'Puhelias seniorineiti, joka haluaa olla aina siellä missä ihmisetkin.',
	},
];

// Lisätään ne testieläimet joita ei vielä ole
const insertMissing = db.prepare(`
	INSERT INTO animals (name, type, age, breed, image_url, status, description)
	SELECT @name, @type, @age, @breed, @image_url, @status, @description
	WHERE NOT EXISTS (SELECT 1 FROM animals WHERE name = @name)
`);

const setMissingImage = db.prepare(`
	UPDATE animals SET image_url = @image_url
	WHERE name = @name AND image_url IS NULL
`);

// Transaktio, jotta kaikki eläimet lisätään kerralla
const seed = db.transaction((animals) => {
	let added = 0;
	for (const animal of animals) {
		added += insertMissing.run({
			status: 'available',
			image_url: null,
			...animal,
		}).changes;
		if (animal.image_url) setMissingImage.run(animal);
	}
	return added;
});

// Lisätään testidata, jos sitä ei vielä ole
const added = seed(seedAnimals);
if (added > 0) {
	console.log(`Testidataa lisätty: ${added} eläintä`);
}

console.log(`Tietokanta valmis: ${DB_PATH}`);

module.exports = db;
