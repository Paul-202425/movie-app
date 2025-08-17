# <Movie-App> — Deployment (Part Two A/B)
# Movie Explorer — React + Node/Express + HAProxy (Docker)

Discover trending movies, search titles, watch trailers, rate, and save favorites.  
Frontend: React (served by Nginx). Backend: Node/Express proxying TMDB API.  
Deployed as two frontends + two backends behind HAProxy with health checks & round-robin.

## Demo Video
📽️ **2-minute demo:** <PASTE YOUR VIDEO LINK HERE>

## Docker Hub Images
- Backend: `docker.io/paul217/movie-app:v2` (also tag `latest` if desired)
- Frontend: `docker.io/paul217/movie-frontend:v2` (also tag `latest` if desired)

## External API + Credits
- Data from **The Movie Database (TMDB)** API.  
  - Docs: https://developer.themoviedb.org/  
  - Please note TMDB’s attribution requirements.
- API keys are **not** in the repo. The backend reads:
  - `TMDB_BEARER` (preferred v4 token) **or** `TMDB_API_KEY` (v3)

---

## Features (meets assignment “value” & interaction)
- 🔎 Search movies (query to TMDB)
- 🔥 Trending feed
- 🎞️ Trailer selection (smart YouTube pick by type/official/recency)
- ⭐ Favorites (persist to `localStorage`)
- 🎚️ Ratings (persist to `localStorage`)
- 🌙 Dark mode toggle
- 🧑‍💻 (Bonus) Google login via Firebase (optional UI feature)
- 🧯 Robust error states (network/API errors surfaced to user)

---

## 1) Image Details
- **Docker Hub**: `https://hub.docker.com/r/<paul217>/<movie-app>`
- **Image name**: `<paul217>/<movie-app>`
- **Tags**: `v1`, `latest`

## 2) Build Locally
```bash
# from repo root (contains Dockerfile)
docker build -t <paul217>/<movie-app>:v1 .
docker tag <paul217>/<movie-app>:v1 <paul217>/<movie-app>:latest
```

## 3) Run Locally (port 8080 by default)
```bash
# with env file for secrets like API keys
echo "PORT=8080" > .env
echo "API_KEY=REDACTED" >> .env

docker run --rm -it --env-file .env -p 8080:8080 <paul217>/<movie-app>:v1

# test
curl -i http://localhost:8080/health
curl -i http://localhost:8080
```

## 4) Push to Docker Hub
```bash
docker login
docker push <paul217>/<movie-app>:v1
docker push <paul217>/<movie-app>:latest
```

## 5) Deploy on Lab Machines
SSH into **web-01** and **web-02** and run:
```bash
docker pull <paul217>/<movie-app>:v1

docker rm -f app || true
docker run -d --name app --restart unless-stopped   --env PORT=8080   --env API_KEY=$API_KEY   -p 8080:8080   <paul217>/<movie-app>:v1

# Optional: confirm service identity
curl -s http://localhost:8080/health
```

## 6) Configure Load Balancer (HAProxy on lb-01)
Update `/etc/haproxy/haproxy.cfg` with the **backend** below (full example in `haproxy.cfg.example`):
```haproxy
backend webapps
  balance roundrobin
  option httpchk GET /health
  server web01 172.20.0.11:8080 check
  server web02 172.20.0.12:8080 check
```

Reload HAProxy (containerized):
```bash
docker exec -it lb-01 sh -lc 'haproxy -sf $(pidof haproxy) -f /etc/haproxy/haproxy.cfg'
```

## 7) Test End-to-End
From your host (or any node that can reach lb-01):
```bash
for i in {1..6}; do curl -s http://localhost | grep -E "instance|host|web"; done
```

You should see responses alternate between **web-01** and **web-02**.

## 8) Evidence
- Screenshot of `curl` loop alternating.
- `docker ps` on web-01 and web-02 showing the `app` container.
- HAProxy logs (optional): `docker logs lb-01 --tail=100`.

## 9) Hardening (Secrets)
- Do **not** bake API keys into the image.
- Pass with `--env` / `--env-file` or secrets manager.
- Keep `.env` out of git via `.gitignore`.

## 10) Troubleshooting
- Port in use: `sudo lsof -i :8080` or change `PORT`.
- Healthcheck failing: ensure `/health` route responds `200` quickly.
- Wrong backend IPs: verify `docker network inspect` to get web-01/web-02 addresses.
- 502 from HAProxy: app not listening on `0.0.0.0:8080` (fix your server bind).

## 11) Demo Video Script (≤ 2 minutes)
1. Show `docker images` (your image present).
2. `docker run -p 8080:8080 ...` locally & open `http://localhost:8080`.
3. `docker push` to Docker Hub.
4. On web-01/web-02: `docker pull` + `docker run` and `/health` check.
5. Show `haproxy.cfg` snippet, then reload.
6. Run `for i in {1..6}; do curl http://<lb-address>; done` to prove round-robin.
7. Close on the app’s key feature (search/filter) and mention API credit.
```

## 12) API Attribution
- **API**: <TMDB API> — Docs: <link>