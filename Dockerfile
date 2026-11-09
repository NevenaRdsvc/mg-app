# ---------- build stage: compile the Angular app ----------
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies first (cached as long as package*.json don't change).
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx ng build --configuration production

# ---------- runtime stage: only static files + nginx ----------
# "unprivileged" image = nginx runs as a non-root user and listens on 8080.
FROM nginxinc/nginx-unprivileged:1.27-alpine AS final
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/order-management-app/browser /usr/share/nginx/html
EXPOSE 8080
