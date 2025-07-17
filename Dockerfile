# --- Build Stage ---
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

# --- Production Stage ---
FROM node:18-alpine AS prod
WORKDIR /app
COPY --from=build /app /app
EXPOSE 3000
CMD ["node", "app.js"]
