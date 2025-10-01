FROM node:20.19

WORKDIR /myapp
COPY package*.json ./
RUN npm install -g nodemon && npm install

CMD ["nodemon", "src/index.js"]