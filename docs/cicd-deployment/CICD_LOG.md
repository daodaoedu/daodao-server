Run docker/build-push-action@v5
GitHub Actions runtime token ACs
Docker info
Proxy configuration
Buildx version
Builder info
/usr/bin/docker buildx build --build-arg NODE_ENV=dev --build-arg BUILDKIT_INLINE_CACHE=1 --file ./Dockerfile --iidfile /home/runner/work/_temp/docker-actions-toolkit-fEIMUA/build-iidfile-e97a6aec98.txt --platform linux/amd64 --attest type=provenance,mode=min,inline-only=true,builder-id=<https://github.com/daodaoedu/daodao-server/actions/runs/17509851368> --tag ***/app:dev --tag***/app:dev-dcf3e5e364fedafeecdab3dc2cab516d5c9792aa --metadata-file /home/runner/work/_temp/docker-actions-toolkit-fEIMUA/build-metadata-4063bc354f.json --no-cache --push .

# 0 building with "builder-a98e417c-e082-4e9a-9140-b1fe7a91ce0c" instance using docker-container driver

# 1 [internal] load build definition from Dockerfile

# 1 transferring dockerfile: 2.59kB done

# 1 DONE 0.0s

# 2 [internal] load metadata for docker.io/library/node:20-alpine

# 2

# 3 [auth] library/node:pull token for registry-1.docker.io

# 3 DONE 0.0s

# 2 [internal] load metadata for docker.io/library/node:20-alpine

# 2 DONE 0.9s

# 4 [internal] load .dockerignore

# 4 transferring context: 819B done

# 4 DONE 0.0s

# 5 [base 1/4] FROM docker.io/library/node:20-alpine@sha256:eabac870db94f7342d6c33560d6613f188bbcf4bbe1f4eb47d5e2a08e1a37722

# 5 resolve docker.io/library/node:20-alpine@sha256:eabac870db94f7342d6c33560d6613f188bbcf4bbe1f4eb47d5e2a08e1a37722 done

# 5

# 6 [internal] load build context

# 6 transferring context: 2.25MB 0.1s done

# 6 DONE 0.1s

# 5 [base 1/4] FROM docker.io/library/node:20-alpine@sha256:eabac870db94f7342d6c33560d6613f188bbcf4bbe1f4eb47d5e2a08e1a37722

# 5 sha256:0de821d16564893ff12fae9499550711d92157ed1e6705a8c7f7e63eac0a2bb9 449B / 449B 0.2s done

# 5 sha256:fd345d7e43c58474c833bee593321ab1097dd720bebd8032e75fbf5b81b1e554 1.26MB / 1.26MB 0.3s

# 5 sha256:c88300f8759af46375ccc157a0a0dbf7cdaeded52394b5ce2ce074e3b773fe82 0B / 42.75MB 0.2s

# 5 sha256:9824c27679d3b27c5e1cb00a73adb6f4f8d556994111c12db3c5d61a0c843df8 0B / 3.80MB 0.2s

# 5 sha256:fd345d7e43c58474c833bee593321ab1097dd720bebd8032e75fbf5b81b1e554 1.26MB / 1.26MB 0.3s done

# 5 sha256:c88300f8759af46375ccc157a0a0dbf7cdaeded52394b5ce2ce074e3b773fe82 4.19MB / 42.75MB 0.5s

# 5 sha256:9824c27679d3b27c5e1cb00a73adb6f4f8d556994111c12db3c5d61a0c843df8 3.80MB / 3.80MB 0.5s done

# 5 extracting sha256:9824c27679d3b27c5e1cb00a73adb6f4f8d556994111c12db3c5d61a0c843df8 0.1s done

# 5 sha256:c88300f8759af46375ccc157a0a0dbf7cdaeded52394b5ce2ce074e3b773fe82 11.53MB / 42.75MB 0.6s

# 5 sha256:c88300f8759af46375ccc157a0a0dbf7cdaeded52394b5ce2ce074e3b773fe82 17.83MB / 42.75MB 0.8s

# 5 sha256:c88300f8759af46375ccc157a0a0dbf7cdaeded52394b5ce2ce074e3b773fe82 23.07MB / 42.75MB 0.9s

# 5 sha256:c88300f8759af46375ccc157a0a0dbf7cdaeded52394b5ce2ce074e3b773fe82 29.36MB / 42.75MB 1.1s

# 5 sha256:c88300f8759af46375ccc157a0a0dbf7cdaeded52394b5ce2ce074e3b773fe82 34.60MB / 42.75MB 1.2s

# 5 sha256:c88300f8759af46375ccc157a0a0dbf7cdaeded52394b5ce2ce074e3b773fe82 38.80MB / 42.75MB 1.4s

# 5 sha256:c88300f8759af46375ccc157a0a0dbf7cdaeded52394b5ce2ce074e3b773fe82 42.75MB / 42.75MB 1.5s

# 5 sha256:c88300f8759af46375ccc157a0a0dbf7cdaeded52394b5ce2ce074e3b773fe82 42.75MB / 42.75MB 1.5s done

# 5 extracting sha256:c88300f8759af46375ccc157a0a0dbf7cdaeded52394b5ce2ce074e3b773fe82

# 5 extracting sha256:c88300f8759af46375ccc157a0a0dbf7cdaeded52394b5ce2ce074e3b773fe82 1.0s done

# 5 DONE 2.6s

# 5 [base 1/4] FROM docker.io/library/node:20-alpine@sha256:eabac870db94f7342d6c33560d6613f188bbcf4bbe1f4eb47d5e2a08e1a37722

# 5 extracting sha256:fd345d7e43c58474c833bee593321ab1097dd720bebd8032e75fbf5b81b1e554 0.0s done

# 5 extracting sha256:0de821d16564893ff12fae9499550711d92157ed1e6705a8c7f7e63eac0a2bb9 done

# 5 DONE 2.6s

# 7 [base 2/4] RUN apk add --no-cache libc6-compat

# 7 0.052 fetch <https://dl-cdn.alpinelinux.org/alpine/v3.22/main/x86_64/APKINDEX.tar.gz>

# 7 0.230 fetch <https://dl-cdn.alpinelinux.org/alpine/v3.22/community/x86_64/APKINDEX.tar.gz>

# 7 0.579 (1/3) Installing musl-obstack (1.2.3-r2)

# 7 0.599 (2/3) Installing libucontext (1.3.2-r0)

# 7 0.620 (3/3) Installing gcompat (1.1.0-r4)

# 7 0.641 OK: 10 MiB in 21 packages

# 7 DONE 1.2s

# 8 [base 3/4] RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

# 8 0.233 Preparing pnpm@9.1.0 for immediate activation

# 8 DONE 1.4s

# 9 [base 4/4] WORKDIR /app

# 9 DONE 0.0s

# 10 [deps-dev 1/2] COPY package.json pnpm-lock.yaml ./

# 10 DONE 0.0s

# 11 [runtime  1/10] RUN addgroup -g 1001 -S nodejs &&     adduser -S nodejs -u 1001

# 11 DONE 0.1s

# 12 [deps-dev 2/2] RUN pnpm install --frozen-lockfile

# 12 1.174 Lockfile is up to date, resolution step is skipped

# 12 1.438 Progress: resolved 1, reused 0, downloaded 0, added 0

# 12 1.838 Packages: +858

# 12 1.838 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

# 12 2.302

# 12 2.302    ╭───────────────────────────────────────────────────────────────────╮

# 12 2.302    │                                                                   │

# 12 2.302    │                Update available! 9.1.0 → 10.15.1.                 │

# 12 2.302    │   Changelog: <https://github.com/pnpm/pnpm/releases/tag/v10.15.1>   │

# 12 2.302    │     Run "corepack prepare pnpm@10.15.1 --activate" to update.     │

# 12 2.302    │                                                                   │

# 12 2.302    │      Follow @pnpmjs for updates: <https://twitter.com/pnpmjs>       │

# 12 2.302    │                                                                   │

# 12 2.302    ╰───────────────────────────────────────────────────────────────────╯

# 12 2.302

# 12 2.443 Progress: resolved 858, reused 0, downloaded 1, added 0

# 12 3.449 Progress: resolved 858, reused 0, downloaded 27, added 13

# 12 4.452 Progress: resolved 858, reused 0, downloaded 86, added 71

# 12 5.455 Progress: resolved 858, reused 0, downloaded 113, added 102

# 12 6.454 Progress: resolved 858, reused 0, downloaded 116, added 105

# 12 7.455 Progress: resolved 858, reused 0, downloaded 128, added 113

# 12 8.459 Progress: resolved 858, reused 0, downloaded 147, added 132

# 12 9.460 Progress: resolved 858, reused 0, downloaded 241, added 229

# 12

# 13 [deps-prod 2/2] RUN pnpm install --frozen-lockfile --prod

# 13 1.194 Lockfile is up to date, resolution step is skipped

# 13 1.323 Progress: resolved 1, reused 0, downloaded 0, added 0

# 13 1.596 Packages: +453

# 13 1.596 ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

# 13 2.051

# 13 2.051    ╭───────────────────────────────────────────────────────────────────╮

# 13 2.051    │                                                                   │

# 13 2.051    │                Update available! 9.1.0 → 10.15.1.                 │

# 13 2.051    │   Changelog: <https://github.com/pnpm/pnpm/releases/tag/v10.15.1>   │

# 13 2.051    │     Run "corepack prepare pnpm@10.15.1 --activate" to update.     │

# 13 2.051    │                                                                   │

# 13 2.051    │      Follow @pnpmjs for updates: <https://twitter.com/pnpmjs>       │

# 13 2.051    │                                                                   │

# 13 2.051    ╰───────────────────────────────────────────────────────────────────╯

# 13 2.051

# 13 2.337 Progress: resolved 453, reused 0, downloaded 1, added 0

# 13 3.338 Progress: resolved 453, reused 0, downloaded 37, added 24

# 13 4.343 Progress: resolved 453, reused 0, downloaded 87, added 78

# 13 5.345 Progress: resolved 453, reused 0, downloaded 111, added 99

# 13 6.346 Progress: resolved 453, reused 0, downloaded 119, added 108

# 13 7.351 Progress: resolved 453, reused 0, downloaded 125, added 111

# 13 8.354 Progress: resolved 453, reused 0, downloaded 208, added 198

# 13 9.360 Progress: resolved 453, reused 0, downloaded 274, added 266

# 13 10.36 Progress: resolved 453, reused 0, downloaded 336, added 330

# 13

# 12 [deps-dev 2/2] RUN pnpm install --frozen-lockfile

# 12 10.46 Progress: resolved 858, reused 0, downloaded 317, added 306

# 12 11.46 Progress: resolved 858, reused 0, downloaded 383, added 382

# 12 12.46 Progress: resolved 858, reused 0, downloaded 427, added 420

# 12 13.46 Progress: resolved 858, reused 0, downloaded 503, added 496

