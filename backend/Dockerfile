FROM node:18-slim

WORKDIR /app

COPY package*.json ./
RUN apt-get update && apt-get install -y openssl libssl-dev
RUN npm install

COPY . .
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "start"]
