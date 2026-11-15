const params = new URLSearchParams(window.location.search);
const applicant = (params.get('name') || '').trim();
const animalId = params.get('id');

const title = document.getElementById('thanks-title');
const lead = document.getElementById('thanks-lead');

// Kiitos ja vaiheet
function showThanks(animal) {
	document.title = 'Kiitos hakemuksesta | Vaasan Eläinsuoja';
	title.textContent = applicant
		? `Kiitos, ${applicant}!`
		: 'Kiitos hakemuksesta!';
	lead.textContent =
		'Hakemuksesi on tallessa. Otamme sinuun yhteyttä sähköpostilla ja sovimme tapaamisen.';
	document.getElementById('thanks-steps').hidden = false;
	document.getElementById('thanks-back').textContent = 'Takaisin eläimiin';

	if (animal) {
		document.getElementById('step-chosen').textContent =
			`${animal.name} on valittu.`;

		// Valitun eläimen oma kuva tai piirros
		const box = document.getElementById('thanks-animal');
		const caption = document.createElement('span');
		caption.className = 'thanks-name';
		caption.textContent = animal.name;
		const tick = document.createElement('span');
		tick.className = 'thanks-tick';
		tick.appendChild(icon('check', 20));
		box.replaceChildren(createPicture(animal, false), tick, caption);
		box.hidden = false;
	}
}

// Hakee eläimen tiedot palvelimelta ja näyttää kiitoksen
async function loadAnimal() {
	if (!animalId) return;

	try {
		const response = await fetch(
			`${API_URL}/animals/${encodeURIComponent(animalId)}`,
		);
		if (response.status === 404) return;
		if (!response.ok) throw new Error(`Palvelin vastasi: ${response.status}`);
		showThanks(await response.json());
	} catch (err) {
		// Hakemus on lähetetty, vaikka eläimen tietoja ei nyt saatu
		console.error(err);
		showThanks(null);
	}
}

loadAnimal();
