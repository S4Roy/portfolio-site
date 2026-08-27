# Deploying to AWS EC2

## 1. Launch the instance

- AWS Console → EC2 → Launch Instance
- AMI: **Ubuntu Server 22.04 LTS**
- Instance type: **t3.micro** (free-tier eligible)
- Key pair: create/download a `.pem` key (needed for SSH)
- Security group — inbound rules:
  - SSH (22) — your IP only
  - HTTP (80) — anywhere
  - HTTPS (443) — anywhere
- Launch, then note the instance's **public IPv4 address**

## 2. Connect

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

## 3. Install Node.js, PM2, Apache2, Git

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs apache2 git
sudo npm install -g pm2
sudo a2enmod proxy proxy_http
node -v && npm -v
```

## 4. Get the code onto the instance

On the EC2 instance:

```bash
git clone https://github.com/S4Roy/portfolio-site.git
cd portfolio-site
```

(No GitHub yet? `scp -i your-key.pem -r ./portfolio-site ubuntu@<EC2_PUBLIC_IP>:~/` from your machine instead.)

## 5. Configure environment and build

```bash
cp .env.example .env.production
# .env.production already points NEXT_PUBLIC_SITE_URL at https://subhankar.baseweb.in

npm install
npm run build
```

## 6. Run with PM2 (keeps it alive, restarts on crash/reboot)

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup    # run the printed sudo command once to enable boot-start
```

## 7. Put Apache2 in front (port 80 → app on 4000)

`deploy/apache.conf` is already configured for `subhankar.baseweb.in` proxying to port 4000 — no editing needed.

```bash
sudo cp deploy/apache.conf /etc/apache2/sites-available/portfolio-site.conf
sudo a2ensite portfolio-site.conf
sudo a2dissite 000-default.conf
sudo apache2ctl configtest && sudo systemctl reload apache2
```

Visit `http://subhankar.baseweb.in` — the site should be live (once DNS is pointed, see step 8).

## 8. Point the domain + enable HTTPS (Let's Encrypt)

1. In your DNS provider for `baseweb.in`, add an **A record** for `subhankar` pointing to the EC2 public IP. Wait for it to resolve (`dig subhankar.baseweb.in` or `nslookup subhankar.baseweb.in`) before running Certbot — it validates domain ownership over HTTP.
2. Install Certbot and get a free TLS cert:
   ```bash
   sudo apt install -y certbot python3-certbot-apache
   sudo certbot --apache -d subhankar.baseweb.in
   ```
   Certbot edits `portfolio-site.conf` to add a `:443` VirtualHost with the cert, and redirects `:80` → `:443` if you accept the prompt (recommended).
3. Certbot installs a systemd timer that auto-renews before the cert expires (Let's Encrypt certs last 90 days). Confirm it's active and do a dry run:
   ```bash
   systemctl list-timers | grep certbot
   sudo certbot renew --dry-run
   ```

Visit `https://subhankar.baseweb.in` — the site should be live over HTTPS with a valid cert.

## Redeploying after changes

```bash
cd ~/portfolio-site
git pull
npm install
npm run build
pm2 restart portfolio-site
```

## Notes

- An Elastic IP is worth attaching so the public IP doesn't change on instance stop/start.
- `t3.micro` is fine for a static portfolio's traffic; scale up only if needed.
- Resume files (`assets/`, `public/Subhankar_Roy_Resume.pdf`) and the profile photo (`public/profile.png`) are committed to the repo, so `git clone` brings them along — no separate upload step needed.
