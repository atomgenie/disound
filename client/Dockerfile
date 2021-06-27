FROM node:16
WORKDIR /app
COPY yarn.lock .
COPY package.json .
RUN yarn install --frozen-lockfile
COPY . .

RUN yarn tsc -b .

ENV NODE_PATH=./build

CMD ["node", "./build"]