# 12 14.46 Progress: resolved 858, reused 0, downloaded 603, added 589

# 12 15.46 Progress: resolved 858, reused 0, downloaded 714, added 703

# 12 16.46 Progress: resolved 858, reused 0, downloaded 831, added 827

# 12 16.68 Progress: resolved 858, reused 0, downloaded 858, added 858, done

# 12 17.58 .../node_modules/@prisma/engines postinstall$ node scripts/postinstall.js

# 12 17.58 .../node_modules/@scarf/scarf postinstall$ node ./report.js

# 12 17.62 .../bcrypt@6.0.0/node_modules/bcrypt install$ node-gyp-build

# 12 18.04 .../bcrypt@6.0.0/node_modules/bcrypt install: Done

# 12

# 13 [deps-prod 2/2] RUN pnpm install --frozen-lockfile --prod

# 13 11.36 Progress: resolved 453, reused 0, downloaded 398, added 389

# 13 12.12 Progress: resolved 453, reused 0, downloaded 453, added 453, done

# 13 12.51 .../node_modules/@prisma/engines postinstall$ node scripts/postinstall.js

# 13 12.51 .../node_modules/@scarf/scarf postinstall$ node ./report.js

# 13 12.54 .../bcrypt@6.0.0/node_modules/bcrypt install$ node-gyp-build

# 13 12.89 .../bcrypt@6.0.0/node_modules/bcrypt install: Done

# 13 15.73 .../node_modules/@scarf/scarf postinstall: Done

# 13 15.78 .../node_modules/@prisma/engines postinstall: Done

# 13 15.97 .../node_modules/prisma preinstall$ node scripts/preinstall-entry.js

# 13 16.08 .../node_modules/prisma preinstall: Done

# 13 16.34 .../node_modules/@prisma/client postinstall$ node scripts/postinstall.js

# 13

# 12 [deps-dev 2/2] RUN pnpm install --frozen-lockfile

# 12 20.82 .../node_modules/@scarf/scarf postinstall: Done

# 12 20.82 .../node_modules/@prisma/engines postinstall: Done

# 12 21.00 .../node_modules/prisma preinstall$ node scripts/preinstall-entry.js

# 12 21.08 .../node_modules/prisma preinstall: Done

# 12 21.51 .../node_modules/@prisma/client postinstall$ node scripts/postinstall.js

# 12

# 13 [deps-prod 2/2] RUN pnpm install --frozen-lockfile --prod

# 13 22.63 .../node_modules/@prisma/client postinstall: prisma:warn We could not find your Prisma schema in the default locations (see: <https://pris.ly/d/prisma-schema-location>)

# 13 22.63 .../node_modules/@prisma/client postinstall: If you have a Prisma schema file in a custom path, you will need to run

# 13 22.63 .../node_modules/@prisma/client postinstall: `prisma generate --schema=./path/to/your/schema.prisma` to generate Prisma Client

# 13 22.63 .../node_modules/@prisma/client postinstall: If you do not have a Prisma schema file yet, you can ignore this message

# 13 22.66 .../node_modules/@prisma/client postinstall: Done

# 13 23.17

# 13 23.17 dependencies

# 13 23.17 + @aws-sdk/client-s3 3.879.0

# 13 23.17 + @prisma/client 6.15.0

# 13 23.17 + bcrypt 6.0.0

# 13 23.17 + cors 2.8.5

# 13 23.17 + dotenv 16.6.1

# 13 23.17 + express 4.21.2

# 13 23.17 + express-rate-limit 7.5.1

# 13 23.17 + express-session 1.18.2

# 13 23.17 + express-slow-down 2.1.0

# 13 23.17 + helmet 8.1.0

# 13 23.17 + ioredis 5.7.0

# 13 23.17 + js-yaml 4.1.0

# 13 23.17 + jsonwebtoken 9.0.2

# 13 23.17 + moment-timezone 0.5.48

# 13 23.17 + mongoose 7.8.7

# 13 23.17 + multer 1.4.5-lts.2

# 13 23.17 + nodemailer 6.10.1

# 13 23.17 + passport 0.6.0

# 13 23.17 + passport-google-oauth20 2.0.0

# 13 23.17 + pg 8.16.3

# 13 23.17 + pg-hstore 2.3.4

# 13 23.17 + pm2 5.4.3

# 13 23.17 + swagger-ui-express 5.0.1

# 13 23.17 + systeminformation 5.27.8

# 13 23.17 + uuid 10.0.0

# 13 23.17 + winston 3.17.0

# 13 23.17 + winston-daily-rotate-file 5.0.0

# 13 23.17 + zod 4.1.5

# 13 23.17

# 13 23.17 devDependencies: skipped

# 13 23.17

# 13 23.19 Done in 22.9s

# 13 DONE 23.7s

# 12 [deps-dev 2/2] RUN pnpm install --frozen-lockfile

# 12

# 14 [runtime  2/10] COPY --from=deps-prod /app/node_modules ./node_modules

# 14

# 12 [deps-dev 2/2] RUN pnpm install --frozen-lockfile

# 12 27.52 .../node_modules/@prisma/client postinstall: prisma:warn We could not find your Prisma schema in the default locations (see: <https://pris.ly/d/prisma-schema-location>)

# 12 27.53 .../node_modules/@prisma/client postinstall: If you have a Prisma schema file in a custom path, you will need to run

# 12 27.53 .../node_modules/@prisma/client postinstall: `prisma generate --schema=./path/to/your/schema.prisma` to generate Prisma Client

# 12 27.53 .../node_modules/@prisma/client postinstall: If you do not have a Prisma schema file yet, you can ignore this message

# 12 27.56 .../node_modules/@prisma/client postinstall: Done

# 12 28.19

# 12 28.19 dependencies

# 12 28.19 + @aws-sdk/client-s3 3.879.0

# 12 28.19 + @prisma/client 6.15.0

# 12 28.19 + bcrypt 6.0.0

# 12 28.19 + cors 2.8.5

# 12 28.19 + dotenv 16.6.1

# 12 28.19 + express 4.21.2

# 12 28.19 + express-rate-limit 7.5.1

# 12 28.19 + express-session 1.18.2

# 12 28.19 + express-slow-down 2.1.0

# 12 28.19 + helmet 8.1.0

# 12 28.19 + ioredis 5.7.0

# 12 28.19 + js-yaml 4.1.0

# 12 28.19 + jsonwebtoken 9.0.2

# 12 28.19 + moment-timezone 0.5.48

# 12 28.19 + mongoose 7.8.7

# 12 28.19 + multer 1.4.5-lts.2

# 12 28.19 + nodemailer 6.10.1

# 12 28.19 + passport 0.6.0

# 12 28.19 + passport-google-oauth20 2.0.0

# 12 28.19 + pg 8.16.3

# 12 28.19 + pg-hstore 2.3.4

# 12 28.19 + pm2 5.4.3

# 12 28.19 + swagger-ui-express 5.0.1

# 12 28.19 + systeminformation 5.27.8

# 12 28.19 + uuid 10.0.0

# 12 28.19 + winston 3.17.0

# 12 28.19 + winston-daily-rotate-file 5.0.0

# 12 28.19 + zod 4.1.5

# 12 28.19

# 12 28.19 devDependencies

# 12 28.19 + @faker-js/faker 10.0.0

# 12 28.19 + @types/bcrypt 5.0.2

# 12 28.19 + @types/cors 2.8.19

# 12 28.19 + @types/express 4.17.23

# 12 28.19 + @types/express-serve-static-core 5.0.7

# 12 28.19 + @types/express-session 1.18.2

# 12 28.19 + @types/jest 29.5.14

# 12 28.19 + @types/js-yaml 4.0.9

# 12 28.19 + @types/jsonwebtoken 9.0.10

# 12 28.19 + @types/mongoose 5.11.97

# 12 28.19 + @types/multer 2.0.0

# 12 28.19 + @types/node 24.3.0

# 12 28.19 + @types/nodemailer 6.4.19

# 12 28.19 + @types/passport 1.0.17

# 12 28.19 + @types/passport-google-oauth20 2.0.16

# 12 28.19 + @types/qs 6.14.0

# 12 28.19 + @types/supertest 6.0.3

# 12 28.19 + @types/swagger-ui-express 4.1.8

# 12 28.19 + @types/uuid 10.0.0

# 12 28.19 + @typescript-eslint/eslint-plugin 7.18.0

# 12 28.19 + @typescript-eslint/parser 7.18.0

# 12 28.19 + cross-env 7.0.3

# 12 28.19 + eslint 8.57.1

# 12 28.19 + jest 29.7.0

# 12 28.19 + jest-mock-extended 4.0.0

# 12 28.19 + nodemon 3.1.10

# 12 28.19 + prisma 6.15.0

# 12 28.19 + supertest 7.1.4

# 12 28.19 + ts-jest 29.4.1

# 12 28.19 + ts-node 10.9.2

# 12 28.19 + ts-node-dev 2.0.0

# 12 28.19 + tsc-alias 1.8.16

# 12 28.19 + tsconfig-paths 4.2.0

# 12 28.19 + typescript 5.9.2

# 12 28.19

# 12 28.36 Done in 28.1s

# 12 DONE 29.4s

# 15 [prisma 1/2] COPY prisma ./prisma

# 15 DONE 1.2s

# 14 [runtime  2/10] COPY --from=deps-prod /app/node_modules ./node_modules

# 14 DONE 4.3s

# 16 [prisma 2/2] RUN pnpm run prisma:generate &&     echo "Prisma client generated successfully"

# 16 0.499

# 16 0.499 > daodao-server@1.0.0 prisma:generate /app

# 16 0.499 > prisma generate

# 16 0.499

# 16 2.176 Prisma schema loaded from prisma/schema.prisma

# 16 3.504

# 16 3.504 ✔ Generated Prisma Client (v6.15.0) to ./generated/prisma in 645ms

# 16 3.504

# 16 3.504 Start by importing your Prisma Client (See: <https://pris.ly/d/importing-client>)

# 16 3.504

# 16 3.504 Tip: Want to turn off tips and other hints? <https://pris.ly/tip-4-nohints>

# 16 3.504

# 16 3.544 Prisma client generated successfully

# 16 DONE 3.6s

# 17 [builder  1/13] COPY tsconfig*.json ./

# 17 DONE 0.0s

# 18 [builder  2/13] COPY src ./src

# 18 DONE 0.0s

# 19 [builder  3/13] COPY scripts ./scripts

# 19 DONE 0.0s

# 20 [builder  4/13] COPY controllers ./controllers

# 20 DONE 0.0s

# 21 [builder  5/13] COPY models ./models

# 21 DONE 0.0s

# 22 [builder  6/13] COPY routes ./routes

# 22 DONE 0.0s

# 23 [builder  7/13] COPY services ./services

# 23 DONE 0.0s

# 24 [builder  8/13] COPY middlewares ./middlewares

