const API_URL = 'http://localhost:3000';
const ICONS = 'images/icons.svg';

// Tietokannassa laji on englanniksi mutta sivulla näytetään suomeksi
const SPECIES = {
	cat: { name: 'Kissa', plural: 'kissoja', group: 'kissat' },
	dog: { name: 'Koira', plural: 'koiria', group: 'koirat' },
};

// Eläimen lajin nimi suomeksi
function speciesName(type) {
	if (SPECIES[type]) return SPECIES[type].name;
	if (!type) return 'Eläin';
	return type.charAt(0).toUpperCase() + type.slice(1);
}

// pentu, nuori, aikuinen, seniori
function lifeStage(age) {
	if (age === null || age === undefined) return null;
	if (age < 1) return 'pentu';
	if (age <= 2) return 'nuori';
	if (age <= 7) return 'aikuinen';
	return 'seniori';
}

function ageText(age) {
	if (!lifeStage(age)) return '';
	return age < 1 ? 'alle 1 v' : `${age} v`;
}

// Kuvauksen ensimmäinen lause korttiin
function firstSentence(text) {
	if (!text) return '';
	const match = text.match(/^.*?[.!?](\s|$)/);
	return (match ? match[0] : text).trim();
}

// Rotu ja ikä
function createFacts(animal) {
	const list = document.createElement('dl');
	list.className = 'facts';

	const add = (label, value) => {
		const row = document.createElement('div');
		const term = document.createElement('dt');
		term.textContent = `${label}:`;
		const detail = document.createElement('dd');
		detail.textContent = value;
		row.append(term, detail);
		list.appendChild(row);
	};

	if (animal.breed) add('Rotu', animal.breed);
	add('Ikä', ageText(animal.age) || 'ei tiedossa');

	return list;
}

// Jokaisella eläimellä on oma taustaväri jos kuvaa ei ole
const TINTS = [
	'#f3e3e6',
	'#f7edcd',
	'#ebe2ee',
	'#e6ede4',
	'#f3e8dc',
	'#e4e9ef',
];

function tintFor(id) {
	return TINTS[(Number(id) - 1 + TINTS.length) % TINTS.length] || TINTS[0];
}

// SVG-ikoni
function icon(name, size, extraClass) {
	const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.setAttribute('width', size);
	svg.setAttribute('height', size);
	if (extraClass) svg.setAttribute('class', extraClass);
	const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
	use.setAttribute('href', `${ICONS}#${name}`);
	svg.appendChild(use);
	return svg;
}

function createPicture(animal) {
	const picture = document.createElement('div');
	picture.className = 'picture';
	picture.style.background = tintFor(animal.id);

	const drawing = () => {
		const svg = icon(animal.type === 'dog' ? 'dog' : 'cat', 120, 'drawing');
		svg.setAttribute('viewBox', '0 0 120 104');
		return svg;
	};

	if (animal.image_url) {
		const img = document.createElement('img');
		img.src = animal.image_url;
		img.alt = `${animal.name}, ${speciesName(animal.type).toLowerCase()}`;
		img.loading = 'lazy';
		// Näytetään piirros jos kuvan lataus epäonnistuu
		img.addEventListener('error', () => img.replaceWith(drawing()), {
			once: true,
		});
		picture.appendChild(img);
	} else {
		picture.appendChild(drawing());
	}

	return picture;
}

// Pistetään selaimelle muistiin mitä eläimiä on jo tykätty
function getLiked() {
	try {
		return JSON.parse(localStorage.getItem('liked') || '[]');
	} catch {
		return [];
	}
}

function setLiked(list) {
	try {
		localStorage.setItem('liked', JSON.stringify(list));
	} catch {
		// Jos selaimen tallennus ei ole käytössä niin tykkäys toimii silti tämän sivun ajan
	}
}

