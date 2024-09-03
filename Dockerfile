# Stage 1: Build the NestJS application
FROM node:latest AS sass

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
ENV NODE_OPTIONS=--max-old-space-size=4096
# Define the command to run the application
CMD ["node", "dist/main"]


#Step 1: build the docker image using command docker build -t chandansutradhar/merchant-portal-api-v2:1.2.3 .
#Step 2: push the docker image to docker hub using command docker push chandansutradhar/merchant-portal-api-v2:1.2.3
#Step 3: pull the docker image from docker hub using command docker pull chandansutradhar/merchant-portal-api-v2:1.2.3
#Step 4: run the docker image using command: 

#sudo docker run -d --name cosmos-merchant-portal-v2 --restart on-failure -p 3000:3000 -v /home/npst_dev/portal-logs:/app/logs chandansutradhar/merchant-portal-api-v2:1.2.3

#Step 5: check the running container using command docker ps
##ONLY FOR TROUBLESHOOTING PURPOSE
#Step 6: stop the running container using command docker stop merchant-portal-api-v2:1.2.3
#Step 7: remove the stopped container using command docker rm merchant-portal-api-v2:1.2.3
#Step 8: remove the docker image using command docker rmi chandansutradhar/merchant-portal-api-v2:1.2.3
#To check logs - sudo docker logs <container_id>
##TODO: docker container should restart on app exception
##TODO: log should be written into a local volume