# 24 DONE 0.0s

# 25 [builder  9/13] COPY utils ./utils

# 25 DONE 0.0s

# 26 [builder 10/13] COPY public ./public

# 26 DONE 0.0s

# 27 [builder 11/13] COPY index.js ./

# 27 DONE 0.0s

# 28 [builder 12/13] COPY ecosystem.config.js ./

# 28 DONE 0.0s

# 29 [builder 13/13] RUN pnpm run build

# 29 0.701

# 29 0.701 > daodao-server@1.0.0 prebuild /app

# 29 0.701 > pnpm run clean

# 29 0.701

# 29 1.196

# 29 1.196 > daodao-server@1.0.0 clean /app

# 29 1.196 > rm -rf dist

# 29 1.196

# 29 1.218

# 29 1.218 > daodao-server@1.0.0 build /app

# 29 1.218 > pnpm run swagger:generate && tsc --skipLibCheck && tsc-alias

# 29 1.218

# 29 1.634

# 29 1.634 > daodao-server@1.0.0 swagger:generate /app

# 29 1.634 > ts-node -r tsconfig-paths/register scripts/generate-swagger.ts

# 29 1.634

# 29 4.697 🚀 開始生成 Swagger/OpenAPI 文檔

# 29 4.698 ================================================

# 29 4.699 🔍 掃描 validators 目錄

# 29 4.699 📁 找到 20 個 validator 檔案

# 29 4.699 📖 載入 api-response.validators.ts

# 29 5.180   ✓ 發現 schema: responseMetaSchema

# 29 5.182   ✓ 發現 schema: apiErrorResponseSchema

# 29 5.182   ✓ 發現 schema: paginationInfoSchema

# 29 5.182   ✓ 發現 schema: cursorPaginationInfoSchema

# 29 5.182   ✓ 發現 schema: apiSuccessResponseExample

# 29 5.183   ✓ 發現 schema: paginatedApiResponseExample

# 29 5.184   ✓ 發現 schema: cursorPaginatedApiResponseExample

# 29 5.184   ✅ api-response.validators: 7 個 schemas

# 29 5.184 📖 載入 auth.validators.ts

# 29 6.019   ✓ 發現 schema: loginValidator

# 29 6.020   ✓ 發現 schema: registerValidator

# 29 6.020   ✓ 發現 schema: forgotPasswordValidator

# 29 6.020   ✓ 發現 schema: resetPasswordValidator

# 29 6.020   ✓ 發現 schema: verifyEmailValidator

# 29 6.020   ✓ 發現 schema: changePasswordValidator

# 29 6.020   ✓ 發現 schema: updateProfileValidator

# 29 6.021   ✓ 發現 schema: tokenValidator

# 29 6.021   ✓ 發現 schema: revokeAllSessionsValidator

# 29 6.021   ✓ 發現 schema: oauthStateValidator

# 29 6.022   ✓ 發現 schema: loginSuccessResponseSchema

# 29 6.023   ✓ 發現 schema: logoutResponseSchema

# 29 6.024   ✓ 發現 schema: refreshTokenResponseSchema

# 29 6.024   ✅ auth.validators: 13 個 schemas

# 29 6.024 📖 載入 comment.validators.ts

# 29 6.260   ✓ 發現 schema: createCommentSchema

# 29 6.261   ✓ 發現 schema: updateCommentSchema

# 29 6.261   ✓ 發現 schema: getCommentsQuerySchema

# 29 6.261   ✓ 發現 schema: commentParamsSchema

# 29 6.261   ✓ 發現 schema: bulkCommentOperationSchema

# 29 6.261   ✓ 發現 schema: commentFilterSchema

# 29 6.262   ✓ 發現 schema: commentPaginationSchema

# 29 6.264   ✅ comment.validators: 7 個 schemas

# 29 6.265 📖 載入 email.validators.ts

# 29 6.524   ✓ 發現 schema: contactEmailSchema

# 29 6.526   ✓ 發現 schema: verificationEmailSchema

# 29 6.527   ✓ 發現 schema: welcomeEmailSchema

# 29 6.527   ✓ 發現 schema: passwordResetEmailSchema

# 29 6.528   ✓ 發現 schema: marathonEmailSchema

# 29 6.529   ✓ 發現 schema: customEmailSchema

# 29 6.530   ✓ 發現 schema: bulkEmailSchema

# 29 6.531   ✓ 發現 schema: validateEmailSchema

# 29 6.532   ✓ 發現 schema: previewEmailSchema

# 29 6.533   ✓ 發現 schema: emailStatsQuerySchema

# 29 6.533   ✅ email.validators: 10 個 schemas

# 29 6.534 📖 載入 idea.validators.ts

# 29 6.748   ✓ 發現 schema: ideaStatusSchema

# 29 6.748   ✓ 發現 schema: ideaResourceSchema

# 29 6.750   ✓ 發現 schema: createIdeaSchema

# 29 6.751   ✓ 發現 schema: updateIdeaSchema

# 29 6.752   ✓ 發現 schema: ideaQuerySchema

# 29 6.753   ✓ 發現 schema: eventViewSchema

# 29 6.754   ✓ 發現 schema: eventClickSchema

# 29 6.754   ✓ 發現 schema: eventShareSchema

# 29 6.755   ✓ 發現 schema: eventFavoriteSchema

# 29 6.755   ✓ 發現 schema: ideaParamsSchema

# 29 6.756   ✅ idea.validators: 10 個 schemas

# 29 6.756 📖 載入 image.validators.ts

# 29 7.026   ✓ 發現 schema: fileSchema

# 29 7.026   ✓ 發現 schema: filesSchema

# 29 7.026   ✓ 發現 schema: filenameParamSchema

# 29 7.026   ✓ 發現 schema: uploadRequestSchema

# 29 7.026   ✓ 發現 schema: enhancedFileSchema

# 29 7.026   ✓ 發現 schema: enhancedFilesSchema

# 29 7.026   ✅ image.validators: 6 個 schemas

# 29 7.026 📖 載入 me.validators.ts

# 29 7.227   ✓ 發現 schema: practiceQuerySchema

# 29 7.229   ✓ 發現 schema: practiceStatsQuerySchema

# 29 7.232   ✓ 發現 schema: resourcesQuerySchema

# 29 7.233   ✓ 發現 schema: preferencesQuerySchema

# 29 7.234   ✓ 發現 schema: updatePreferencesSchema

# 29 7.235   ✅ me.validators: 5 個 schemas

# 29 7.235 📖 載入 mentor.validators.ts

# 29 7.376   ✓ 發現 schema: assignMentorToMarathonSchema

# 29 7.377   ✓ 發現 schema: updateMentorMarathonSchema

# 29 7.378   ✓ 發現 schema: assignParticipantToMentorSchema

# 29 7.378   ✓ 發現 schema: assignmentIdParamsSchema

# 29 7.378   ✓ 發現 schema: participantIdParamsSchema

# 29 7.378   ✓ 發現 schema: eventIdParamsSchema

# 29 7.378   ✓ 發現 schema: paginationQuerySchema

# 29 7.378   ✅ mentor.validators: 7 個 schemas

# 29 7.378 📖 載入 milestone.validators.ts

# 29 7.530   ✓ 發現 schema: createMilestoneSchema

# 29 7.530   ✓ 發現 schema: updateMilestoneSchema

# 29 7.530   ✓ 發現 schema: milestoneParamsSchema

# 29 7.530   ✓ 發現 schema: milestoneProjectParamsSchema

# 29 7.530   ✓ 發現 schema: milestoneQuerySchema

# 29 7.530   ✅ milestone.validators: 5 個 schemas

# 29 7.530 📖 載入 note.validators.ts

# 29 7.688   ✓ 發現 schema: createNoteSchema

# 29 7.689   ✓ 發現 schema: updateNoteSchema

# 29 7.689   ✓ 發現 schema: noteQuerySchema

# 29 7.689   ✓ 發現 schema: noteParamsSchema

# 29 7.689   ✓ 發現 schema: noteProjectParamsSchema

# 29 7.689   ✓ 發現 schema: publicNotesQuerySchema

# 29 7.689   ✅ note.validators: 6 個 schemas

# 29 7.690 📖 載入 outcome.validators.ts

# 29 7.821   ✓ 發現 schema: createOutcomeSchema

# 29 7.822   ✓ 發現 schema: updateOutcomeSchema

# 29 7.825   ✓ 發現 schema: outcomeQuerySchema

# 29 7.825   ✓ 發現 schema: outcomeParamsSchema

# 29 7.825   ✓ 發現 schema: outcomeProjectParamsSchema

# 29 7.825   ✓ 發現 schema: publicOutcomesQuerySchema

# 29 7.825   ✅ outcome.validators: 6 個 schemas

# 29 7.825 📖 載入 practice.validators.ts

# 29 8.103   ✓ 發現 schema: practiceStatusSchema

# 29 8.105   ✓ 發現 schema: contentTypeSchema

# 29 8.106   ✓ 發現 schema: dailyGoalTypeSchema

# 29 8.106   ✓ 發現 schema: dailyGoalSchema

# 29 8.106   ✓ 發現 schema: practiceResourceInputSchema

# 29 8.106   ✓ 發現 schema: practiceResourceSchema

# 29 8.106   ✓ 發現 schema: createPracticeSchema

# 29 8.107   ✓ 發現 schema: updatePracticeSchema

# 29 8.107   ✓ 發現 schema: checkInSchema

# 29 8.107   ✓ 發現 schema: practiceQuerySchema

# 29 8.108   ✓ 發現 schema: checkInQuerySchema

# 29 8.108   ✓ 發現 schema: eventViewSchema

# 29 8.108   ✓ 發現 schema: eventClickSchema

# 29 8.108   ✓ 發現 schema: eventShareSchema

# 29 8.108   ✓ 發現 schema: eventFavoriteSchema

# 29 8.108   ✓ 發現 schema: reactionSchema

# 29 8.108   ✓ 發現 schema: practiceParamsSchema

# 29 8.109   ✓ 發現 schema: practiceCommentParamsSchema

# 29 8.109   ✓ 發現 schema: myPracticesQuerySchema

# 29 8.109   ✅ practice.validators: 19 個 schemas

# 29 8.109 📖 載入 project.validators.ts

# 29 8.285   ✓ 發現 schema: createProjectSchema

# 29 8.285   ✓ 發現 schema: updateProjectSchema

# 29 8.286   ✓ 發現 schema: projectParamsSchema

# 29 8.286   ✓ 發現 schema: projectQuerySchema

# 29 8.286   ✓ 發現 schema: duplicateProjectSchema

# 29 8.286   ✓ 發現 schema: projectStatsQuerySchema

# 29 8.286   ✓ 發現 schema: batchProjectOperationSchema

# 29 8.287   ✅ project.validators: 7 個 schemas

# 29 8.287 📖 載入 request-params.validator.ts

