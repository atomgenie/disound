#!/usr/bin/env zx
await $`docker build client --tag ghcr.io/atomgenie/disound`.pipe(process.stdout)
await $`docker push ghcr.io/atomgenie/disound`.pipe(process.stdout)
