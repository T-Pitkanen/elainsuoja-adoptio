// Osoitteesta saatu eläimen id-parametri
const params = new URLSearchParams(window.location.search);
const id = params.get('id');

const message = document.getElementById('message');
const container = document.getElementById('animal');

// Breadcrumbin linkki palauttaa listaan, johon käyttäjä tuli
function listUrl() {
	let query = '';
	try {
		query = sessionStorage.getItem('listQuery') || '';
	} catch {
		// Ilman tallennusta palataan koko listaan
	}
	return `index.html${query}#elaimet`;
}

document.querySelector('.breadcrumb a').href = listUrl();

// Hakee eläimen tiedot palvelimelta ja renderöi profiilin
async function loadAnimal() {
	if (!id) {
		showMessage('Eläintä ei valittu.');
		return;
	}

	try {
		const response = await fetch(
			`${API_URL}/animals/${encodeURIComponent(id)}`,
		);

		if (response.status === 404) {
			showMessage('Eläintä ei löytynyt. Se on ehkä poistettu.');
			return;
		}

		if (!response.ok) {
			throw new Error(`Palvelin vastasi: ${response.status}`);
		}

		const animal = await response.json();
		message.hidden = true;

		document.title = `${animal.name} | Vaasan Eläinsuoja`;
		document.getElementById('crumb-name').textContent = animal.name;

		renderProfile(animal);
		showAdoptForm(animal);
		loadSimilar(animal);
	} catch (err) {
		console.error(err);
		showMessage(
			'Eläimen tietoja ei voitu hakea. Yritä hetken päästä uudelleen.',
		);
	}
}

// Näytetään viesti ja linkki takaisin listaan virhetilanteissa
function showMessage(text) {
	message.replaceChildren(text + ' ');
	const back = document.createElement('a');
	back.href = listUrl();
	back.textContent = 'Takaisin eläimiin';
	message.appendChild(back);
}

// Renderöi eläimen profiilin sivulle
function renderProfile(animal) {
	const adopted = animal.status === 'adopted';
	const info = document.createElement('div');

	const name = document.createElement('h1');
	name.textContent = animal.name;

	// Rotu ja ikä
	const meta = createFacts(animal);

	// Kuvaus
	const description = document.createElement('p');
	description.className = 'description';
	description.textContent =
		animal.description || 'Kuvausta ei ole vielä kirjoitettu.';

	info.append(name, description, meta);

	const actions = document.createElement('div');
	actions.className = 'profile-actions';

	// Jos eläin on jo adoptoitu, näytetään viesti ja linkki muihin eläimiin
	if (adopted) {
		const homed = document.createElement('div');
		homed.className = 'homed';
		const text = document.createElement('div');
		const title = document.createElement('b');
		title.textContent = `${animal.name} on varattu`;
		const p = document.createElement('p');
		p.textContent =
			'Eläin on jo saanut hakemuksen, joten uusia hakemuksia ei oteta vastaan. Katso alta muut kotia etsivät eläimet.';
		text.append(title, p);
		homed.append(icon('home', 34), text);
		info.appendChild(homed);

		const all = document.createElement('a');
		all.className = 'button button-primary';
		all.href = listUrl();
		all.textContent = 'Katso muut eläimet';
		actions.appendChild(all);
	} else {
		const apply = document.createElement('a');
		apply.className = 'button button-primary';
		apply.href = '#adopt-section';
		apply.textContent = 'Hae adoptiota';
		actions.appendChild(apply);
		actions.appendChild(createHeart(animal, true));
	}

	info.appendChild(actions);

	container.classList.toggle('is-adopted', adopted);
	container.replaceChildren(createPicture(animal), info);
}

// Lomake näytetään vain kotia etsiville
function showAdoptForm(animal) {
	if (animal.status !== 'available') return;

	const section = document.getElementById('adopt-section');
	section.hidden = false;
	document.getElementById('adopt-title').textContent =
		`Hae adoptiota: ${animal.name}`;
}

// Saman lajin muut kotia etsivät eläimet
async function loadSimilar(animal) {
	try {
		const response = await fetch(`${API_URL}/animals`);
		if (!response.ok) return;
		const animals = await response.json();

		const similar = animals
			.filter(
				(a) =>
					a.id !== animal.id &&
					a.type === animal.type &&
					a.status === 'available',
			)
			.slice(0, 4);

		if (similar.length === 0) return;

		const species = SPECIES[animal.type];
		const title = document.getElementById('similar-title');
		if (animal.status === 'adopted') {
			// Varatun eläimen sivulla otsikko ei saa antaa ymmärtää, että se etsii yhä kotia
			title.textContent = `Kotia etsivät ${species ? species.group : 'eläimet'}`;
			title.nextElementSibling.hidden = true;
		} else {
			title.textContent = `Muita ${species ? species.plural : 'eläimiä'}`;
		}
		const grid = document.getElementById('similar');
		similar.forEach((a) => grid.appendChild(createCard(a)));

		const section = document.getElementById('similar-section');
		section.hidden = false;

		// Adoptoidun eläimen sivulla muut eläimet ovat prioritetuimpia
		if (animal.status === 'adopted') {
			section.classList.add('section-alt');
		}
	} catch (err) {
		// Muut eläimet ovat lisätietoa, joten virhe ei estä sivun käyttöä
		console.error(err);
	}
}

