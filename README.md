---

# 🎬 Movie App – Deployment & Load Balancer Setup

## 📌 Overview

The **Movie App** is a full-stack application that allows users to discover trending movies, search for titles, view trailers, rate movies, and save favorites. The backend integrates with **The Movie Database (TMDb)** API to fetch real-time movie data and trailers.

This README explains the full deployment process across two web servers (**Web01** and **Web02**) with a load balancer (**Lb01**) using **HAProxy** for round-robin traffic distribution.

---

## 🐳 1. Docker Image Details

* **Docker Hub Repo:** [https://hub.docker.com/r/paul202425/movie-app](https://hub.docker.com/r/paul202425/movie-app)
* **Image Name:** `movie-app`
* **Tags:**

  * `latest` (production build)
  * `v1.0` (stable release)

---

## ⚙️ 2. Build Instructions

To build the Docker image locally from the project root:

```bash
# Build the image
docker build -t paul202425/movie-app:latest .

# Push to Docker Hub
docker push paul202425/movie-app:latest
```

---

## 🚀 3. Run Instructions (Web01 & Web02)

On **both** Web01 and Web02:

```bash
# Pull the latest image
docker pull paul202425/movie-app:latest

# Run the container
docker run -d \
  --name movie-app \
  -p 80:80 \
  -e TMDB_API_KEY=<your_tmdb_api_key> \
  paul202425/movie-app:latest
```

**Notes:**

* `-p 80:80` maps the container's port 80 to the host's port 80.
* `-e TMDB_API_KEY` injects the TMDb API key as an environment variable for security.
* Replace `<your_tmdb_api_key>` with your actual API key.
* Ensure firewall rules allow inbound traffic on port 80.

---

## ⚖️ 4. Load Balancer Configuration (HAProxy on Lb01)

Edit `/etc/haproxy/haproxy.cfg` on **Lb01**:

```haproxy
frontend http_front
    bind *:80
    mode http
    default_backend movie_backend

backend movie_backend
    mode http
    balance roundrobin
    server web01 <web01-private-ip>:80 check
    server web02 <web02-private-ip>:80 check
```

**Replace `<web01-private-ip>` and `<web02-private-ip>`** with the actual internal/private IP addresses of Web01 and Web02.

Reload HAProxy:

```bash
sudo systemctl reload haproxy
```

---

## 🧪 5. Testing the Load Balancer

1. Open the load balancer’s public IP in your browser:

   ```
   http://<lb01-public-ip>
   ```
2. Refresh the page multiple times — requests should alternate between **Web01** and **Web02**.
3. Check logs on each server:

   ```bash
   docker logs movie-app
   ```

   You should see incoming requests alternating between servers.

**Expected Result:** Round-robin distribution of traffic between Web01 and Web02.

---

## 🔐 6. Security & Secrets Handling

To avoid baking secrets into the image:

* Pass API keys via environment variables:

  ```bash
  docker run -d \
    --env-file .env \
    -p 80:80 \
    paul202425/movie-app:latest
  ```
* Keep `.env` files out of Git (`.gitignore` them).
* Use **Docker secrets** or cloud-based secret managers for production.

---

## 📂 7. Project Structure

```
movie-app/
├── backend/                 # Express.js API server
│   ├── index.js              # Backend entry point
│   └── .env                  # Environment variables (ignored in Git)
├── frontend/                 # React frontend
│   ├── src/                  # Components, pages, and assets
│   ├── public/               # Static assets
│   └── package.json
├── dockerfile                # Docker build instructions
├── docker-compose.yml        # Optional local dev config
└── README.md                 # Deployment guide (this file)
```

---

## 📸 8. Evidence of Testing

**Example round-robin log output:**

**Web01 logs:**

```
GET /api/trending 200
GET /api/search?query=batman 200
```

**Web02 logs:**

```
GET /api/trending 200
GET /api/search?query=batman 200
```

---

## ✅ Conclusion

Your Movie App is now fully deployed and load-balanced between two servers using HAProxy. This setup ensures **high availability**, **scalability**, and **consistent performance**.

---
