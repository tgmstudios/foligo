# Use the official Node.js 14 image as the base image
FROM node:22.1-bullseye

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Copy entrypoint script and ensure proper line endings
COPY .docker/entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh && \
    sed -i 's/\r$//' /docker-entrypoint.sh && \
    cat /docker-entrypoint.sh

# Install project dependencies
RUN npm install

# Copy the rest of the project files to the working directory
COPY . .

# Build the project
#RUN npm run build

# Expose a port (if your application needs it)
EXPOSE 3000

# Use custom entrypoint script
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0"]