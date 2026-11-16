# syntax=docker/dockerfile:1

##### Stage: base — shared dependency install layer #####
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

##### Stage: dev — local development server (HMR + polling) #####
FROM base AS dev
COPY . .
RUN chmod +x ./docker-entrypoint.sh
EXPOSE 4200
ENTRYPOINT ["sh", "./docker-entrypoint.sh"]

##### Stage: build — production bundle #####
FROM base AS build
# Firebase web config is public (it ships in the bundle), so build args are fine here.
ARG FIREBASE_API_KEY
ARG FIREBASE_AUTH_DOMAIN
ARG FIREBASE_PROJECT_ID
ARG FIREBASE_STORAGE_BUCKET
ARG FIREBASE_MESSAGING_SENDER_ID
ARG FIREBASE_APP_ID
COPY . .
RUN sh ./scripts/generate-env.sh && npm run build

##### Stage: prod — nginx serving the static production bundle #####
FROM nginx:alpine AS prod
COPY --from=build /app/dist/mp-dash/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
