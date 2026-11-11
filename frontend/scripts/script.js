const API_URL = 'http://localhost:3000';

// Kun sivu on ladannut, haetaan eläimet
async function loadAnimals() {
	const message = document.getElementById('message');
	const list = document.getElementById('animals');

	try {
		const response = await fetch(API_URL + '/animals');

		if (!response.ok) {
			throw new Error('Eläinten haku epäonnistui');
		}

		const animals = await response.json();

		if (animals.length === 0) {
			message.textContent = 'Eläimiä ei löytynyt.';
			return;
		}
		message.textContent = '';

		// Jokaiselle eläimelle oma kortti
		animals.forEach((animal) => {
			const card = document.createElement('div');
			card.className = 'card';

			const image =
				animal.image_url || 'https://placehold.co/400x300?text=Ei+kuvaa';

			const img = document.createElement('img');
			img.src = image;
			img.alt = animal.name;

			const name = document.createElement('h2');
			name.textContent = animal.name;

			const info = document.createElement('p');
			info.textContent = `${animal.type}, ${animal.age} v`;

			const status = document.createElement('p');
			status.className = 'status';
			status.classList.add(animal.status);
			status.textContent =
				animal.status === 'adopted' ? 'Adoptoitu' : 'Etsii kotia';

			const link = document.createElement('a');
			link.className = 'button';
			link.href = `animal.html?id=${encodeURIComponent(animal.id)}`;
			link.textContent = 'Katso lisää';

			card.append(img, name, info, status, link);
			list.appendChild(card);
		});
	} catch (err) {
		console.error(err);
		message.textContent = 'Ei voitu hakea eläimiä. Yritä myöhemmin uudelleen.';
	}
}

loadAnimals();
