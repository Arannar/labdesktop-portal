# Labdesktop Portal

A dependency-free landing page for laboratory applications hosted at `http://labdesktop.clients.net.dtu.dk/`.

## Deploy

Copy this repository's static files to `/var/www/lab-portal` and make them readable by Caddy:

```bash
sudo install -d -m 755 /var/www/lab-portal
sudo install -m 644 index.html styles.css app.js apps.json /var/www/lab-portal/
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Merge the routes from `Caddyfile.example` into `/etc/caddy/Caddyfile`. The portal is served as the final fallback after all application subpaths.

## Register Another Application

1. Give the application a unique canonical subpath with a trailing slash.
2. Expose an unauthenticated `GET /healthz` endpoint returning JSON with `{"status":"ok"}` when the web process is ready.
3. Add a `redir` and `handle_path` block before Caddy's static fallback.
4. Add an object to `apps.json` with `id`, `name`, `description`, `category`, `path`, and `healthUrl`.
5. Redeploy the static files, validate Caddy, and reload it.

Status indicates web service availability only. It does not confirm that an instrument is connected or calibrated.

## Local Preview

Serve the directory with any static web server. For example:

```bash
python3 -m http.server 8000
```

The health indicator will show unavailable unless the configured application paths are also proxied on that origin.
