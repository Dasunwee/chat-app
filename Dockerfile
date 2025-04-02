# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (better layer caching)
COPY package*.json ./

# Install production-only dependencies
RUN npm ci --only=production

# Install ALL dependencies (including devDependencies)
RUN npm install

# Copy all files
COPY . .

# Expose port
EXPOSE 4000

# Start command
CMD ["node", "server.js"]