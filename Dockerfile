# Build Stage
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install
# RUN npm rebuild bcrypt --build-from-source
COPY . .

RUN npm run build

# Production Stage
FROM node:20-alpine

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./

# SET ENVIRONNMENT VARIABLE TO INCREASE RAM FOR NODE PROCESS
# SET NODE_OPTIONS=--max-old-space-size=4096
CMD ["node", "dist/main.js"] 

#Step 1: build the docker image using command docker build -t chandansutradhar/merchant-portal-api-v2:1.2.5 .
#Step 2: push the docker image to docker hub using command docker push chandansutradhar/merchant-portal-api-v2:1.2.5
#Step 3: pull the docker image from docker hub using command docker pull chandansutradhar/merchant-portal-api-v2:1.2.5
#Step 4: run the docker image using command: 

#sudo docker run -d --name cosmos-merchant-portal-api-v2 --restart on-failure -p 3000:3000 -v /home/npst_dev/portal-logs:/app/logs chandansutradhar/merchant-portal-api-v2:1.2.5

#Step 5: check the running container using command docker ps
##ONLY FOR TROUBLESHOOTING PURPOSE
#Step 6: stop the running container using command docker stop merchant-portal-api-v2:1.2.3
#Step 7: remove the stopped container using command docker rm merchant-portal-api-v2:1.2.3
#Step 8: remove the docker image using command docker rmi chandansutradhar/merchant-portal-api-v2:1.2.3
#To check logs - sudo docker logs <container_id>
##TODO: docker container should restart on app exception
##TODO: log should be written into a local volume