# 29 8.391   ✓ 發現 schema: paginationSchema

# 29 8.391   ✓ 發現 schema: resourceFilterSchema

# 29 8.391   ✓ 發現 schema: reviewFilterSchema

# 29 8.391   ✓ 發現 schema: tagQuerySchema

# 29 8.391   ✓ 發現 schema: tagEntitySchema

# 29 8.391   ✅ request-params.validator: 5 個 schemas

# 29 8.391 📖 載入 resource-review.validator.ts

# 29 8.566   ✓ 發現 schema: timeUsageSchema

# 29 8.567   ✓ 發現 schema: scoreSchema

# 29 8.567   ✓ 發現 schema: reviewStatusSchema

# 29 8.567   ✓ 發現 schema: contentFeaturesSchema

# 29 8.567   ✓ 發現 schema: resourceUsageSchema

# 29 8.568   ✓ 發現 schema: resourceReviewBaseSchema

# 29 8.569   ✓ 發現 schema: resourceReviewSchema

# 29 8.570   ✓ 發現 schema: updateResourceReviewSchema

# 29 8.571   ✓ 發現 schema: updateReviewStatusSchema

# 29 8.572   ✅ resource-review.validator: 9 個 schemas

# 29 8.573 📖 載入 resource.validator.ts

# 29 8.720   ✓ 發現 schema: createResourceSchema

# 29 8.721   ✓ 發現 schema: updateResourceSchema

# 29 8.721   ✓ 發現 schema: updateResourceStatusSchema

# 29 8.721   ✅ resource.validator: 3 個 schemas

# 29 8.721 📖 載入 review.validators.ts

# 29 8.847   ✓ 發現 schema: moodSchema

# 29 8.847   ✓ 發現 schema: stressLevelSchema

# 29 8.847   ✓ 發現 schema: learningReviewSchema

# 29 8.847   ✓ 發現 schema: weekSchema

# 29 8.847   ✓ 發現 schema: visibilitySchema

# 29 8.847   ✓ 發現 schema: createReviewSchema

# 29 8.847   ✓ 發現 schema: updateReviewSchema

# 29 8.847   ✓ 發現 schema: reviewQuerySchema

# 29 8.847   ✓ 發現 schema: reviewParamsSchema

# 29 8.847   ✅ review.validators: 9 個 schemas

# 29 8.847 📖 載入 tag.validators.ts

# 29 8.967   ✓ 發現 schema: tagSearchQuerySchema

# 29 8.967   ✓ 發現 schema: popularTagsQuerySchema

# 29 8.968   ✓ 發現 schema: entityTagsQuerySchema

# 29 8.968   ✓ 發現 schema: addEntityTagSchema

# 29 8.968   ✓ 發現 schema: removeEntityTagSchema

# 29 8.968   ✓ 發現 schema: batchTagOperationSchema

# 29 8.969   ✓ 發現 schema: tagStatsQuerySchema

# 29 8.969   ✅ tag.validators: 7 個 schemas

# 29 8.969 📖 載入 user-custom-id.validators.ts

# 29 9.025   ✓ 發現 schema: customIdSchema

# 29 9.026   ✓ 發現 schema: customIdParamsSchema

# 29 9.026   ✓ 發現 schema: setCustomIdRequestSchema

# 29 9.026   ✅ user-custom-id.validators: 3 個 schemas

# 29 9.026 📖 載入 user.validators.ts

# 29 9.631   ✓ 發現 schema: createUserSchema

# 29 9.632   ✓ 發現 schema: updateUserSchema

# 29 9.632   ✓ 發現 schema: getUserParamsSchema

# 29 9.633   ✓ 發現 schema: getUserQuerySchema

# 29 9.633   ✓ 發現 schema: userPreferencesSchema

# 29 9.634   ✓ 發現 schema: userSuccessResponseSchema

# 29 9.635   ✓ 發現 schema: usersListResponseSchema

# 29 9.637   ✓ 發現 schema: createUserResponseSchema

# 29 9.639   ✓ 發現 schema: deleteUserResponseSchema

# 29 9.640   ✓ 發現 schema: userPreferencesResponseSchema

# 29 9.641   ✓ 發現 schema: updateUserPreferencesResponseSchema

# 29 9.641   ✓ 發現 schema: availablePreferencesResponseSchema

# 29 9.641   ✓ 發現 schema: customIdAvailabilityResponseSchema

# 29 9.641   ✓ 發現 schema: setCustomIdResponseSchema

# 29 9.641   ✓ 發現 schema: removeCustomIdResponseSchema

# 29 9.641   ✅ user.validators: 15 個 schemas

# 29 9.645 🔍 掃描路由定義

# 29 9.646 📁 找到 19 個路由檔案

# 29 9.646 📖 解析路由檔案: auth.routes.ts

# 29 9.651   ✓ 找到 10 個路由

# 29 9.652 📖 解析路由檔案: comment.routes.ts

# 29 9.654   ✓ 找到 5 個路由

# 29 9.654 📖 解析路由檔案: db-info.routes.ts

# 29 9.655   ✓ 找到 1 個路由

# 29 9.656 📖 解析路由檔案: email.routes.ts

# 29 9.660   ✓ 找到 11 個路由

# 29 9.660 📖 解析路由檔案: idea.routes.ts

# 29 9.661   ✓ 找到 5 個路由

# 29 9.661 📖 解析路由檔案: image.routes.ts

# 29 9.662   ✓ 找到 4 個路由

# 29 9.663 📖 解析路由檔案: me.routes.ts

# 29 9.664   ✓ 找到 8 個路由

# 29 9.664 📖 解析路由檔案: mentor.routes.ts

# 29 9.666   ✓ 找到 9 個路由

# 29 9.667 📖 解析路由檔案: milestone.routes.ts

# 29 9.668   ✓ 找到 4 個路由

# 29 9.668 📖 解析路由檔案: monitor.routes.ts

# 29 9.668   ✓ 找到 1 個路由

# 29 9.668 📖 解析路由檔案: note.routes.ts

# 29 9.669   ✓ 找到 7 個路由

# 29 9.669 📖 解析路由檔案: outcome.routes.ts

# 29 9.671   ✓ 找到 7 個路由

# 29 9.671 📖 解析路由檔案: practice.routes.ts

# 29 9.674   ✓ 找到 17 個路由

# 29 9.674 📖 解析路由檔案: project.routes.ts

# 29 9.675   ✓ 找到 8 個路由

# 29 9.675 📖 解析路由檔案: resource-review.routes.ts

# 29 9.676   ✓ 找到 8 個路由

# 29 9.676 📖 解析路由檔案: resource.routes.ts

# 29 9.678   ✓ 找到 8 個路由

# 29 9.678 📖 解析路由檔案: review.routes.ts

# 29 9.679   ✓ 找到 6 個路由

# 29 9.680 📖 解析路由檔案: tag.routes.ts

# 29 9.680   ✓ 找到 6 個路由

# 29 9.680 📖 解析路由檔案: user.routes.ts

# 29 9.682   ✓ 找到 14 個路由

# 29 9.682 ✅ 總共找到 139 個 API 路徑

# 29 9.683 📝 生成 OpenAPI 規範

# 29 9.763 ⚠️  無法從 schema 提取範例，使用硬編碼範例

# 29 9.764 ✅ 從 api-response.validators.ts 提取到 2 個範例，生成 4 個錯誤組件

# 29 9.764 📋 載入了 4 個錯誤範例組件

# 29 9.826 🔄 轉換 schemas

# 29 9.826 ✅ 轉換了 159 個 schemas

# 29 9.826 🔄 生成 API paths

# 29 9.830 ✅ 生成了 139 個 API 操作

# 29 9.830 💾 寫入文件

# 29 9.836 ✅ JSON: /app/openapi.json

# 29 9.966 ✅ YAML: /app/openapi.yaml

# 29 9.966 ================================================

# 29 9.966 🎉 Swagger/OpenAPI 文檔生成完成

# 29 9.967 📊 總計: 159 個 schemas

# 29 9.967 🏷️  標籤: 22 個

# 29 36.68

# 29 36.68 > daodao-server@1.0.0 postbuild /app

# 29 36.68 > echo 'TypeScript compilation completed' && cp -r generated dist/

# 29 36.68

# 29 36.69 TypeScript compilation completed

# 29 DONE 36.8s

# 30 [runtime  3/10] COPY --from=builder /app/dist ./dist

# 30 DONE 0.3s

# 31 [runtime  4/10] COPY --from=builder /app/openapi.json ./

# 31 DONE 0.0s

# 32 [runtime  5/10] COPY --from=builder /app/openapi.yaml ./

# 32 DONE 0.0s

# 33 [runtime  6/10] COPY --from=builder /app/ecosystem.config.js ./

# 33 DONE 0.0s

# 34 [runtime  7/10] COPY --from=prisma /app/generated ./generated

# 34 DONE 0.0s

# 35 [runtime  8/10] COPY prisma ./prisma

# 35 DONE 0.0s

# 36 [runtime  9/10] RUN mkdir -p /app/logs /app/dist/generated &&     if [ -d "/app/generated" ] && [ "$(ls -A /app/generated 2>/dev/null)" ]; then         cp -r /app/generated/* /app/dist/generated/;     fi

# 36 DONE 0.1s

# 37 [runtime 10/10] RUN chown -R nodejs:nodejs /app

# 37 DONE 11.6s

# 38 exporting to image

# 38 exporting layers

# 38 exporting layers 19.7s done

# 38 preparing layers for inline cache

# 38 preparing layers for inline cache 0.0s done

# 38 exporting manifest sha256:d7d02356a6f603ee994b886abadb1c1d4dd4843c7a12281d1859ee43c64bd37a done

# 38 exporting config sha256:adf4de016f94011ea52486bb11468e2b7838203aecbbbd17fc48b3265f43467d done

# 38 exporting attestation manifest sha256:542c2fbdbf7a88d9644334a03327fc8d68252a7d65b673fbbdd15e50d25b45fe done

# 38 exporting manifest list sha256:18d64e27ef25b61a2e2802b416a4f9273fc4db0080149178dddf5c4baa63ad0d done

# 38 pushing layers

# 38

# 39 [auth] ***/app:pull,push token for registry-1.docker.io

# 39 DONE 0.0s

# 38 exporting to image

# 38 pushing layers 6.0s done

# 38 pushing manifest for docker.io/***/app:dev@sha256:18d64e27ef25b61a2e2802b416a4f9273fc4db0080149178dddf5c4baa63ad0d

# 38 pushing manifest for docker.io/***/app:dev@sha256:18d64e27ef25b61a2e2802b416a4f9273fc4db0080149178dddf5c4baa63ad0d 1.8s done

# 38 pushing layers 1.4s done

# 38 pushing manifest for docker.io/***/app:dev-dcf3e5e364fedafeecdab3dc2cab516d5c9792aa@sha256:18d64e27ef25b61a2e2802b416a4f9273fc4db0080149178dddf5c4baa63ad0d

