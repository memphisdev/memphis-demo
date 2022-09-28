FROM node:16.13.2-alpine
WORKDIR /app
COPY . ./
RUN apk add python3
RUN npm install --silent
CMD ["node", "server.js"]