// Tykkäysnappi profiilissa ja kortissa
function createHeart(animal, withLabel) {
	const button = document.createElement('button');
	button.type = 'button';
	button.className = 'heart';
	const liked = getLiked().includes(animal.id);
	button.classList.toggle('is-active', liked);

	const count = document.createElement('span');
	button.append(icon('heart', withLabel ? 20 : 18), count);

	// Ei näytetä kun tykkäyksiä ei ole
	let likes = Number(animal.likes) || 0;
	const render = () => {
		if (likes > 0) {
			count.textContent = String(likes);
		} else {
			count.textContent = withLabel ? 'Tykkää' : '';
		}
		button.classList.toggle('has-count', likes > 0);
		button.setAttribute('aria-pressed', String(button.classList.contains('is-active')));
		button.setAttribute(
			'aria-label',
			likes > 0 ? `Tykkää: ${animal.name}, ${likes} tykkäystä` : `Tykkää: ${animal.name}`,
		);
	};
	render();

	let busy = false;
	button.addEventListener('click', async () => {
		if (busy) return;
		const wasLiked = button.classList.contains('is-active');
		// Päivitetään heti ja korjataan jos palvelin ei vastaa
		button.classList.toggle('is-active', !wasLiked);
		likes += wasLiked ? -1 : 1;
		render();
		if (!wasLiked) {
			button.classList.remove('pop');
			void button.offsetWidth;
			button.classList.add('pop');
		}
		busy = true;
		button.classList.add('is-busy');

		try {
			const response = await fetch(`${API_URL}/animals/${animal.id}/like`, {
				method: wasLiked ? 'DELETE' : 'POST',
			});
			if (!response.ok) throw new Error(`Palvelin vastasi: ${response.status}`);
			const data = await response.json();
			likes = data.likes;
			render();

			const list = getLiked().filter((id) => id !== animal.id);
			if (!wasLiked) list.push(animal.id);
			setLiked(list);
		} catch (err) {
			console.error(err);
			button.classList.toggle('is-active', wasLiked);
			likes += wasLiked ? 1 : -1;
			render();
		} finally {
			busy = false;
			button.classList.remove('is-busy');
		}
	});

	return button;
}

function createTag(animal) {
	const tag = document.createElement('p');
	tag.className = 'tag';

	if (animal.status === 'adopted') {
		const top = document.createElement('span');
		top.className = 'tag-species';
		top.textContent = 'Koti';
		const bottom = document.createElement('span');
		bottom.className = 'tag-age is-long';
		bottom.textContent = 'löytyi';
		tag.append(top, ' ', bottom);
		return tag;
	}

	const species = document.createElement('span');
	species.className = 'tag-species';
	species.textContent = speciesName(animal.type);
	tag.appendChild(species);

	if (ageText(animal.age)) {
		const age = document.createElement('span');
		age.className = 'tag-age';
		age.textContent = ageText(animal.age);
		if (animal.age < 1) age.classList.add('is-long');
		tag.append(' ', age);
	}

	return tag;
}

// Kortin luonti eläimelle
function createCard(animal) {
	const card = document.createElement('article');
	card.className = 'card';
	if (animal.status === 'adopted') card.classList.add('is-adopted');

	const body = document.createElement('div');
	body.className = 'card-body';

	const title = document.createElement('h3');
	const link = document.createElement('a');
	link.className = 'card-link';
	link.href = `animal.html?id=${encodeURIComponent(animal.id)}`;
	link.textContent = animal.name;
	title.appendChild(link);

	body.append(createTag(animal), title);

	// Kuvauksen ensimmäinen lause lisätään korttiin
	const line = firstSentence(animal.description);
	if (line) {
		const desc = document.createElement('p');
		desc.className = 'card-desc';
		desc.textContent = line;
		body.appendChild(desc);
	}

	const more = document.createElement('span');
	more.className = 'card-more';
	more.setAttribute('aria-hidden', 'true');
	more.append(icon('paw', 16), 'Katso lisää');
	body.appendChild(more);

	card.append(createPicture(animal), body, createHeart(animal, false));
	return card;
}