# 38 pushing manifest for docker.io/***/app:dev-dcf3e5e364fedafeecdab3dc2cab516d5c9792aa@sha256:18d64e27ef25b61a2e2802b416a4f9273fc4db0080149178dddf5c4baa63ad0d 0.6s done

# 38 DONE 29.5s

# 40 resolving provenance for metadata file

# 40 DONE 0.0s

ImageID
Digest
Metadata

Run ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -o ConnectTimeout=10 root@$LINODE_INSTANCE_IP << 'ENDSSH'
Pseudo-terminal will not be allocated because stdin is not a terminal.
Welcome to Ubuntu 22.04.4 LTS (GNU/Linux 5.15.0-143-generic x86_64)

* Documentation:  <https://help.ubuntu.com>
* Management:     <https://landscape.canonical.com>
* Support:        <https://ubuntu.com/pro>
 System information as of Sat Sep  6 04:19:51 AM UTC 2025
  System load:           0.87
  Usage of /:            53.2% of 48.64GB
  Memory usage:          71%
  Swap usage:            100%
  Processes:             190
  Users logged in:       1
  IPv4 address for eth0: ***
  IPv6 address for eth0: 2400:8905::f03c:94ff:fef3:8097
Expanded Security Maintenance for Applications is not enabled.
72 updates can be applied immediately.
To see these additional updates run: apt list --upgradable
Enable ESM Apps to receive additional future security updates.
See <https://ubuntu.com/esm> or run: sudo pro status
New release '24.04.3 LTS' available.
Run 'do-release-upgrade' to upgrade to it.
*** System restart required ***
=== Starting deployment for dev environment ===
Updating existing repository...
From <https://github.com/daodaoedu/daodao-server>
* branch            dev        -> FETCH_HEAD

