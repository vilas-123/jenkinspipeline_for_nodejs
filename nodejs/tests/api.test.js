const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app, User } = require('../src/server');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({binary: { version: '7.0.5' }});
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('Health Check', () => {
  test('GET /health should return 200 OK', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('OK');
  });
});

describe('User API', () => {
  test('GET /api/users - should return empty array initially', async () => {
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });

  test('POST /api/users - should create a new user', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'John Doe', email: 'john@example.com' });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('John Doe');
    expect(res.body.data.email).toBe('john@example.com');
  });

  test('POST /api/users - should fail with missing fields', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ name: 'No Email' });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/users - should fail with duplicate email', async () => {
    await request(app).post('/api/users').send({ name: 'User A', email: 'dup@test.com' });
    const res = await request(app).post('/api/users').send({ name: 'User B', email: 'dup@test.com' });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/users - should return all created users', async () => {
    await request(app).post('/api/users').send({ name: 'Alice', email: 'alice@test.com' });
    await request(app).post('/api/users').send({ name: 'Bob', email: 'bob@test.com' });
    const res = await request(app).get('/api/users');
    expect(res.body.count).toBe(2);
  });

  test('DELETE /api/users/:id - should delete a user', async () => {
    const create = await request(app).post('/api/users').send({ name: 'ToDelete', email: 'del@test.com' });
    const id = create.body.data._id;
    const res = await request(app).delete(`/api/users/${id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('DELETE /api/users/:id - should 404 for non-existent user', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).delete(`/api/users/${fakeId}`);
    expect(res.statusCode).toBe(404);
  });
});
