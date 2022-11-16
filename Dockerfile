FROM node:lts-alpine
RUN npm install -g @apideck/portman

ENTRYPOINT ["portman"]
