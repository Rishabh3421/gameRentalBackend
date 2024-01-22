const request = require('supertest');
const app = require('../app');

describe('Login Endpoint', () => {
  it('should login an existing user', async () => {
    const response = await request(app)
      .post('/login')
      .send({
        "username": "test_user",
        "password": "testpassword"
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('userId');
  });

  it('should handle invalid login credentials', async () => {
    const response = await request(app)
      .post('/login')
      .send({
        "username": "john_doe",
        "password": "securepassword"
      });

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty('message', 'Invalid Login Credentials');
  });
});

