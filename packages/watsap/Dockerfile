FROM node:22-alpine

WORKDIR /usr/local/merapihost/watsap

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]