* 1c042a4...dcf3e5e dev        -> origin/dev  (forced update)
HEAD is now at dcf3e5e feat: enhance OpenAPI schemas and improve response structures
.env.dev: line 17: ulcg: command not found
Environment variables loaded for dev
=== Blue-Green Deployment Strategy ===
Found existing container: 130e0fb29006
=== Pulling new image with progress display ===
Image to pull: ***/app:dev-dcf3e5e364fedafeecdab3dc2cab516d5c9792aa
Using IMAGE_TAG=dev, COMMIT_SHA=dcf3e5e364fedafeecdab3dc2cab516d5c9792aa
 dev_app Pulling
 9824c27679d3 Already exists
 c88300f8759a Already exists
 fd345d7e43c5 Already exists
 0de821d16564 Already exists
 072abb8b49c8 Pulling fs layer
 820cdfce9c16 Pulling fs layer
 6f994ca3fb6f Pulling fs layer
 78bee5071bc6 Pulling fs layer
 f3df05772f03 Pulling fs layer
 f400554c6f3c Pulling fs layer
 69c219a4e53a Pulling fs layer
 446d752ca575 Pulling fs layer
 c6c2e5d28334 Pulling fs layer
 10b3af197d89 Pulling fs layer
 3efd750f618b Pulling fs layer
 2a06d3ab1486 Pulling fs layer
 8d635fbedd6e Pulling fs layer
 78bee5071bc6 Waiting
 f3df05772f03 Waiting
 f400554c6f3c Waiting
 69c219a4e53a Waiting
 446d752ca575 Waiting
 c6c2e5d28334 Waiting
 10b3af197d89 Waiting
 3efd750f618b Waiting
 2a06d3ab1486 Waiting
 8d635fbedd6e Waiting
 072abb8b49c8 Downloading [=>                                                 ]  1.008kB/46.13kB
 072abb8b49c8 Verifying Checksum
 072abb8b49c8 Download complete
 072abb8b49c8 Extracting [===================================>               ]  32.77kB/46.13kB
 072abb8b49c8 Extracting [==================================================>]  46.13kB/46.13kB
 072abb8b49c8 Pull complete
 6f994ca3fb6f Downloading [==================================================>]      93B/93B
 6f994ca3fb6f Verifying Checksum
 6f994ca3fb6f Download complete
 820cdfce9c16 Downloading [>                                                  ]  43.74kB/4.261MB
 820cdfce9c16 Downloading [==>                                                ]  233.6kB/4.261MB
 820cdfce9c16 Downloading [====>                                              ]    426kB/4.261MB
 820cdfce9c16 Downloading [==========>                                        ]  868.4kB/4.261MB
 820cdfce9c16 Downloading [===============>                                   ]   1.36MB/4.261MB
 820cdfce9c16 Downloading [=========================>                         ]  2.195MB/4.261MB
 820cdfce9c16 Downloading [=======================================>           ]  3.391MB/4.261MB
 820cdfce9c16 Verifying Checksum
 820cdfce9c16 Download complete
 820cdfce9c16 Extracting [>                                                  ]  65.54kB/4.261MB
 820cdfce9c16 Extracting [====>                                              ]  393.2kB/4.261MB
 820cdfce9c16 Extracting [=========>                                         ]    852kB/4.261MB
 820cdfce9c16 Extracting [=================>                                 ]  1.507MB/4.261MB
 820cdfce9c16 Extracting [===================>                               ]  1.638MB/4.261MB
 820cdfce9c16 Extracting [=================================>                 ]  2.818MB/4.261MB
 820cdfce9c16 Extracting [==================================================>]  4.261MB/4.261MB
 820cdfce9c16 Pull complete
 6f994ca3fb6f Extracting [==================================================>]      93B/93B
 6f994ca3fb6f Extracting [==================================================>]      93B/93B
 6f994ca3fb6f Pull complete
 78bee5071bc6 Downloading [==================================================>]     970B/970B
 78bee5071bc6 Verifying Checksum
 78bee5071bc6 Download complete
 78bee5071bc6 Extracting [==================================================>]     970B/970B
 78bee5071bc6 Extracting [==================================================>]     970B/970B
 78bee5071bc6 Pull complete
 f400554c6f3c Downloading [>                                                  ]  94.74kB/9.232MB
 f400554c6f3c Downloading [====>                                              ]  884.7kB/9.232MB
 f400554c6f3c Downloading [=========>                                         ]  1.671MB/9.232MB
 f400554c6f3c Downloading [=============>                                     ]  2.458MB/9.232MB
 f400554c6f3c Downloading [==================>                                ]  3.342MB/9.232MB
 f400554c6f3c Downloading [============================>                      ]  5.325MB/9.232MB
 69c219a4e53a Downloading [==>                                                ]  1.008kB/19.14kB
 69c219a4e53a Downloading [==================================================>]  19.14kB/19.14kB
 69c219a4e53a Verifying Checksum
 69c219a4e53a Download complete
 f400554c6f3c Downloading [===================================>               ]  6.631MB/9.232MB
 f3df05772f03 Downloading [>                                                  ]  540.7kB/87.97MB
 f400554c6f3c Downloading [================================================>  ]  9.028MB/9.232MB
 f400554c6f3c Verifying Checksum
 f400554c6f3c Download complete
 f3df05772f03 Downloading [>                                                  ]  1.081MB/87.97MB
 f3df05772f03 Downloading [>                                                  ]   1.61MB/87.97MB
 f3df05772f03 Downloading [=>                                                 ]  2.687MB/87.97MB
 f3df05772f03 Downloading [==>                                                ]  4.297MB/87.97MB
 f3df05772f03 Downloading [===>                                               ]  5.915MB/87.97MB
 f3df05772f03 Downloading [====>                                              ]  8.053MB/87.97MB
 f3df05772f03 Downloading [======>                                            ]  10.73MB/87.97MB
 f3df05772f03 Downloading [========>                                          ]  14.47MB/87.97MB
 446d752ca575 Downloading [==>                                                ]  1.008kB/17.46kB
 446d752ca575 Downloading [==================================================>]  17.46kB/17.46kB
 446d752ca575 Verifying Checksum
 446d752ca575 Download complete
 f3df05772f03 Downloading [==========>                                        ]  18.19MB/87.97MB
 c6c2e5d28334 Downloading [==================================================>]     478B/478B
 c6c2e5d28334 Verifying Checksum
 c6c2e5d28334 Download complete
 f3df05772f03 Downloading [===========>                                       ]  20.33MB/87.97MB
 f3df05772f03 Downloading [============>                                      ]  22.48MB/87.97MB
 f3df05772f03 Downloading [==============>                                    ]  26.21MB/87.97MB
 f3df05772f03 Downloading [===============>                                   ]  27.82MB/87.97MB
 f3df05772f03 Downloading [=================>                                 ]  29.97MB/87.97MB
 f3df05772f03 Downloading [===================>                               ]  34.25MB/87.97MB
 f3df05772f03 Downloading [=====================>                             ]  37.96MB/87.97MB
 f3df05772f03 Downloading [=======================>                           ]   41.7MB/87.97MB
 f3df05772f03 Downloading [=========================>                         ]  45.45MB/87.97MB
 f3df05772f03 Downloading [===========================>                       ]  48.63MB/87.97MB
 10b3af197d89 Downloading [>                                                  ]  90.91kB/8.938MB
 3efd750f618b Downloading [======>                                            ]  1.009kB/7.883kB
 3efd750f618b Downloading [==================================================>]  7.883kB/7.883kB
 3efd750f618b Verifying Checksum
 3efd750f618b Download complete
 f3df05772f03 Downloading [=============================>                     ]  51.31MB/87.97MB
 f3df05772f03 Downloading [=============================>                     ]   52.4MB/87.97MB
 10b3af197d89 Downloading [==>                                                ]  462.8kB/8.938MB
 f3df05772f03 Downloading [==============================>                    ]  54.52MB/87.97MB
 10b3af197d89 Downloading [====>                                              ]  753.7kB/8.938MB
 f3df05772f03 Downloading [=================================>                 ]  58.26MB/87.97MB
 10b3af197d89 Downloading [======>                                            ]  1.147MB/8.938MB
 10b3af197d89 Downloading [==========>                                        ]  1.937MB/8.938MB
 f3df05772f03 Downloading [===================================>               ]   62.5MB/87.97MB
 10b3af197d89 Downloading [==============>                                    ]  2.585MB/8.938MB
 f3df05772f03 Downloading [=====================================>             ]  66.24MB/87.97MB
 10b3af197d89 Downloading [===================>                               ]  3.441MB/8.938MB
 10b3af197d89 Downloading [============================>                      ]  5.009MB/8.938MB
 10b3af197d89 Downloading [====================================>              ]  6.554MB/8.938MB
 10b3af197d89 Downloading [==============================================>    ]  8.327MB/8.938MB
 10b3af197d89 Verifying Checksum
 10b3af197d89 Download complete
 f3df05772f03 Downloading [=======================================>           ]  68.91MB/87.97MB
 2a06d3ab1486 Downloading [>                                                  ]  90.25kB/8.938MB
 2a06d3ab1486 Downloading [======>                                            ]  1.114MB/8.938MB
 2a06d3ab1486 Downloading [=============>                                     ]  2.372MB/8.938MB
 2a06d3ab1486 Downloading [==================>                                ]  3.326MB/8.938MB
 2a06d3ab1486 Downloading [======================>                            ]   4.08MB/8.938MB
 f3df05772f03 Downloading [=======================================>           ]  69.45MB/87.97MB
 2a06d3ab1486 Downloading [===========================>                       ]  4.846MB/8.938MB
 2a06d3ab1486 Downloading [==============================>                    ]  5.538MB/8.938MB
 f3df05772f03 Downloading [=======================================>           ]  69.99MB/87.97MB
 2a06d3ab1486 Downloading [===================================>               ]  6.312MB/8.938MB
 2a06d3ab1486 Downloading [======================================>            ]  6.971MB/8.938MB
 f3df05772f03 Downloading [========================================>          ]  70.53MB/87.97MB
 2a06d3ab1486 Downloading [============================================>      ]  7.946MB/8.938MB
 f3df05772f03 Downloading [========================================>          ]  71.07MB/87.97MB
 2a06d3ab1486 Downloading [===============================================>   ]  8.425MB/8.938MB
 2a06d3ab1486 Verifying Checksum
 2a06d3ab1486 Download complete
 f3df05772f03 Downloading [========================================>          ]   71.6MB/87.97MB
 f3df05772f03 Downloading [=========================================>         ]  72.14MB/87.97MB
 f3df05772f03 Downloading [=========================================>         ]  72.68MB/87.97MB
 f3df05772f03 Downloading [=========================================>         ]  73.22MB/87.97MB
 8d635fbedd6e Downloading [>                                                  ]  540.7kB/106.7MB
 f3df05772f03 Downloading [=========================================>         ]  73.75MB/87.97MB
 8d635fbedd6e Downloading [>                                                  ]  1.081MB/106.7MB
 8d635fbedd6e Downloading [>                                                  ]  1.618MB/106.7MB
 f3df05772f03 Downloading [==========================================>        ]  74.29MB/87.97MB
 8d635fbedd6e Downloading [=>                                                 ]  2.687MB/106.7MB
 8d635fbedd6e Downloading [=>                                                 ]  3.768MB/106.7MB
 f3df05772f03 Downloading [==========================================>        ]  74.83MB/87.97MB
 8d635fbedd6e Downloading [==>                                                ]   5.39MB/106.7MB
 8d635fbedd6e Downloading [===>                                               ]  7.533MB/106.7MB
 8d635fbedd6e Downloading [====>                                              ]  10.21MB/106.7MB
 f3df05772f03 Downloading [==========================================>        ]  75.36MB/87.97MB
 8d635fbedd6e Downloading [======>                                            ]  13.93MB/106.7MB
 8d635fbedd6e Downloading [========>                                          ]  18.74MB/106.7MB
 8d635fbedd6e Downloading [===========>                                       ]  24.63MB/106.7MB
 8d635fbedd6e Downloading [============>                                      ]   25.7MB/106.7MB
 f3df05772f03 Downloading [===========================================>       ]  75.89MB/87.97MB
 8d635fbedd6e Downloading [===============>                                   ]  33.21MB/106.7MB
 8d635fbedd6e Downloading [===================>                               ]  41.75MB/106.7MB
 8d635fbedd6e Downloading [=======================>                           ]  49.23MB/106.7MB
 8d635fbedd6e Downloading [==========================>                        ]   56.7MB/106.7MB
 8d635fbedd6e Downloading [=============================>                     ]  62.56MB/106.7MB
 f3df05772f03 Downloading [===========================================>       ]  76.42MB/87.97MB
 8d635fbedd6e Downloading [===============================>                   ]  67.38MB/106.7MB
 f3df05772f03 Downloading [===========================================>       ]  76.96MB/87.97MB
 8d635fbedd6e Downloading [================================>                  ]  68.98MB/106.7MB
 8d635fbedd6e Downloading [================================>                  ]  70.06MB/106.7MB
 f3df05772f03 Downloading [============================================>      ]   77.5MB/87.97MB
 8d635fbedd6e Downloading [=================================>                 ]  71.12MB/106.7MB
 8d635fbedd6e Downloading [=================================>                 ]  72.19MB/106.7MB
 f3df05772f03 Downloading [============================================>      ]  78.04MB/87.97MB
 8d635fbedd6e Downloading [==================================>                ]  74.33MB/106.7MB
 8d635fbedd6e Downloading [===================================>               ]  76.47MB/106.7MB
 f3df05772f03 Downloading [============================================>      ]  78.58MB/87.97MB
 8d635fbedd6e Downloading [=====================================>             ]  79.68MB/106.7MB
 8d635fbedd6e Downloading [=======================================>           ]  84.54MB/106.7MB
 8d635fbedd6e Downloading [=========================================>         ]  88.82MB/106.7MB
 f3df05772f03 Downloading [============================================>      ]  79.12MB/87.97MB
 8d635fbedd6e Downloading [============================================>      ]  95.21MB/106.7MB
 8d635fbedd6e Downloading [===============================================>   ]  101.1MB/106.7MB
 8d635fbedd6e Verifying Checksum
 8d635fbedd6e Download complete
 f3df05772f03 Downloading [=============================================>     ]  79.66MB/87.97MB
 f3df05772f03 Downloading [=============================================>     ]   80.2MB/87.97MB
 f3df05772f03 Downloading [=============================================>     ]  80.73MB/87.97MB
 f3df05772f03 Downloading [==============================================>    ]  81.26MB/87.97MB
 f3df05772f03 Downloading [==============================================>    ]  81.81MB/87.97MB
 f3df05772f03 Downloading [==============================================>    ]  82.35MB/87.97MB
 f3df05772f03 Downloading [===============================================>   ]  82.87MB/87.97MB
 f3df05772f03 Downloading [===============================================>   ]   83.4MB/87.97MB
 f3df05772f03 Downloading [===============================================>   ]  83.94MB/87.97MB
 f3df05772f03 Downloading [================================================>  ]  84.47MB/87.97MB
 f3df05772f03 Downloading [================================================>  ]     85MB/87.97MB
 f3df05772f03 Downloading [================================================>  ]  85.54MB/87.97MB
 f3df05772f03 Downloading [================================================>  ]  86.08MB/87.97MB
 f3df05772f03 Downloading [=================================================> ]  86.62MB/87.97MB
 f3df05772f03 Downloading [=================================================> ]  87.16MB/87.97MB
 f3df05772f03 Downloading [=================================================> ]   87.7MB/87.97MB
 f3df05772f03 Verifying Checksum
 f3df05772f03 Download complete
 f3df05772f03 Extracting [>                                                  ]  557.1kB/87.97MB
 f3df05772f03 Extracting [>                                                  ]  1.114MB/87.97MB
 f3df05772f03 Extracting [=>                                                 ]  3.342MB/87.97MB
 f3df05772f03 Extracting [==>                                                ]  5.014MB/87.97MB
 f3df05772f03 Extracting [===>                                               ]  6.685MB/87.97MB
 f3df05772f03 Extracting [=====>                                             ]  10.03MB/87.97MB
 f3df05772f03 Extracting [=======>                                           ]  13.37MB/87.97MB
 f3df05772f03 Extracting [=========>                                         ]  16.71MB/87.97MB
 f3df05772f03 Extracting [===========>                                       ]   19.5MB/87.97MB
 f3df05772f03 Extracting [============>                                      ]  22.84MB/87.97MB
 f3df05772f03 Extracting [==============>                                    ]  26.18MB/87.97MB
 f3df05772f03 Extracting [================>                                  ]  28.97MB/87.97MB
 f3df05772f03 Extracting [==================>                                ]  33.42MB/87.97MB
 f3df05772f03 Extracting [=====================>                             ]  37.32MB/87.97MB
 f3df05772f03 Extracting [=======================>                           ]  41.22MB/87.97MB
 f3df05772f03 Extracting [=========================>                         ]  45.12MB/87.97MB
 f3df05772f03 Extracting [=========================>                         ]  45.68MB/87.97MB
 f3df05772f03 Extracting [==========================>                        ]  46.24MB/87.97MB
 f3df05772f03 Extracting [===========================>                       ]  47.91MB/87.97MB
 f3df05772f03 Extracting [============================>                      ]  49.58MB/87.97MB
 f3df05772f03 Extracting [============================>                      ]  50.14MB/87.97MB
 f3df05772f03 Extracting [============================>                      ]  50.69MB/87.97MB
 f3df05772f03 Extracting [=============================>                     ]  51.25MB/87.97MB
 f3df05772f03 Extracting [=============================>                     ]  51.81MB/87.97MB
 f3df05772f03 Extracting [=============================>                     ]  52.36MB/87.97MB
 f3df05772f03 Extracting [==============================>                    ]  53.48MB/87.97MB
 f3df05772f03 Extracting [===============================>                   ]  54.59MB/87.97MB
 f3df05772f03 Extracting [===============================>                   ]  55.15MB/87.97MB
 f3df05772f03 Extracting [===============================>                   ]  56.26MB/87.97MB
 f3df05772f03 Extracting [================================>                  ]  56.82MB/87.97MB
 f3df05772f03 Extracting [================================>                  ]  57.38MB/87.97MB
 f3df05772f03 Extracting [=================================>                 ]  58.49MB/87.97MB
 f3df05772f03 Extracting [=================================>                 ]  59.05MB/87.97MB
 f3df05772f03 Extracting [==================================>                ]  60.16MB/87.97MB
 f3df05772f03 Extracting [==================================>                ]  60.72MB/87.97MB
 f3df05772f03 Extracting [===================================>               ]  61.83MB/87.97MB
 f3df05772f03 Extracting [===================================>               ]  62.95MB/87.97MB
 f3df05772f03 Extracting [====================================>              ]  64.06MB/87.97MB
 f3df05772f03 Extracting [=====================================>             ]  65.18MB/87.97MB
 f3df05772f03 Extracting [=====================================>             ]  66.29MB/87.97MB
 f3df05772f03 Extracting [======================================>            ]   67.4MB/87.97MB
 f3df05772f03 Extracting [======================================>            ]  68.52MB/87.97MB
 f3df05772f03 Extracting [=======================================>           ]  70.19MB/87.97MB
 f3df05772f03 Extracting [========================================>          ]  71.86MB/87.97MB
 f3df05772f03 Extracting [=========================================>         ]  72.97MB/87.97MB
 f3df05772f03 Extracting [==========================================>        ]  74.65MB/87.97MB
 f3df05772f03 Extracting [===========================================>       ]  75.76MB/87.97MB
 f3df05772f03 Extracting [============================================>      ]  77.43MB/87.97MB
 f3df05772f03 Extracting [============================================>      ]  78.54MB/87.97MB
 f3df05772f03 Extracting [============================================>      ]   79.1MB/87.97MB
 f3df05772f03 Extracting [==============================================>    ]  81.89MB/87.97MB
 f3df05772f03 Extracting [===============================================>   ]  83.56MB/87.97MB
 f3df05772f03 Extracting [================================================>  ]  85.79MB/87.97MB
 f3df05772f03 Extracting [=================================================> ]  87.46MB/87.97MB
 f3df05772f03 Extracting [==================================================>]  87.97MB/87.97MB
 f3df05772f03 Pull complete
 f400554c6f3c Extracting [>                                                  ]   98.3kB/9.232MB
 f400554c6f3c Extracting [====>                                              ]  786.4kB/9.232MB
 f400554c6f3c Extracting [==========================>                        ]  4.817MB/9.232MB
 f400554c6f3c Extracting [===============================================>   ]  8.749MB/9.232MB
 f400554c6f3c Extracting [==================================================>]  9.232MB/9.232MB
 f400554c6f3c Pull complete
 69c219a4e53a Extracting [==================================================>]  19.14kB/19.14kB
 69c219a4e53a Extracting [==================================================>]  19.14kB/19.14kB
 69c219a4e53a Pull complete
 446d752ca575 Extracting [==================================================>]  17.46kB/17.46kB
 446d752ca575 Extracting [==================================================>]  17.46kB/17.46kB
 446d752ca575 Pull complete
 c6c2e5d28334 Extracting [==================================================>]     478B/478B
 c6c2e5d28334 Extracting [==================================================>]     478B/478B
 c6c2e5d28334 Pull complete
 10b3af197d89 Extracting [>                                                  ]   98.3kB/8.938MB
 10b3af197d89 Extracting [==================>                                ]  3.244MB/8.938MB
 10b3af197d89 Extracting [===================================>               ]  6.291MB/8.938MB
 10b3af197d89 Extracting [==================================================>]  8.938MB/8.938MB
 10b3af197d89 Extracting [==================================================>]  8.938MB/8.938MB
 10b3af197d89 Pull complete
 3efd750f618b Extracting [==================================================>]  7.883kB/7.883kB
 3efd750f618b Extracting [==================================================>]  7.883kB/7.883kB
 3efd750f618b Pull complete
 2a06d3ab1486 Extracting [>                                                  ]   98.3kB/8.938MB
 2a06d3ab1486 Extracting [================>                                  ]  2.949MB/8.938MB
 2a06d3ab1486 Extracting [========================================>          ]  7.176MB/8.938MB
 2a06d3ab1486 Extracting [==================================================>]  8.938MB/8.938MB
 2a06d3ab1486 Extracting [==================================================>]  8.938MB/8.938MB
 2a06d3ab1486 Pull complete
 8d635fbedd6e Extracting [>                                                  ]  557.1kB/106.7MB
 8d635fbedd6e Extracting [==>                                                ]  4.456MB/106.7MB
 8d635fbedd6e Extracting [===>                                               ]  8.356MB/106.7MB
 8d635fbedd6e Extracting [====>                                              ]   9.47MB/106.7MB
 8d635fbedd6e Extracting [======>                                            ]  12.81MB/106.7MB
 8d635fbedd6e Extracting [========>                                          ]  17.27MB/106.7MB
 8d635fbedd6e Extracting [========>                                          ]  18.94MB/106.7MB
 8d635fbedd6e Extracting [=========>                                         ]   19.5MB/106.7MB
 8d635fbedd6e Extracting [==========>                                        ]  22.28MB/106.7MB
 8d635fbedd6e Extracting [==========>                                        ]   23.4MB/106.7MB
 8d635fbedd6e Extracting [============>                                      ]   27.3MB/106.7MB
 8d635fbedd6e Extracting [==============>                                    ]  30.64MB/106.7MB
 8d635fbedd6e Extracting [================>                                  ]  34.54MB/106.7MB
 8d635fbedd6e Extracting [=================>                                 ]  37.88MB/106.7MB
 8d635fbedd6e Extracting [===================>                               ]  41.22MB/106.7MB
 8d635fbedd6e Extracting [====================>                              ]  44.01MB/106.7MB
 8d635fbedd6e Extracting [=====================>                             ]  46.24MB/106.7MB
 8d635fbedd6e Extracting [======================>                            ]  47.35MB/106.7MB
 8d635fbedd6e Extracting [=======================>                           ]  50.14MB/106.7MB
 8d635fbedd6e Extracting [=========================>                         ]  54.59MB/106.7MB
 8d635fbedd6e Extracting [==========================>                        ]  57.38MB/106.7MB
 8d635fbedd6e Extracting [============================>                      ]  61.83MB/106.7MB
 8d635fbedd6e Extracting [==============================>                    ]  64.06MB/106.7MB
 8d635fbedd6e Extracting [==============================>                    ]  64.62MB/106.7MB
 8d635fbedd6e Extracting [==============================>                    ]  65.73MB/106.7MB
 8d635fbedd6e Extracting [===============================>                   ]  66.29MB/106.7MB
 8d635fbedd6e Extracting [===============================>                   ]  67.96MB/106.7MB
 8d635fbedd6e Extracting [================================>                  ]  68.52MB/106.7MB
 8d635fbedd6e Extracting [================================>                  ]  69.07MB/106.7MB
 8d635fbedd6e Extracting [================================>                  ]  70.19MB/106.7MB
 8d635fbedd6e Extracting [=================================>                 ]  70.75MB/106.7MB
 8d635fbedd6e Extracting [=================================>                 ]   71.3MB/106.7MB
 8d635fbedd6e Extracting [=================================>                 ]  71.86MB/106.7MB
 8d635fbedd6e Extracting [==================================>                ]  72.97MB/106.7MB
 8d635fbedd6e Extracting [==================================>                ]  73.53MB/106.7MB
 8d635fbedd6e Extracting [==================================>                ]  74.09MB/106.7MB
 8d635fbedd6e Extracting [===================================>               ]   75.2MB/106.7MB
 8d635fbedd6e Extracting [===================================>               ]  75.76MB/106.7MB
 8d635fbedd6e Extracting [===================================>               ]  76.32MB/106.7MB
 8d635fbedd6e Extracting [====================================>              ]  77.43MB/106.7MB
 8d635fbedd6e Extracting [====================================>              ]  78.54MB/106.7MB
 8d635fbedd6e Extracting [=====================================>             ]  79.66MB/106.7MB
 8d635fbedd6e Extracting [======================================>            ]  81.89MB/106.7MB
 8d635fbedd6e Extracting [========================================>          ]  85.79MB/106.7MB
 8d635fbedd6e Extracting [=========================================>         ]  89.13MB/106.7MB
 8d635fbedd6e Extracting [==========================================>        ]   90.8MB/106.7MB
 8d635fbedd6e Extracting [===========================================>       ]  93.03MB/106.7MB
 8d635fbedd6e Extracting [============================================>      ]  95.26MB/106.7MB
 8d635fbedd6e Extracting [=============================================>     ]  96.93MB/106.7MB
 8d635fbedd6e Extracting [=============================================>     ]  97.48MB/106.7MB
 8d635fbedd6e Extracting [==============================================>    ]  99.71MB/106.7MB
 8d635fbedd6e Extracting [===============================================>   ]  101.4MB/106.7MB
 8d635fbedd6e Extracting [================================================>  ]  103.6MB/106.7MB
 8d635fbedd6e Extracting [=================================================> ]  104.7MB/106.7MB
 8d635fbedd6e Extracting [=================================================> ]  105.8MB/106.7MB
 8d635fbedd6e Extracting [=================================================> ]  106.4MB/106.7MB
 8d635fbedd6e Extracting [==================================================>]  106.7MB/106.7MB
 8d635fbedd6e Pull complete
 dev_app Pulled
