---
title: Deploy a Node.js or Next.js App on AWS EC2 with PM2, Apache and Free SSL
description: Step-by-step production deployment of Node.js or Next.js on Ubuntu EC2: PM2 process management, Apache reverse proxy, Let's Encrypt SSL and safe redeploys.
date: 2026-11-26
tags: Node.js, Next.js, AWS, DevOps
keyword: deploy node js on aws ec2
draft: true
---

This is the exact setup that serves this portfolio: a Next.js app on an Ubuntu EC2 instance, kept alive by **PM2**, behind an **Apache** reverse proxy with a free **Let's Encrypt** certificate. The same steps work for any Express.js or Node.js server, and the server can host several apps side by side.

## What you will end up with

- Your app running on a private port (for example `4000`) under PM2, restarting automatically on crash or reboot.
- Apache listening on ports 80 and 443 and forwarding requests to the app.
- HTTPS with automatic certificate renewal.
- A repeatable redeploy command.

## Step 1: Launch and secure the instance

Create an EC2 instance with **Ubuntu Server LTS**. In the security group, allow:

| Port | Source | Purpose |
| --- | --- | --- |
| 22 (SSH) | Your IP only | Administration |
| 80 (HTTP) | Anywhere | Certificate validation and redirect |
| 443 (HTTPS) | Anywhere | Site traffic |

Do **not** open your app port (such as 4000) to the internet. Only Apache should reach it. Attach an **Elastic IP** so the address survives instance restarts.

```bash
chmod 400 my-key.pem
ssh -i my-key.pem ubuntu@<ELASTIC_IP>
```

## Step 2: Install Node.js, PM2 and Apache

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs apache2 git
sudo npm install -g pm2
sudo a2enmod proxy proxy_http headers ssl rewrite
```

## Step 3: Build the app

```bash
git clone https://github.com/<you>/<app>.git
cd <app>
cp .env.example .env.production   # set production values
npm ci
npm run build
```

For Next.js, remember that `NEXT_PUBLIC_*` variables are inlined **at build time**. If you change one, you must rebuild, not just restart.

## Step 4: Run it with PM2

Create `ecosystem.config.js` in the project:

```js
module.exports = {
  apps: [
    {
      name: "my-app",
      script: "node_modules/next/dist/bin/next", // or "dist/server.js" for Express
      args: "start -p 4000",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      max_memory_restart: "300M",
      env: { NODE_ENV: "production" },
    },
  ],
};
```

Start it and make PM2 survive reboots:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup        # run the sudo command it prints, once
curl -I http://127.0.0.1:4000   # should return 200
```

`max_memory_restart` is a useful safety net on small instances: PM2 restarts the process if it leaks memory instead of letting the server swap.

## Step 5: Put Apache in front

Create `/etc/apache2/sites-available/example.com.conf`:

```apache
<VirtualHost *:80>
    ServerName example.com
    ServerAlias www.example.com

    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:4000/
    ProxyPassReverse / http://127.0.0.1:4000/

    ErrorLog ${APACHE_LOG_DIR}/example-error.log
    CustomLog ${APACHE_LOG_DIR}/example-access.log combined
</VirtualHost>
```

Enable it, and **always** test the configuration before reloading, especially on a server that hosts other sites:

```bash
sudo a2ensite example.com.conf
sudo apache2ctl configtest && sudo systemctl reload apache2
```

`reload` applies the change without dropping existing connections; a failed `configtest` stops the reload so a typo cannot take down every site on the box.

## Step 6: Point DNS and add SSL

At your domain registrar, create an **A record** for `@` pointing to the Elastic IP, and a **CNAME** for `www` pointing to the apex domain. Then check that DNS has propagated, and that no old records remain:

```bash
dig +short example.com A
dig +short example.com A @ns1.your-dns-provider.com   # the authoritative answer
```

If you see extra IP addresses (registrars often add "parked" records or domain forwarding), remove them first. Let's Encrypt validates over HTTP, and it will fail randomly if some lookups reach a different server.

Then issue the certificate:

```bash
sudo apt install -y certbot python3-certbot-apache
sudo certbot --apache -d example.com -d www.example.com
sudo certbot renew --dry-run   # confirm automatic renewal works
```

Certbot adds an HTTPS virtual host and an HTTP-to-HTTPS redirect, and installs a timer that renews certificates before they expire.

## Step 7: Redeploy safely

```bash
cd ~/<app>
git pull --ff-only          # refuses to merge if the server copy has diverged
npm ci
npm run build
pm2 restart my-app --update-env
```

`--ff-only` is a small but valuable guard: if someone edited files directly on the server, the pull stops instead of silently creating a merge.

## Moving to a new domain

When I moved this site to a new domain, the clean approach was:

1. Serve the app on the new domain with its own certificate.
2. Turn the old domain's virtual hosts into permanent redirects that keep the path:

```apache
<VirtualHost *:443>
    ServerName old.example.com
    Redirect permanent / https://example.com/
    # ...existing SSL certificate lines for old.example.com
</VirtualHost>
```

3. Keep the old certificate renewing so HTTPS redirects keep working, and use Google Search Console's **Change of address** tool.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| `502 Bad Gateway` | App not running: check `pm2 ls` and `pm2 logs my-app` |
| Changes not visible | Forgot to rebuild, or a `NEXT_PUBLIC_*` value changed without a rebuild |
| Certbot validation fails | DNS still points elsewhere, or port 80 is blocked |
| Site down after config edit | Reloaded without `configtest`; restore the backup and test |

That is the whole setup: a few commands, no container orchestration, and enough to run several production Node.js apps reliably on one small instance.

Want to see what runs on it? Browse my [projects](/projects) or the [Next.js](/expertise/nextjs) work.
