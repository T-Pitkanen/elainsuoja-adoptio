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

		// Jos eläimiä ei löydetä, tulee tämä viesti
		if (animals.length === 0) {
			message.textContent = 'Eläimiä ei löytynyt.';
			return;
		}
		message.textContent = '';

		// Jokaiselle eläimelle oma kortti
		animals.forEach((animal) => {
			const card = document.createElement('cards');
			card.className = 'card';

			const image =
				animal.image_url || 'https://placehold.co/400x300?text=Ei+kuvaa';

			card.innerHTML = `
        <img src="${image}" alt="${animal.name}">
        <h2>${animal.name}</h2>
        <p>${animal.type}, ${animal.age} v</p>
        <p class="status ${animal.status}">${animal.status === 'adopted' ? 'Adoptoitu' : 'Etsii kotia'}</p>
        <a class="button" href="animal.html?id=${animal.id}">Katso lisää</a>
      `;
			list.appendChild(card);
		});
	} catch (err) {
		console.error(err);
		message.textContent = 'Ei voitu hakea eläimiä. Yritä myöhemmin uudelleen.';
	}
}

loadAnimals();
