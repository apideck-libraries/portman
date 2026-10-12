FROM node:lts-alpine
ARG PORTMAN_VERSION=latest
RUN npm install -g "@apideck/portman@${PORTMAN_VERSION}"

ENTRYPOINT ["portman"]
