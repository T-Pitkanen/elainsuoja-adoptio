# Vaasan Eläinsuoja: adoptiopalvelu

Kuvitteellisen eläinsuojan verkkopalvelu, jossa voi selata kotia etsiviä kissoja ja koiria, tykätä niistä ja lähettää adoptiohakemuksen. Projekti on tehty VAMK:n kurssityönä.

## Arkkitehtuuri

Palvelu koostuu frontendistä ja kahdesta Node.js-palvelimesta, jotka jakavat saman SQLite-tietokannan.

```
selain ──> frontend (nginx, 8080)
   │
   └────> Server A (3000) ──API-avain──> Server B (4000)
              │                              │
              └──────── SQLite (animals.db) ─┘
```

- **Frontend** on tavallista HTML:ää, CSS:ää ja JavaScriptiä ilman kirjastoja. Sivut ovat etusivu (eläinlista ja suodattimet), eläimen oma sivu hakemuslomakkeineen ja kiitossivu.
- **Server A** on julkinen REST API. Se hakee eläimet tietokannasta, käsittelee tykkäykset ja välittää adoptiohakemukset Server B:lle.
- **Server B** tallentaa hakemuksen ja merkitsee eläimen varatuksi samassa transaktiossa. Se hyväksyy vain pyynnöt, joissa on oikea `X-API-Key`.

## Käynnistys Dockerilla

1. Kopioi `.env.example` nimelle `.env`. Sen valmis avain toimii sellaisenaan.
2. Käynnistä palvelut:

   ```bash
   docker compose up --build
   ```

3. Avaa selaimessa:
   - Sivusto: http://localhost:8080
   - API: http://localhost:3000
   - Swagger-dokumentaatio: http://localhost:3000/api-docs

Tietokanta on Dockerin `db_data`-volumessa, joten data säilyy uudelleenkäynnistysten yli. Server B käynnistyy vasta, kun Server A:n healthcheck on ok, koska A luo tietokannan taulut.

## Käynnistys ilman Dockeria

Vaatii Node.js 22:n.

```bash
cp .env.example .env
cd server-a && npm install
cd ../server-b && npm install
```

Käynnistä palvelimet omissa terminaaleissaan, Server A ensin, koska se luo tietokannan `data/animals.db` ja lisää testieläimet:

```bash
cd server-a
node server-a.js
```

```bash
cd server-b
node server-b.js
```

Frontendin voi avata millä tahansa staattisella palvelimella, esimerkiksi:

```bash
cd frontend
python -m http.server 8080
```

Frontend olettaa, että Server A vastaa osoitteessa `http://localhost:3000`.

## Ympäristömuuttujat

| Muuttuja | Pakollinen | Kuvaus |
|---|---|---|
| `API_KEY` | kyllä | Server A:n ja B:n yhteinen avain, jolla B tunnistaa A:n pyynnöt. Arvoksi käy mikä tahansa merkkijono, mutta se ei saa olla tyhjä. |
| `DB_PATH` | ei | Tietokannan polku. Oletus on `data/animals.db`, Dockerissa `/data/animals.db`. |
| `SERVER_B_URL` | ei | Server B:n osoite. Oletus on `http://localhost:4000`, Dockerissa `http://server-b:4000`. |

## API

Server A:n reitit. Tarkemmat skeemat ja esimerkit ovat Swaggerissa (`/api-docs`).

| Metodi | Reitti | Kuvaus |
|---|---|---|
| GET | `/health` | Server A:n tila ja eläinten määrä |
| GET | `/health/server-b` | Server B:n tila A:n kautta |
| GET | `/animals` | Kaikki eläimet |
| GET | `/animals/:id` | Yksi eläin |
| POST | `/animals/:id/like` | Lisää tykkäyksen |
| DELETE | `/animals/:id/like` | Peruu tykkäyksen |
| POST | `/animals/:id/adopt` | Lähettää adoptiohakemuksen |

Hakemuksessa `applicant_name` ja `email` ovat pakollisia, `phone` ja `message` vapaaehtoisia. Vastauskoodit ovat 201 (tallennettu), 400 (tietoja puuttuu), 404 (eläintä ei ole), 409 (eläin on jo varattu) ja 503 (Server B ei vastaa).

Server B:llä on `GET /health` ja `POST /adoptions`. Jälkimmäistä kutsuu vain Server A.

## Testidata

Server A lisää käynnistyessään 20 testieläintä, jos niitä ei vielä ole tietokannassa. Osa eläimistä on valmiiksi varattuja, ja kolmelta puuttuu kuva, jolloin sivulla näkyy piirros. Eläinten kuvat ovat kansiossa `frontend/images/animals` ja ne on haettu [Pexelsistä](https://www.pexels.com/) (Pexels-lisenssi, vapaa käyttö).

## Hakemistorakenne

```
frontend/       sivut, tyylit, skriptit ja kuvat (nginx-kontti)
server-a/       julkinen API, tietokannan luonti ja Swagger
server-b/       hakemusten tallennus
compose.yml     Docker Compose -määrittely
.env.example    mallitiedosto ympäristömuuttujille
```

## Teknologiat

Node.js 22, Express, better-sqlite3, swagger-ui-express, Docker Compose ja nginx. Frontend on tehty ilman kirjastoja.
