const API_URL = 'http://localhost:3000';

// Osoitteesta saatu eläimen id-parametri
const params = new URLSearchParams(window.location.search);
const id = params.get('id');

// Yhden eläimen tiedot
async function loadAnimal() {
	const message = document.getElementById('message');
	const container = document.getElementById('animal');

	if (!id) {
		message.textContent = 'Eläintä ei valittu.';
		return;
	}

	try {
		const response = await fetch(`${API_URL}/animals/${id}`);

		if (response.status === 404) {
			message.textContent = 'Eläintä ei löytynyt.';
			return;
		}

		if (!response.ok) {
			throw new Error(`Palvelin vastasi: ${response.status}`);
		}

		const animal = await response.json();
		message.textContent = '';

		document.title = `${animal.name} | Vaasan Eläinsuoja`;

		const image =
			animal.image_url || 'https://placehold.co/600x600?text=Ei+kuvaa';

		const imageBox = document.createElement('div');
		imageBox.className = 'detail-image';

		const img = document.createElement('img');
		img.src = image;
		img.alt = animal.name;

		const status = document.createElement('p');
		status.className = 'status';
		status.classList.add(animal.status);
		status.textContent =
			animal.status === 'adopted' ? 'Adoptoitu' : 'Etsii kotia';

		imageBox.append(img, status);

		// Tiedot
		const infoBox = document.createElement('div');
		infoBox.className = 'detail-info';

		const name = document.createElement('h2');
		name.textContent = animal.name;

		const facts = document.createElement('ul');
		facts.className = 'facts';

		const factList = [
			['Laji', animal.type],
			['Rotu', animal.breed || 'Ei tiedossa'],
			['Ikä', `${animal.age} v`],
			['Tykkäykset', animal.likes],
		];

		factList.forEach(([label, value]) => {
			const li = document.createElement('li');
			const span = document.createElement('span');
			span.textContent = label;
			li.append(span, String(value));
			facts.appendChild(li);
		});

		const description = document.createElement('p');
		description.className = 'description';
		description.textContent = animal.description || 'Ei kuvausta saatavilla.';

		infoBox.append(name, facts, description);

		container.replaceChildren(imageBox, infoBox);

		showAdoptForm(animal);
	} catch (err) {
		console.error(err);
		message.textContent = 'Eläimen haku epäonnistui.';
	}
}

// Lomake adoptioon
function showAdoptForm(animal) {
	const section = document.getElementById('adopt-section');

	if (animal.status === 'available') {
		section.hidden = false;
		section.querySelector('h2').textContent = `Hae adoptiota: ${animal.name}`;
	}
}

async function sendApplication(event) {
	// Estetään lomakkeen oletustoiminto
	event.preventDefault();

	const form = event.target;
	const errorText = document.getElementById('form-error');
	const button = form.querySelector('button');
	errorText.textContent = '';

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

	try {
		// Sama tapa kuin Server A:n kutsussa B:lle, mutta ilman API-avainta
		const response = await fetch(`${API_URL}/animals/${id}/adopt`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		});

		// Kiitos sivulle, jos lähetys onnistui
		if (response.status === 201) {
			window.location.href = `kiitos.html?name=${encodeURIComponent(data.applicant_name)}`;
			return;
		}

		// Error message jokaiselle virheelle
		if (response.status === 400) {
			errorText.textContent = 'Täytä ainakin nimi ja sähköposti.';
		} else if (response.status === 404) {
			errorText.textContent = 'Eläintä ei löytynyt. Se on ehkä poistettu.';
		} else if (response.status === 409) {
			errorText.textContent =
				'Tämä eläin on jo adoptoitu. Katso muita eläimiä etusivulta.';
		} else {
			errorText.textContent =
				'Hakemuksen lähetys epäonnistui. Yritä hetken päästä uudelleen.';
		}
	} catch (err) {
		console.error(err);
		errorText.textContent =
			'Palvelimeen ei saatu yhteyttä. Onko Server A käynnissä?';
	} finally {
		// Ajetaan aina
		button.disabled = false;
		button.textContent = 'Lähetä hakemus';
	}
}

// Lomakkeen lähetys
document
	.getElementById('adopt-form')
	.addEventListener('submit', sendApplication);

loadAnimal();
