# Stage 1: Build the NestJS application
FROM node:20-alpine AS build

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) to the container
COPY package*.json ./

# Install dependencies
RUN npm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the NestJS application
RUN npm run build

# Stage 2: Run the application
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the build output and node_modules from the build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./

# Expose the port that the NestJS application will run on
EXPOSE 3000

# Define the command to run the application
CMD ["node", "dist/main"]
