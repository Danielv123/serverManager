# Dell Server Monitor

A react web app for monitoring dell servers over IPMI

## Known working hardware

* R720 with iDRAC7 - Monitoring + fan control
* R620 [#25](/../../issues/25)
* R710 with iDRAC6 (see issue #3)

If you have it running on different hardware or have ipmi commands for setting fanspeeds on different hardware, please submit a PR or open an issue.

## Setup

The app is designed to run with docker compose, see the docker-compose file in this repo for a sample deployment. No extra configuration except for changing the exposed port should be needed. Be aware that this project doesn't currently support any form of authentication, so shouldn't be exposed to the internet if it can be avoided.

Run with prebuilt image:
```
version: "3.3"
services:
  serverManager:
    image: ghcr.io/danielv123/servermanager:latest
    restart: unless-stopped
    ports:
        8083:8080 # external:internal
    volumes:
      - /srv/serverManager:/usr/src/app/data
  ouroboros: # For autoupdate, feel free to remove
    container_name: ouroboros
    hostname: ouroboros
    image: pyouroboros/ouroboros
    environment:
      - CLEANUP=true
      - INTERVAL=86400
      - LOG_LEVEL=info
      - SELF_UPDATE=true
      - IGNORE=mongo influxdb postgres mariadb
      - TZ=America/Chicago
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
```

Build it yourself:

    git clone https://github.com/Danielv123/serverManager
    cd serverManager
    docker-compose up -d --build

Finally, navigate to localhost:8083

Server overview:

![Image](https://i.imgur.com/5LeLWMA.png)

Admin interface with idrac ipmi connection details and a custom fan curve:

![Admin interface](https://i.imgur.com/sgIaziM.png)


