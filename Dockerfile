# Use official Node.js image as base
FROM node:latest
 
# Set working directory in the container
WORKDIR /usr/src/app
 
# Copy package.json and package-lock.json
COPY package*.json ./
 
# Install app dependencies
RUN npm install
 
# Copy application files
COPY . .
 
# Expose port
EXPOSE 3000
 
# Command to run the application
CMD ["node", "app.js"]