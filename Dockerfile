FROM node:18-alpine as build-stage
WORKDIR /app
COPY . .

FROM nginx:alpine
COPY --from=build-stage /app /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]