// Valmiita lauseita adoptiohakemukseen
const messageField = document.getElementById('message-field');

document.querySelectorAll('.quick button').forEach((button) => {
	button.addEventListener('click', () => {
		const on = !button.classList.contains('is-active');

		// Samaan ryhmään kuuluvista voi valita vain yhden
		if (on && button.dataset.group) {
			document
				.querySelectorAll(`.quick button[data-group="${button.dataset.group}"]`)
				.forEach((other) => {
					if (other !== button && other.classList.contains('is-active')) {
						setChip(other, false);
					}
				});
		}

		setChip(button, on);
	});
});

// Lisää tai poistaa lauseen hakemuksesta
function setChip(button, on) {
	button.classList.toggle('is-active', on);
	const sentence = `${button.textContent.trim()}.`;

	if (on) {
		const current = messageField.value.trim();
		messageField.value = current ? `${current} ${sentence}` : sentence;
	} else {
		messageField.value = messageField.value
			.split(sentence)
			.join('')
			.replace(/\s{2,}/g, ' ')
			.trim();
	}
}

// Lomakkeen validointi ja lähetys
function setFieldError(input, text) {
	const error = document.getElementById(`${input.id}-error`);
	error.replaceChildren();
	if (text) {
		error.append(icon('alert', 16), text);
	}
	input.classList.toggle('is-invalid', Boolean(text));
}

// Lomakkeen validointi
function validate(form) {
	let firstInvalid = null;
	const name = form.applicant_name;
	const email = form.email;

	if (!name.value.trim()) {
		setFieldError(name, 'Kirjoita nimesi.');
		firstInvalid = firstInvalid || name;
	} else {
		setFieldError(name, '');
	}

	if (!email.value.trim()) {
		setFieldError(email, 'Kirjoita sähköpostiosoite, jotta voimme vastata.');
		firstInvalid = firstInvalid || email;
	} else if (!email.validity.valid) {
		setFieldError(email, 'Tarkista sähköpostiosoite, esim. nimi@esimerkki.fi.');
		firstInvalid = firstInvalid || email;
	} else {
		setFieldError(email, '');
	}

	if (firstInvalid) firstInvalid.focus();
	return !firstInvalid;
}

// Näytetään lomakkeen virheilmoitus
function showFormError(text, link) {
	const errorText = document.getElementById('form-error');
	const content = document.createElement('span');
	content.textContent = text;
	if (link) {
		const a = document.createElement('a');
		a.href = link.href;
		a.textContent = link.label;
		content.append(' ', a);
	}
	errorText.replaceChildren(icon('alert', 18), content);
	errorText.hidden = false;
}

// Lähettää adoptiolomakkeen palvelimelle
async function sendApplication(event) {
	event.preventDefault();

	const form = event.target;
	const button = form.querySelector('button[type="submit"]');
	document.getElementById('form-error').hidden = true;

	if (!validate(form)) return;

	// Lomakkeen tiedot
	const data = {
		applicant_name: form.applicant_name.value.trim(),
		email: form.email.value.trim(),
		phone: form.phone.value.trim(),
		message: form.message.value.trim(),
	};

	// Estetään tuplaklikkaus lähetyksen aikana
	button.disabled = true;
	button.textContent = 'Lähetetään...';
	let locked = false;

	try {
		const response = await fetch(
			`${API_URL}/animals/${encodeURIComponent(id)}/adopt`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			},
		);

		// Kiitos-sivulle, jos lähetys onnistui
		if (response.status === 201) {
			const query = new URLSearchParams({ name: data.applicant_name, id });
			window.location.href = `kiitos.html?${query}`;
			return;
		}

		// Virheilmoitus jokaiselle virheelle
		if (response.status === 400) {
			showFormError('Täytä ainakin nimi ja sähköposti.');
		} else if (response.status === 404) {
			showFormError('Eläintä ei löytynyt. Se on ehkä poistettu.');
		} else if (response.status === 409) {
			showFormError(
				'Tämä eläin on jo saanut hakemuksen, joten uusia ei oteta vastaan.',
				{
					href: listUrl(),
					label: 'Katso muut kotia etsivät eläimet',
				},
			);
			locked = true;
		} else {
			showFormError(
				'Hakemuksen lähetys epäonnistui. Yritä hetken päästä uudelleen.',
			);
		}
	} catch (err) {
		console.error(err);
		showFormError(
			'Palvelimeen ei saatu yhteyttä. Tarkista verkkoyhteys ja yritä uudelleen.',
		);
	} finally {
		// Ajetaan aina. Varattua eläintä ei voi hakea uudelleen.
		button.disabled = locked;
		button.textContent = locked ? 'Eläin on varattu' : 'Lähetä hakemus';
	}
}

// Lomakkeen lähetys
document
	.getElementById('adopt-form')
	.addEventListener('submit', sendApplication);

loadAnimal();
