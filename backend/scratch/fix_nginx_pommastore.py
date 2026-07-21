nginx_conf = """server {
    server_name pommastore.com www.pommastore.com;

    client_max_body_size 50M;
    client_body_timeout 12;
    client_header_timeout 12;
    keepalive_timeout 15;
    send_timeout 10;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Direct proxy for legacy /pommastore/api/ to backend without any redirect
    location /pommastore/api/ {
        proxy_pass http://127.0.0.1:8030/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Redirect legacy /pommastore/ paths to root /
    location /pommastore/ {
        rewrite ^/pommastore/(.*)$ /$1 last;
    }

    # API routes proxy to Docker container mapped to host port 8030
    location /api/ {
        proxy_pass http://127.0.0.1:8030/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        proxy_buffering off;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static uploads served directly by Nginx
    location /static_uploads/ {
        alias /home/basilabrahamsby/Pommastore/backend/static_uploads/;
        expires 365d;
        add_header Cache-Control "public, no-transform, max-age=31536000, immutable";
        add_header Access-Control-Allow-Origin *;
    }

    # Admin Dashboard proxy to frontend container mapped to host port 5174
    location /admin/ {
        proxy_pass http://127.0.0.1:5174;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection upgrade;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location = /admin { return 308 /admin/; }

    # Storefront proxy to Next.js container mapped to host port 3001
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection upgrade;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    access_log /var/log/nginx/pommastore_access.log;
    error_log /var/log/nginx/pommastore_error.log;

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/pommastore.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pommastore.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = www.pommastore.com) {
        return 308 https://$host$request_uri;
    }
    if ($host = pommastore.com) {
        return 308 https://$host$request_uri;
    }

    server_name pommastore.com www.pommastore.com;
    listen 80;
    return 404;
}
"""

with open('/etc/nginx/sites-available/pommastore', 'w') as f:
    f.write(nginx_conf)

print('SUCCESSFULLY UPDATED NGINX POMMASTORE CONFIG')
