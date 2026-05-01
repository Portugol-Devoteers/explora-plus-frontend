FROM node:20-alpine

WORKDIR /app

# Instala dependências antes de copiar o código para aproveitar cache de layers
COPY package.json .
RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 8081 19000 19001 19002

CMD ["npx", "expo", "start", "--host", "lan"]
