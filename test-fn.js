import { handler } from './netlify/functions/api.js';

const event = {
  httpMethod: 'POST',
  path: '/api/auth/login',
  body: JSON.stringify({ email: 'admin@example.com', password: 'password123' }),
  isBase64Encoded: false,
  headers: {
    'Content-Type': 'application/json'
  }
};

const context = {};

async function test() {
  try {
    const res = await handler(event, context);
    console.log("Response:", res);
  } catch (err) {
    console.error("Error:", err);
  }
}

test();
