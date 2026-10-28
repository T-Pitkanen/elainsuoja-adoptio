# B:n Dockerfile.

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

# Kuuntelee portissa 4000.
EXPOSE 4000

# Käynnistyskomento. Ajaa server-b.js tiedoston Node.js:llä.
CMD ["node", "server-b.js"]