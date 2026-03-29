import http from 'k6/http';
import { check, sleep } from 'k6';

// 500 concurrent users for a 5-minute sustained load test
export let options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp-up to 50 users
    { duration: '1m', target: 150 },  // Ramp-up to 150 users
    { duration: '1m', target: 500 },  // Ramp-up to 500 users
    { duration: '2m', target: 500 },  // Sustain 500 users
    { duration: '30s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    // 95% of requests must complete below 500ms
    http_req_duration: ['p(95)<500'],
    // Less than 1% of requests can fail
    http_req_failed: ['rate<0.01'], 
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Test loading the public login page
  let res = http.get(`${BASE_URL}/login`);
  
  check(res, {
    'is status 200': (r) => r.status === 200,
    'body contains login': (r) => r.body.includes('form') || r.body.includes('Login') || r.body.includes('email'),
  });

  // Small sleep to simulate user reading the page
  sleep(1);

  // Test an API endpoint (that should hit rate limit or 401 unauthenticated eventually)
  // For a real test, provide an auth token in __ENV
  let apiRes = http.get(`${BASE_URL}/api/documents/some-id/download`);
  
  check(apiRes, {
    'is status 401 or 429 or 200': (r) => [200, 401, 429].includes(r.status),
  });

  sleep(Math.random() * 3 + 1); // Random sleep between 1-4s to simulate think time
}
