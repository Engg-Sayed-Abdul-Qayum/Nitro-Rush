
# Stage 1: Build the React + Vite application
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application source
COPY . .

# Generate production build
RUN npm run build


# Stage 2: Serve the production application
FROM nginx:1.27-alpine

# Remove default Nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy Vite production output
COPY --from=builder /app/dist /usr/share/nginx/html

# Configure Nginx for React/Vite routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
