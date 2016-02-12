FROM node:0.12-slim

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app/

RUN buildDeps='git make ca-certificates python' \
	&& set -x \
	&& apt-get update && apt-get install -y $buildDeps --no-install-recommends \
	&& rm -rf /var/lib/apt/lists/* \
	&& npm install \
	&& apt-get purge -y --auto-remove $buildDeps \
	&& apt-get clean \
	&& npm cache clean \
	&& rm -rf /var/cache/apt/* /tmp/*

COPY . /usr/src/app

CMD [ "npm", "start" ]

EXPOSE 8000
