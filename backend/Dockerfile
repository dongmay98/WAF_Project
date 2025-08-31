FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
# Use install to avoid lockfile mismatch during CI and satisfy engines
RUN npm install --omit=dev

# Copy source code
COPY . .

# Build the application
RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
