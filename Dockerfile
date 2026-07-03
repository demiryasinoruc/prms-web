# syntax=docker/dockerfile:1
# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Vite build-time inline'lar — image'ı bir API URL'sine bağlar.
# Farklı ortamlar için farklı image build'lenmesi gerekir:
#   docker build --build-arg VITE_API_URL=https://api.prod.com -t prms-web:prod .
# Bilinçli olarak DEFAULT YOK: argüman verilmezse vite.config.ts build'i
# açık bir hatayla durdurur (localhost'lu prod imajı üretmeyi engeller).
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Runtime stage
FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
	CMD wget -q -O - http://localhost/ > /dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
