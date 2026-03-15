FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM alpine:3.20

WORKDIR /app
COPY --from=build /app/dist /app/dist

# Copy build artifacts to a shared volume mounted at /output.
CMD ["sh", "-c", "mkdir -p /output && rm -rf /output/* && cp -R /app/dist/. /output/"]
