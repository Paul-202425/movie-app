# ---- Runtime image ----
FROM node:20-alpine
WORKDIR /app

# Install prod deps from backend
COPY backend/package*.json ./ 
RUN npm ci --omit=dev

# Copy backend source
COPY backend/ .

# Your app must listen on PORT internally (defaults to 5000)
ENV PORT=5000
EXPOSE 5000

# If you start with "node server.js", use:
# CMD ["node", "server.js"]
# If you start with npm script, use:
CMD ["npm", "start"]
