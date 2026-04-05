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

export function setup() {
  // 1. Authenticate once to get a valid session for the VUs
  let loginPayload = {
    email: 'admin@fincasmartinez.es',
    password: 'Demo1234!',
  };
  
  let loginRes = http.post(`${BASE_URL}/login`, loginPayload, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    redirects: 0 // Prevent following redirect to capture the cookie easily
  });
  
  let sessionCookie = '';
  
  // Either from 303 Redirect or 200 OK
  if (loginRes.cookies && loginRes.cookies['comunet-session']) {
    sessionCookie = loginRes.cookies['comunet-session'][0].value;
  }
  
  console.log(`Setup complete. Session cookie obtained: ${!!sessionCookie}`);
  return { sessionCookie };
}

export default function (data) {
  if (!data.sessionCookie) {
    console.error("No session cookie available!");
    return;
  }

  // Define headers with the real session cookie
  const authHeaders = {
    headers: {
      Cookie: `comunet-session=${data.sessionCookie}`
    }
  };

  // 1. Test Dashboard load (heavy queries: finances, incidents, recent activity)
  let dashboardRes = http.get(`${BASE_URL}/dashboard`, authHeaders);
  
  check(dashboardRes, {
    'GET /dashboard is 200': (r) => r.status === 200,
    'Dashboard loaded successfully': (r) => r.body && r.body.includes('Panel de Control')
  });

  sleep(Math.random() * 2 + 1);

  // 2. Test Communities list
  let communitiesRes = http.get(`${BASE_URL}/communities`, authHeaders);
  
  check(communitiesRes, {
    'GET /communities is 200': (r) => r.status === 200,
  });

  sleep(Math.random() * 3 + 1); // Random sleep between 1-4s to simulate think time
}
