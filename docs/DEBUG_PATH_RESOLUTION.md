# Debug Path Resolution Issue

## Problem
API Documentation shows "API Documentation Not Available" despite openapi.json existing in container at `/app/openapi.json`.

## Container Debug Commands

### 1. Test Path Resolution Logic
```bash
docker exec -it $(docker ps --filter "name=daodao-server-dev_app" -q | head -n 1) node -e "
const path = require('path');
const fs = require('fs');
const testDir = '/app/dist/src';
const isDist = testDir.includes('/dist/src');
const openapiPath = isDist ? path.join(testDir, '../../openapi.json') : path.join(testDir, '../openapi.json');
console.log('__dirname simulation:', testDir);
console.log('isDist:', isDist);
console.log('Resolved path:', openapiPath);
console.log('File exists:', fs.existsSync(openapiPath));
console.log('Actual file path /app/openapi.json exists:', fs.existsSync('/app/openapi.json'));
try {
  const content = fs.readFileSync(openapiPath, 'utf-8');
  console.log('File readable, size:', content.length);
} catch (error) {
  console.log('Read error:', error.message);
}
"
```

### 2. Check File Permissions
```bash
docker exec -it $(docker ps --filter "name=daodao-server-dev_app" -q | head -n 1) sh -c "ls -la /app/openapi.json"
```

### 3. Verify App Directory Structure
```bash
docker exec -it $(docker ps --filter "name=daodao-server-dev_app" -q | head -n 1) sh -c "find /app -name 'openapi.*' -ls"
```

### 4. Test Alternative Path Resolution
```bash
docker exec -it $(docker ps --filter "name=daodao-server-dev_app" -q | head -n 1) node -e "
const path = require('path');
const fs = require('fs');
console.log('Testing different path approaches:');
console.log('1. Direct path /app/openapi.json:', fs.existsSync('/app/openapi.json'));
console.log('2. Relative from dist/src ../../openapi.json:', fs.existsSync(path.resolve('/app/dist/src', '../../openapi.json')));
console.log('3. Path join from dist/src:', fs.existsSync(path.join('/app/dist/src', '../../openapi.json')));
console.log('4. Absolute resolve:', path.resolve('/app/dist/src', '../../openapi.json'));
"
```

### 5. Check Current Working Directory in App
```bash
docker exec -it $(docker ps --filter "name=daodao-server-dev_app" -q | head -n 1) node -e "
console.log('process.cwd():', process.cwd());
console.log('__dirname equivalent would be:', '/app/dist/src');
"
```

## Expected Results
- Path resolution should point to `/app/openapi.json`
- File should exist and be readable
- No permission issues should be present

## Next Steps
Based on the debug results, determine if:
1. Path resolution logic is incorrect
2. File permissions issue
3. App deployment issue where updated code hasn't been deployed