FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build the Next.js app
RUN npm run build

EXPOSE 3000

# Start Next.js in production mode
CMD ["npm", "run", "start"]
