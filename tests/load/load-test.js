import http from 'k6/http';
import { check, sleep } from 'k6';

// 500 concurrent users for a 5-minute sustained load test (plus ramp-up/down)
export let options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp-up to 50 users
    { duration: '1m', target: 150 },  // Ramp-up to 150 users
    { duration: '1m', target: 500 },  // Ramp-up to 500 users
    { duration: '5m', target: 500 },  // Sustain 500 users for 5 minutes (as specified in documentation)
    { duration: '30s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    // 95% of requests must complete below 500ms
    http_req_duration: ['p(95)<500'],
    // We expect some 429 errors from rate limiting and 401s, but generic 500 errors should be low
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // 1. Test public page load (unauthenticated)
  let homeRes = http.get(`${BASE_URL}/login`);
  check(homeRes, {
    'GET /login is 200': (r) => r.status === 200,
  });
  sleep(1);

  // 2. Test login POST (this should hit the Brute Force Rate limiter eventually)
  let loginPayload = {
    email: `testuser_${__VU}_${__ITER}@example.com`,
    password: 'wrongpassword123',
  };
  let loginRes = http.post(`${BASE_URL}/login`, loginPayload, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  
  // Checking that it gets either a 200 (error shown on page) or 429/400
  check(loginRes, {
    'POST /login is bounded (200, 400, or 429)': (r) => [200, 400, 429].includes(r.status),
    'Rate limit triggering (429)': (r) => r.status === 429,
  });
  sleep(1);

  // 3. Test protected API endpoints
  // Simulated authenticated request passing a dummy cookie
  let apiRes = http.get(`${BASE_URL}/api/documents/some-id/download`, {
    headers: {
      Cookie: 'comunet-session=fake.jwt.token'
    },
    redirects: 0 // Prevent following redirects to properly check response codes
  });
  
  // It should return 401 Unauthorized or 403 Forbidden since the token is fake, or 429 Too Many Requests
  check(apiRes, {
    'Protected API is 401, 403, or 429': (r) => [401, 403, 429].includes(r.status),
  });

  sleep(Math.random() * 3 + 1); // Random sleep between 1-4s to simulate think time
}
