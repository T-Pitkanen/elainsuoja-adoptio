const URL_TYPES = { kissa: 'cat', koira: 'dog' };
const STAGES = ['pentu', 'nuori', 'aikuinen', 'seniori'];

const filters = readFilters();
let animals = [];

const list = document.getElementById('animals');
const resultLine = document.getElementById('result-line');
const notice = document.getElementById('notice');

// Haetaan suodattimet URL:sta
function readFilters() {
	const params = new URLSearchParams(window.location.search);
	return {
		type: URL_TYPES[params.get('laji')] || 'all',
		stage: STAGES.includes(params.get('ika')) ? params.get('ika') : 'all',
		showAdopted: params.get('kaikki') === '1',
	};
}

// Tallentaa suodattimet URL:iin ja sessionStorageen
function saveFilters() {
	const params = new URLSearchParams();
	const typeKey = Object.keys(URL_TYPES).find(
		(key) => URL_TYPES[key] === filters.type,
	);
	if (typeKey) params.set('laji', typeKey);
	if (filters.stage !== 'all') params.set('ika', filters.stage);
	if (filters.showAdopted) params.set('kaikki', '1');

	const query = params.toString() ? `?${params}` : '';
	history.replaceState(
		null,
		'',
		`${window.location.pathname}${query}${window.location.hash}`,
	);

	try {
		sessionStorage.setItem('listQuery', query);
	} catch {}
}

// Synkronoi suodattimien tilan käyttöliittymään
function syncControls() {
	document.querySelectorAll('.segments button').forEach((b) => {
		b.classList.toggle('is-active', b.dataset.type === filters.type);
	});
	document.getElementById('stage').value = filters.stage;
	document.getElementById('show-adopted').checked = filters.showAdopted;
}

// Haetaan eläimet palvelimelta ja luodaan kortit
async function loadAnimals() {
	try {
		const response = await fetch(API_URL + '/animals');

		if (!response.ok) {
			throw new Error('Eläinten haku epäonnistui');
		}

		animals = await response.json();
		list.replaceChildren();

		// Jos eläimiä ei ole niin näytetään viesti
		if (animals.length === 0) {
			document.getElementById('newest').hidden = true;
			resultLine.textContent = '';
			showNotice(
				'Kotia etsiviä eläimiä ei juuri nyt ole.',
				'Uusia eläimiä tulee suojaan jatkuvasti. Katso tilanne myöhemmin uudelleen.',
			);
			return;
		}

		// Kortit luodaan kerran
		animals.forEach((animal) => {
			const card = createCard(animal);
			card.dataset.type = animal.type;
			card.dataset.stage = lifeStage(animal.age) || 'tuntematon';
			card.dataset.adopted = animal.status === 'adopted' ? '1' : '0';
			list.appendChild(card);
		});

		showHeroDetails();
		syncControls();
		document.getElementById('filters').hidden = false;
		applyFilters();
	} catch (err) {
		console.error(err);
		list.replaceChildren();
		document.getElementById('newest').hidden = true;
		resultLine.textContent = '';
		showNotice(
			'Eläimiä ei voitu hakea.',
			'Yhteys palvelimeen ei onnistunut. Yritä hetken päästä uudelleen.',
			{
				label: 'Yritä uudelleen',
				action: () => {
					notice.replaceChildren();
					resultLine.textContent = 'Ladataan eläimiä...';
					loadAnimals();
				},
			},
		);
	}
}

// Näyttää ilmoituksen (otsikko, teksti ja valinnainen toimintonappi)
function showNotice(title, text, button) {
	notice.replaceChildren(icon('sleeping-cat', 120, 'notice-drawing'));
	const b = document.createElement('b');
	b.textContent = title;
	const p = document.createElement('p');
	p.textContent = text;
	notice.append(b, p);

	if (button) {
		const el = document.createElement('button');
		el.type = 'button';
		el.className = 'button button-primary';
		el.textContent = button.label;
		el.addEventListener('click', button.action);
		notice.appendChild(el);
	}
}

// Heron kortti
function showHeroDetails() {
	const card = document.getElementById('newest');
	const available = animals.filter((a) => a.status !== 'adopted');
	const withPhoto = available.filter((a) => a.image_url);
	const candidates = withPhoto.length > 0 ? withPhoto : available;

	if (candidates.length === 0) {
		card.hidden = true;
		return;
	}

	const newest = candidates.reduce((a, b) => (b.id > a.id ? b : a));
	card.href = `animal.html?id=${encodeURIComponent(newest.id)}`;
	card.querySelector('.picture').replaceWith(createPicture(newest));
	card.querySelector('.newest-name').textContent = newest.name;
	card.querySelector('.newest-desc').textContent = firstSentence(
		newest.description,
	);
	card.classList.remove('is-loading');
}

// Suodattimien nollaus
function resetFilters() {
	filters.type = 'all';
	filters.stage = 'all';
	filters.showAdopted = false;
	syncControls();
	applyFilters();
}

// Suodattimien soveltaminen eläinlistaan
function applyFilters() {
	let shown = 0;

	Array.from(list.children).forEach((card) => {
		const visible =
			(filters.type === 'all' || card.dataset.type === filters.type) &&
			(filters.stage === 'all' || card.dataset.stage === filters.stage) &&
			(filters.showAdopted || card.dataset.adopted === '0');
		card.hidden = !visible;
		if (visible) shown++;
	});

	// Lajien määrät
	const pool = animals.filter(
		(a) => filters.showAdopted || a.status !== 'adopted',
	);
	document.querySelector('[data-count="all"]').textContent = pool.length;
	document.querySelector('[data-count="cat"]').textContent = pool.filter(
		(a) => a.type === 'cat',
	).length;
	document.querySelector('[data-count="dog"]').textContent = pool.filter(
		(a) => a.type === 'dog',
	).length;

	if (shown === 0) {
		resultLine.textContent = '0 eläintä';
		showNotice(
			'Näillä valinnoilla ei löytynyt eläimiä.',
			'Kokeile toista lajia tai ikää, tai näytä kaikki kotia etsivät eläimet.',
			{
				label: 'Näytä kaikki',
				action: resetFilters,
			},
		);
	} else {
		resultLine.textContent = `${shown} ${shown === 1 ? 'eläin' : 'eläintä'}`;
		notice.replaceChildren();
	}

	saveFilters();
}

document.querySelectorAll('.segments button').forEach((button) => {
	button.addEventListener('click', () => {
		filters.type = button.dataset.type;
		syncControls();
		applyFilters();
	});
});

document.getElementById('stage').addEventListener('change', (event) => {
	filters.stage = event.target.value;
	applyFilters();
});

document.getElementById('show-adopted').addEventListener('change', (event) => {
	filters.showAdopted = event.target.checked;
	applyFilters();
});

loadAnimals();