✅ Successfully pulled image
Starting new container...
time="2025-09-06T04:20:42Z" level=warning msg="Found orphan containers ([postgres-prod postgres-dev]) for this project. If you removed or renamed this service in your compose file, you can run this command with the --remove-orphans flag to clean it up."
 Container daodao-server-dev_app-7  Recreate
 Container daodao-server-dev_app-8  Recreate
 Container daodao-server-dev_app-7  Recreated
 Container daodao-server-dev_app-8  Recreated
 Container daodao-server-dev_app-8  Starting
 Container daodao-server-dev_app-8  Started
 Container daodao-server-dev_app-7  Starting
 Container daodao-server-dev_app-7  Started
=== Health Check ===
Health check attempt 1/30...
Health check attempt 2/30...
Health check attempt 3/30...
Health check attempt 4/30...
New container 703794a75327 is healthy
Stopping old container: 130e0fb29006
Error response from daemon: No such container: 130e0fb29006
Error response from daemon: No such container: 130e0fb29006
Cleaning up old images...
Total reclaimed space: 0B
=== Deployment completed successfully ===

root@localhost:~# docker logs daodao-server-dev_app-7
2025-09-06T04:20:45: PM2 log: Launching in no daemon mode
2025-09-06T04:20:45: PM2 log: App [node_app:0] starting in -cluster mode-
2025-09-06T04:20:45: PM2 log: App [node_app:0] online
prisma:info Starting a postgresql pool with 3 connections.
[04:20:51] info: Prisma Info Starting a postgresql pool with 3 connections. {"target":"quaint::pooled"}
✅ Prisma 資料庫連接成功
🗄️ 資料庫連線已建立
🚀 初始化 TypeScript 模型和相關設定...
[04:20:51] info: Application startup {"event":"startup","nodeVersion":"v20.19.5","platform":"linux","environment":"dev"}
📝 Winston 日誌中間件已初始化
🔄 Response Enhancer Middleware 已初始化
🔐 Passport 認證系統已初始化
🔍 OpenAPI 路徑調試:
    __dirname: /app/dist/src
    process.cwd(): /app
    isDist: true
    openapiPath: /app/openapi.json
    文件存在: true
