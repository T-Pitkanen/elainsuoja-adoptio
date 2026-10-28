# A:n Dockerfile.

# Pohja-image. 
FROM node:22-slim

# Työkansio kontissa /app.
WORKDIR /app

# Kopioidaan ensin vain package-tiedostot. Näin vältetään uudelleenasennus, jos package.json ei ole muuttunut.
COPY package*.json ./

# Asennetaan riippuvuudet. --ignore-scripts koska npm yritti rakentaa tietokantakirjaston itse ja kaatui. 
RUN npm install --ignore-scripts

# Kopioidaan loput tiedostot.
COPY . .

# Kuuntelee portissa 3000.
EXPOSE 3000

# Käynnistyskomento. Ajaa server-a.js tiedoston Node.js:llä.
CMD ["node", "server-a.js"]
