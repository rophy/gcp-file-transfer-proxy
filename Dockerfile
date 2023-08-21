FROM node:18.17.1-bullseye

WORKDIR /app

COPY package.json package-lock.json /app/

RUN npm install

COPY . /app

CMD ["node", "app.js"]
