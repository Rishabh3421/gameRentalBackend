const request = require('supertest');
const app = require('../app'); // Update the path accordingly

describe('Registration Endpoint', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/register')
      .send({
        "username": "test_user",
        "email": "test@example.com",
        "password": "testpassword",
        "firstName": "Test",
        "lastName": "User",
        "contactNumber": "123-456-7890",
        "userType": "Gamer"
      });

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('_id');
  });
});
