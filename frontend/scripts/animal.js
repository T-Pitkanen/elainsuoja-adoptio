const API_URL = 'http://localhost:3000';

// Yhden eläimen tiedot
async function loadAnimal() {
	const message = document.getElementById('message');
	const container = document.getElementById('animal');

	const params = new URLSearchParams(window.location.search);
	const id = params.get('id');

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
	} catch (err) {
		console.error(err);
		message.textContent = 'Eläimen haku epäonnistui.';
	}
}

loadAnimal();
