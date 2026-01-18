FROM node:22-alpine

WORKDIR /server
COPY . .
RUN yarn install --production

CMD ["node", "/server/index.js"]
