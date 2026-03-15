FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_API_BASE_URL=/api
ARG VITE_API_ORIGIN=
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_API_ORIGIN=${VITE_API_ORIGIN}

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM alpine:3.20

WORKDIR /app
COPY --from=build /app/dist /app/dist

# Copy build artifacts to a shared volume mounted at /output.
CMD ["sh", "-c", "mkdir -p /output && rm -rf /output/* && cp -R /app/dist/. /output/"]
