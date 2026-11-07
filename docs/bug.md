# 合成登入回應範例

以下資料全部為合成範例，不對應真實帳號或請求。

```json
{
    "success": true,
    "data": {
        "user": {
            "id": "00000000-0000-4000-8000-000000000001",
            "nickname": "範例使用者",
            "email": "test.user@example.com",
            "name": "範例使用者",
            "photo_url": "https://example.com/avatar.png",
            "is_active": true,
            "email_verified": false,
            "email_verified_at": null,
            "roles": [
                "User"
            ],
            "permissions": []
        },
        "isTemporary": false
    },
    "timestamp": "2026-01-01T00:00:00.000Z",
    "meta": {
        "requestId": "req_example",
        "processingTime": 6
    }
}
```

登入導向範例：

<http://localhost:3001/en/auth/verify-email?status=success&message=already_verified>
