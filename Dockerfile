FROM node:14.15.1-alpine3.10
WORKDIR /app
COPY . ./
RUN apk add python3
RUN npm install --silent
CMD ["node", "server.js"]
