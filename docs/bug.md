curl -X 'POST' \
  '<http://localhost:4000/api/v1/practices/eb34a3de-6991-4989-9cf3-c967613be496/checkins>' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiX2lkIjoiNThiOTE1YWYtYzM2MS00OTAwLWE2YWYtNTNiMDgyYTdmNjJjIiwidXNlcm5hbWUiOiIiLCJpc1RlbXAiOmZhbHNlLCJyb2xlcyI6WyJTdXBlckFkbWluIiwiY2l0aXplbiIsImV4cGVyaW1lbnRhbC1lZHVjYXRvciIsIm90aGVyIl0sInBlcm1pc3Npb25zIjpbXSwiaWF0IjoxNzY5ODYyMjg3LCJleHAiOjE3NzA0NjcwODd9.Gc3l9yby1NuYdHAj7QGFXRun3Z5c2UX6UCS8qjhPrfQ' \
  -H 'Content-Type: application/json' \
  -d '{
  "mood": "happy",
  "note": "今天閱讀了第三章，學到了很多新概念",
  "imageUrls": [],
  "ogImageUrl": null,
  "tags": [
    "專注",
    "有收穫"
  ]
}'

{
  "success": false,
  "data": null,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "\n\u001b[31mInvalid \u001b[1m`prismaClient.practice_checkins.findFirst()`\u001b[22m invocation in\u001b[39m\n\u001b[4m/Users/xiaoxu/Projects/daodao/daodao-server/src/services/practice-checkin.service.ts:89:66\u001b[24m\n\n  \u001b[2m\u001b[90m86\u001b[39m today\u001b[34m.\u001b[39m\u001b[36msetUTCHours\u001b[39m\u001b[34m(\u001b[39m\u001b[36m0\u001b[39m\u001b[34m,\u001b[39m \u001b[36m0\u001b[39m\u001b[34m,\u001b[39m \u001b[36m0\u001b[39m\u001b[34m,\u001b[39m \u001b[36m0\u001b[39m\u001b[34m)\u001b[39m\u001b[34m;\u001b[39m\u001b[22m\n  \u001b[2m\u001b[90m87\u001b[39m \u001b[22m\n  \u001b[2m\u001b[90m88\u001b[39m \u001b[90m// 檢查當日是否已簽到\u001b[39m\u001b[22m\n\u001b[1m\u001b[31m→\u001b[39m\u001b[22m \u001b[2m\u001b[90m89\u001b[39m \u001b[36mconst\u001b[39m existingCheckIn = \u001b[36mawait\u001b[39m prismaClient\u001b[34m.\u001b[39mpractice_checkins\u001b[34m.\u001b[39m\u001b[36mfindFirst\u001b[39m\u001b[34m(\u001b[39m\u001b[22m\nThe column `practice_checkins.og_image_url` does not exist in the current database."
  },
  "timestamp": "2026-01-31T13:16:37.109Z",
  "meta": {
    "requestId": "req_1769865397052_con5t4zw5",
    "processingTime": 57
  }
}
