import sys

nginx_conf_path = "/etc/nginx/sites-available/pommaholidays"

with open(nginx_conf_path, "r") as f:
    content = f.read()

pommastore_block = """
    # -------------------------------------------------------
    # POMMASTORE - Storefront, Admin, API
    # -------------------------------------------------------

    # Pommastore API (Docker mapped to host port 8030)
    location /pommastore/api/ {
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

    # Pommastore API Static Uploads
    location /pommastore/static_uploads/ {
        alias /home/basilabrahamsby/Pommastore/backend/static_uploads/;
        expires 30d;
        add_header Cache-Control "public";
        add_header Access-Control-Allow-Origin *;
    }

    # Pommastore Admin Panel (Vite on port 5174)
    location /pommastore/admin/ {
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
    location = /pommastore/admin { return 301 /pommastore/admin/; }

    # Pommastore Storefront (Next.js on port 3001)
    location /pommastore {
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
"""

if "POMMASTORE - Storefront" in content:
    print("Pommastore block already exists in Nginx config.")
else:
    target = "error_page 404 /index.html;"
    if target in content:
        new_content = content.replace(target, pommastore_block + "\n    " + target)
        with open(nginx_conf_path, "w") as f:
            f.write(new_content)
        print("Successfully added Pommastore location blocks to Nginx config.")
    else:
        print(f"Target string '{target}' not found in Nginx config.")
