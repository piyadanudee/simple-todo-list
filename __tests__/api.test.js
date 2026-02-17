const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../index');

const TEST_TODOS_FILE = path.join(__dirname, '../todos.test.json');

describe('Todo API Endpoints', () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_TODOS_FILE)) {
      fs.unlinkSync(TEST_TODOS_FILE);
    }

    const defaultTodosFile = path.join(__dirname, '../todos.json');
    if (fs.existsSync(defaultTodosFile)) {
      fs.writeFileSync(defaultTodosFile, JSON.stringify([]));
    }
  });

  afterAll(() => {
    if (fs.existsSync(TEST_TODOS_FILE)) {
      fs.unlinkSync(TEST_TODOS_FILE);
    }
  });

  // =========================
  // GET
  // =========================
  describe('GET /api/todos', () => {
    test('should return an empty array initially', async () => {
      const response = await request(app).get('/api/todos');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('should return all todos', async () => {
      await request(app)
        .post('/api/todos')
        .send({ text: 'Test todo' });

      const response = await request(app).get('/api/todos');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].text).toBe('Test todo');
    });
  });

  // =========================
  // POST
  // =========================
  describe('POST /api/todos', () => {
    test('should create a new todo', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ text: 'Buy groceries' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.text).toBe('Buy groceries');
      expect(response.body.completed).toBe(false);
      expect(response.body).toHaveProperty('createdAt');
    });

    test('should trim whitespace', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ text: '  Spaced  ' });

      expect(response.status).toBe(201);
      expect(response.body.text).toBe('Spaced');
    });

    test('should return 400 for invalid text', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ text: '' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Todo text is required');
    });
  });

  // =========================
  // TOGGLE
  // =========================
  describe('PUT /api/todos/:id', () => {
    test('should toggle completion', async () => {
      const createRes = await request(app)
        .post('/api/todos')
        .send({ text: 'Test todo' });

      const id = createRes.body.id;

      const response = await request(app)
        .put(`/api/todos/${id}`);

      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(true);
    });

    test('should return 404 if not found', async () => {
      const response = await request(app)
        .put('/api/todos/999999');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Todo not found');
    });
  });

  // =========================
  // DELETE
  // =========================
  describe('DELETE /api/todos/:id', () => {
    test('should delete a todo', async () => {
      const createRes = await request(app)
        .post('/api/todos')
        .send({ text: 'Delete me' });

      const id = createRes.body.id;

      const response = await request(app)
        .delete(`/api/todos/${id}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Todo deleted successfully');
    });
  });

  // =========================
  // EDIT FEATURE (NEW)
  // =========================
  describe('PUT /api/todos/:id/edit', () => {
    test('should edit a todo text', async () => {
      const createRes = await request(app)
        .post('/api/todos')
        .send({ text: 'Original text' });

      const id = createRes.body.id;

      const editRes = await request(app)
        .put(`/api/todos/${id}/edit`)
        .send({ text: 'Updated text' });

      expect(editRes.status).toBe(200);
      expect(editRes.body.text).toBe('Updated text');
    });

    test('should return 400 if text empty', async () => {
      const createRes = await request(app)
        .post('/api/todos')
        .send({ text: 'Original text' });

      const id = createRes.body.id;

      const editRes = await request(app)
        .put(`/api/todos/${id}/edit`)
        .send({ text: '' });

      expect(editRes.status).toBe(400);
    });

    test('should return 404 if todo not found', async () => {
      const response = await request(app)
        .put('/api/todos/999999/edit')
        .send({ text: 'Updated' });

      expect(response.status).toBe(404);
    });
  });

  // =========================
  // INTEGRATION
  // =========================
  describe('Integration tests', () => {
    test('should handle full CRUD flow', async () => {
      const createRes = await request(app)
        .post('/api/todos')
        .send({ text: 'Workflow test' });

      const id = createRes.body.id;

      const toggleRes = await request(app)
        .put(`/api/todos/${id}`);

      expect(toggleRes.body.completed).toBe(true);

      const editRes = await request(app)
        .put(`/api/todos/${id}/edit`)
        .send({ text: 'Edited text' });

      expect(editRes.body.text).toBe('Edited text');

      const deleteRes = await request(app)
        .delete(`/api/todos/${id}`);

      expect(deleteRes.status).toBe(200);
    });
  });

});
