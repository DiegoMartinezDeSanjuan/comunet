# COMUNET Load Testing

The goal is to validate that the application and its infrastructure can support concurrent access from up to 500 tenants, presidents, and providers simultaneously checking documents or downloading receipts without dropping requests.

Requirements:
- Install [k6](https://k6.io/docs/get-started/installation/) locally.
- For 500 CCU, use `Redis`-based Rate Limiting (set `UPSTASH_REDIS_REST_URL`).

## Execution

Ensure your database pool is appropriately sized for 500 concurrent connections, and PgBouncer is configured correctly. Run your web server (`next start`).

Run the 5-minute sustained load test targeting 500 VUs (Virtual Users):
```bash
k6 run load-test.js
```

### With Variables
```bash
k6 run -e BASE_URL=https://comunet-staging.example.com load-test.js
```

## Interpreting Results
k6 will output metrics, particularly:
- `http_req_duration`: Ensure p(95) < 500ms
- `http_req_failed`: Must remain < 1%. Failing requests are usually 429s due to rate limits hitting when IP isn't rotated, or 502/503 from the database timing out (PGBouncer limit reached).
