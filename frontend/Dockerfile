FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
# Use ci if lockfile exists, else install
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY . .
# In prod we rely on same-origin /api via HAProxy, so no REACT_APP_API_BASE needed here
RUN npm run build

FROM nginx:alpine
# SPA-friendly config
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
