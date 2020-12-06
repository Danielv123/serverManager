# Dell Server Monitor

A react web app for monitoring dell servers over IPMI

![Image](https://i.imgur.com/5LeLWMA.png)

![Admin interface](https://i.imgur.com/o8spILz.png)

## Setup

The app is designed to run with docker compose, see the docker-compose file in this repo for a sample deployment.
No extra configuration except for changing the exposed port should be needed. Be aware that this project doesn't
currently support any form of authentication, so shouldn't be exposed to the internet if it can be avoided.

    git clone https://github.com/Danielv123/serverManager
    cd serverManager
    docker-compose up -d --build

Finally, navigate to localhost:8083
