#!/bin/sh
# Disposable smoke; image must be built from the candidate Dockerfile first.
set -eu
image=${1:?Usage: test-nonroot-container.sh IMAGE}
fixture=$(mktemp -d)
owner="daodao334-$(basename "$fixture")"
container="$owner-pm2"
volume="$owner-logs"
cleanup() {
  docker rm -f "$container" >/dev/null 2>&1 || true
  docker volume rm "$volume" >/dev/null 2>&1 || true
  rm -rf "$fixture"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
# Fail before starting any application if root or writable program/system files.
docker run --rm --network none --entrypoint node "$image" -e '
const fs=require("fs");
if(process.getuid()===0) throw Error("runtime must not be root");
if(process.getuid()!==1000 || process.getgid()!==1000) throw Error("expected node UID/GID 1000");
for(const p of ["/etc", "/app/dist", "/app/node_modules"]) {
 let writable=true;try{fs.accessSync(p,fs.constants.W_OK)}catch{writable=false}
 if(writable) throw Error("unexpected writable path: "+p);
}
fs.mkdirSync(process.env.PM2_HOME,{recursive:true});
fs.writeFileSync("/app/logs/smoke.log","unprivileged logs work\n");
console.log("nonroot permissions PASS uid="+process.getuid());'
cat > "$fixture/server.js" <<'JS'
const fs = require('fs');
fs.appendFileSync('/app/logs/fixture.log', `started:${process.getuid()}\n`);
const timer=setInterval(()=>{},1000);
for(const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>{
 fs.appendFileSync('/app/logs/fixture.log',`stopped:${signal}\n`);
 clearInterval(timer);process.exit(0);
});
JS
chmod 755 "$fixture"
chmod 644 "$fixture/server.js"
docker volume create --label io.daodao.test=nonroot-334 "$volume" >/dev/null
# Prepare only our disposable volume, never any real host logs.
docker run --rm --network none --user 0 --mount "type=volume,src=$volume,dst=/smoke" --entrypoint sh "$image" -c 'chown 1000:1000 /smoke; chmod 750 /smoke'
docker run -d --name "$container" --label io.daodao.test=nonroot-334 --network none --no-healthcheck \
 --mount "type=volume,src=$volume,dst=/app/logs" \
 --mount "type=bind,src=$fixture/server.js,dst=/app/dist/src/server.js,readonly" "$image" >/dev/null
ready=0
for _attempt in $(seq 1 60); do
 if docker exec "$container" node -e 'const s=require("fs").readFileSync("/app/logs/fixture.log","utf8");if(!s.includes("started:1000"))process.exit(1)' >/dev/null 2>&1; then ready=1;break;fi
 sleep 1
done
[ "$ready" = 1 ] || { docker logs "$container"; echo 'PM2 fixture did not start' >&2;exit 1; }
docker kill --signal TERM "$container" >/dev/null
stopped=0
for _attempt in $(seq 1 30); do
 if [ "$(docker inspect --format '{{.State.Running}}' "$container")" = false ]; then stopped=1;break;fi
 sleep 1
done
[ "$stopped" = 1 ] || { echo "PM2 did not stop within 30 seconds" >&2;exit 1; }
status=$(docker inspect --format '{{.State.ExitCode}}' "$container")
[ "$status" = 0 ] || { docker logs "$container";echo "PM2 exit $status" >&2;exit 1; }
docker run --rm --network none --mount "type=volume,src=$volume,dst=/app/logs" --entrypoint node "$image" -e 'const s=require("fs").readFileSync("/app/logs/fixture.log","utf8");if(!s.includes("stopped:SIG"))throw Error("missing graceful shutdown");console.log("PM2 lifecycle PASS");'
# Model a root-owned production bind mount: deny rather than silently elevating.
docker run --rm --network none --user 0 --mount "type=volume,src=$volume,dst=/smoke" --entrypoint sh "$image" -c 'chown 0:0 /smoke; chmod 755 /smoke'
if docker run --rm --network none --mount "type=volume,src=$volume,dst=/app/logs" --entrypoint node "$image" -e 'require("fs").writeFileSync("/app/logs/must-fail", "x")' >/dev/null 2>&1; then
 echo 'root-owned mount unexpectedly writable' >&2;exit 1
fi
echo 'root-owned mount refusal PASS; deployment requires owner/ACL preparation'
