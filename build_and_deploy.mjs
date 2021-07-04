#!/usr/bin/env zx

const version = await question("Version?")

await $`docker build client --tag ghcr.io/atomgenie/disound:${version}`.pipe(
  process.stdout,
)
await $`docker push ghcr.io/atomgenie/disound:${version}`.pipe(process.stdout)