✅ 已載入 Zod v4 自動生成的 OpenAPI 文檔
📚 Swagger UI 已初始化 - 可在 /api-docs 和 /api/docs 訪問
🧪 TypeScript 測試路由已註冊 - 可在 /api/ts-test 訪問
🔑 v1 認證路由已註冊 - 可在 /api/v1/auth 訪問
💯 v1 資源路由已註冊 - 可在 /api/v1/resources 訪問
💯 v1 資源和評價路由已註冊 - 可在 /api/v1/resources 訪問
💡 v1 想法路由已註冊 - 可在 /api/v1/ideas 訪問
👤 v1 個人路由已註冊 - 可在 /api/v1/me 訪問
🏷️ v1 標籤路由已註冊 - 可在 /api/v1/tags 訪問
📁 v1 專案路由已註冊 - 可在 /api/v1/projects 訪問
👥 v1 用戶路由已註冊 - 可在 /api/v1/users 訪問
💬 v1 留言路由已註冊 - 可在 /api/v1/comments 訪問
🖼️ v1 圖片路由已註冊 - 可在 /api/v1/images 訪問
📧 v1 郵件路由已註冊 - 可在 /api/v1/email 訪問
📝 v1 便利貼路由已註冊 - 可在 /api/v1/notes 訪問
🎯 v1 成果路由已註冊 - 可在 /api/v1/outcomes 訪問
📊 v1 覆盤路由已註冊 - 可在 /api/v1/reviews 訪問
👨‍🏫 v1 導師路由已註冊 - 可在 /api/v1/mentor 訪問
🎯 v1 里程碑路由已註冊 - 可在 /api/v1/projects/:projectId/milestones 訪問
⚡ v1 實踐路由已註冊 - 可在 /api/v1/practices 訪問
🗃️ v1 資料庫資訊路由已註冊 - 可在 /api/v1/db-info 訪問
📊 v1 系統監控路由已註冊 - 可在 /api/v1/monitor 訪問
📄 監控頁面路由已註冊 - 可在 /api/v1/monitor.html 訪問
🗃️ 資料庫資訊頁面路由已註冊 - 可在 /api/v1/db-info.html 訪問
✅ v1 健康檢查端點已註冊 - 可在 /api/v1/health 訪問
✅ 已啟用 Prisma 資料庫架構
📁 靜態文件服務已初始化
🚨 錯誤日誌中間件已初始化
🚨 全域錯誤處理中間件已初始化
🚀 TypeScript Server running on port 3000
📖 API docs available at <http://localhost:3000/api-docs>
📖 API docs also available at <http://localhost:3000/api/docs>
[04:21:05] info: Request started {"requestId":"req_1757132465739_u6de18zq1","method":"GET","url":"/api/v1/health","userAgent":"Wget","ip":"::1"}
[04:21:05] info: Request completed {"requestId":"req_1757132465739_u6de18zq1","method":"GET","url":"/api/v1/health","statusCode":200,"duration":19,"contentLength":"76"}
[04:21:20] info: Request started {"requestId":"req_1757132480034_iomict007","method":"GET","url":"/api/v1/health","ip":"::1"}
[04:21:20] info: Request completed {"requestId":"req_1757132480034_iomict007","method":"GET","url":"/api/v1/health","statusCode":200,"duration":2,"contentLength":"75"}
[04:21:50] info: Request started {"requestId":"req_1757132510166_q64sjj3fj","method":"GET","url":"/api/v1/health","ip":"::1"}
[04:21:50] info: Request completed {"requestId":"req_1757132510166_q64sjj3fj","method":"GET","url":"/api/v1/health","statusCode":200,"duration":1,"contentLength":"76"}
[04:22:20] info: Request started {"requestId":"req_1757132540286_4sjtiaead","method":"GET","url":"/api/v1/health","ip":"::1"}
[04:22:20] info: Request completed {"requestId":"req_1757132540286_4sjtiaead","method":"GET","url":"/api/v1/health","statusCode":200,"duration":0,"contentLength":"76"}
[04:22:50] info: Request started {"requestId":"req_1757132570478_pcb6t9fry","method":"GET","url":"/api/v1/health","ip":"::1"}
[04:22:50] info: Request completed {"requestId":"req_1757132570478_pcb6t9fry","method":"GET","url":"/api/v1/health","statusCode":200,"duration":1,"contentLength":"76"}
[04:23:20] info: Request started {"requestId":"req_1757132600614_np1xw0886","method":"GET","url":"/api/v1/health","ip":"::1"}
[04:23:20] info: Request completed {"requestId":"req_1757132600614_np1xw0886","method":"GET","url":"/api/v1/health","statusCode":200,"duration":1,"contentLength":"77"}
[04:23:50] info: Request started {"requestId":"req_1757132630739_wk4m0e7rz","method":"GET","url":"/api/v1/health","ip":"::1"}
[04:23:50] info: Request completed {"requestId":"req_1757132630739_wk4m0e7rz","method":"GET","url":"/api/v1/health","statusCode":200,"duration":1,"contentLength":"77"}
[04:24:20] info: Request started {"requestId":"req_1757132660896_q2xq24yny","method":"GET","url":"/api/v1/health","ip":"::1"}
[04:24:20] info: Request completed {"requestId":"req_1757132660896_q2xq24yny","method":"GET","url":"/api/v1/health","statusCode":200,"duration":1,"contentLength":"77"}
[04:24:51] info: Request started {"requestId":"req_1757132691072_gl4fcapi7","method":"GET","url":"/api/v1/health","ip":"::1"}
[04:24:51] info: Request completed {"requestId":"req_1757132691072_gl4fcapi7","method":"GET","url":"/api/v1/health","statusCode":200,"duration":1,"contentLength":"77"}
[04:25:21] info: Request started {"requestId":"req_1757132721550_091w6pvtb","method":"GET","url":"/api/v1/health","ip":"::1"}
[04:25:21] info: Request completed {"requestId":"req_1757132721550_091w6pvtb","method":"GET","url":"/api/v1/health","statusCode":200,"duration":1,"contentLength":"77"}
[04:25:51] info: Request started {"requestId":"req_1757132751844_ne33i2h9y","method":"GET","url":"/api/v1/health","ip":"::1"}
[04:25:51] info: Request completed {"requestId":"req_1757132751844_ne33i2h9y","method":"GET","url":"/api/v1/health","statusCode":200,"duration":0,"contentLength":"77"}
[04:26:22] info: Request started {"requestId":"req_1757132782123_parhwied1","method":"GET","url":"/api/v1/health","ip":"::1"}
[04:26:22] info: Request completed {"requestId":"req_1757132782123_parhwied1","method":"GET","url":"/api/v1/health","statusCode":200,"duration":3,"contentLength":"77"}
[04:26:52] info: Request started {"requestId":"req_1757132812618_9rtjimf4o","method":"GET","url":"/api/v1/health","ip":"::1"}
[04:26:52] info: Request completed {"requestId":"req_1757132812618_9rtjimf4o","method":"GET","url":"/api/v1/health","statusCode":200,"duration":1,"contentLength":"77"}
[04:27:22] info: Request started {"requestId":"req_1757132842781_z3sdf1a2r","method":"GET","url":"/api/v1/health","ip":"::1"}
[04:27:22] info: Request completed {"requestId":"req_1757132842781_z3sdf1a2r","method":"GET","url":"/api/v1/health","statusCode":200,"duration":1,"contentLength":"77"}
[04:27:52] info: Request started {"requestId":"req_1757132872921_emo24zx8z","method":"GET","url":"/api/v1/health","ip":"::1"}
[04:27:52] info: Request completed {"requestId":"req_1757132872921_emo24zx8z","method":"GET","url":"/api/v1/health","statusCode":200,"duration":1,"contentLength":"77"}
[04:28:23] info: Request started {"requestId":"req_1757132903097_ae8gqff5u","method":"GET","url":"/api/v1/health","ip":"::1"}
[04:28:23] info: Request completed {"requestId":"req_1757132903097_ae8gqff5u","method":"GET","url":"/api/v1/health","statusCode":200,"duration":0,"contentLength":"77"}
[04:28:53] info: Request started {"requestId":"req_1757132933281_iljs67boa","method":"GET","url":"/api/v1/health","ip":"::1"}
[04:28:53] info: Request completed {"requestId":"req_1757132933281_iljs67boa","method":"GET","url":"/api/v1/health","statusCode":200,"duration":1,"contentLength":"77"}
[04:29:23] info: Request started {"requestId":"req_1757132963672_twpi11j6t","method":"GET","url":"/api/v1/health","ip":"::1"}
[04:29:23] info: Request completed {"requestId":"req_1757132963672_twpi11j6t","method":"GET","url":"/api/v1/health","statusCode":200,"duration":1,"contentLength":"77"}
[04:29:53] info: Request started {"requestId":"req_1757132993849_p3gxqykv8","method":"GET","url":"/api/v1/health","ip":"::1"}
[04:29:53] info: Request completed {"requestId":"req_1757132993849_p3gxqykv8","method":"GET","url":"/api/v1/health","statusCode":200,"duration":1,"contentLength":"77"}
[04:30:23] info: Request started {"requestId":"req_1757133023978_178a5tr94","method":"GET","url":"/api/v1/health","ip":"::1"}
[04:30:23] info: Request completed {"requestId":"req_1757133023978_178a5tr94","method":"GET","url":"/api/v1/health","statusCode":200,"duration":1,"contentLength":"77"}
[04:30:54] info: Request started {"requestId":"req_1757133054125_xcj3s8hup","method":"GET","url":"/api/v1/health","ip":"::1"}
[04:30:54] info: Request completed {"requestId":"req_1757133054125_xcj3s8hup","method":"GET","url":"/api/v1/health","statusCode":200,"duration":3,"contentLength":"76"}
[04:31:24] info: Request started {"requestId":"req_1757133084276_kjs30a4zz","method":"GET","url":"/api/v1/health","ip":"::1"}
[04:31:24] info: Request completed {"requestId":"req_1757133084276_kjs30a4zz","method":"GET","url":"/api/v1/health","statusCode":200,"duration":1,"contentLength":"77"}
[04:31:54] info: Request started {"requestId":"req_1757133114427_50dgtiiwj","method":"GET","url":"/api/v1/health","ip":"::1"}
[04:31:54] info: Request completed {"requestId":"req_1757133114427_50dgtiiwj","method":"GET","url":"/api/v1/health","statusCode":200,"duration":1,"contentLength":"77"}
[04:32:24] info: Request started {"requestId":"req_1757133144575_d8zhs3gff","method":"GET","url":"/api/v1/health","ip":"::1"}
[04:32:24] info: Request completed {"requestId":"req_1757133144575_d8zhs3gff","method":"GET","url":"/api/v1/health","statusCode":200,"duration":1,"contentLength":"77"}
[04:32:54] info: Request started {"requestId":"req_1757133174705_8g47bzckh","method":"GET","url":"/api/v1/health","ip":"::1"}
[04:32:54] info: Request completed {"requestId":"req_1757133174705_8g47bzckh","method":"GET","url":"/api/v1/health","statusCode":200,"duration":1,"contentLength":"77"}
[04:33:24] info: Request started {"requestId":"req_1757133204900_nfy2tyaq1","method":"GET","url":"/api/v1/health","ip":"::1"}
[04:33:24] info: Request completed {"requestId":"req_1757133204900_nfy2tyaq1","method":"GET","url":"/api/v1/health","statusCode":200,"duration":0,"contentLength":"76"}
[04:33:55] info: Request started {"requestId":"req_1757133235050_2m3re85w1","method":"GET","url":"/api/v1/health","ip":"::1"}
[04:33:55] info: Request completed {"requestId":"req_1757133235050_2m3re85w1","method":"GET","url":"/api/v1/health","statusCode":200,"duration":1,"contentLength":"77"}
