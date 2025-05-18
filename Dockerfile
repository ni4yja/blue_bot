FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY tsconfig.json ./
COPY . .

RUN npm run build

CMD ["node", "dist/index.js"]