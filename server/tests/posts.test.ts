import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('Posts & Role-Based Access Control APIs', () => {
  let authorToken = '';
  let readerToken = '';
  let createdPostId = '';
  let createdPostSlug = '';

  beforeAll(async () => {
    // Log in with seeded Author
    const authorRes = await request(app).post('/api/auth/login').send({
      login: 'marcus@chronicle.dev',
      password: 'Password123!',
    });
    authorToken = authorRes.body.data.token;

    // Log in with seeded Reader
    const readerRes = await request(app).post('/api/auth/login').send({
      login: 'alex@example.com',
      password: 'Password123!',
    });
    readerToken = readerRes.body.data.token;
  });

  it('should fetch published posts with pagination', async () => {
    const res = await request(app).get('/api/posts?limit=5');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.posts)).toBe(true);
    expect(res.body.data.pagination).toBeDefined();
    expect(res.body.data.posts.length).toBeGreaterThan(0);
  });

  it('should forbid READER from creating a new post (RBAC check)', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${readerToken}`)
      .send({
        title: 'Reader Post Test',
        content: '<p>This should fail because Readers lack AUTHOR role.</p>',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('should allow AUTHOR to create a new post', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        title: 'High-Performance Systems in TypeScript',
        content: '<p>Exploring modern asynchronous patterns and memory footprints in Node.js runtimes.</p>',
        excerpt: 'Exploring modern asynchronous patterns.',
        status: 'PUBLISHED',
        tags: ['TypeScript', 'Performance'],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.post.id).toBeDefined();
    expect(res.body.data.post.slug).toBeDefined();
    expect(res.body.data.post.readingTime).toBeGreaterThanOrEqual(1);

    createdPostId = res.body.data.post.id;
    createdPostSlug = res.body.data.post.slug;
  });

  it('should fetch post by slug and increment views', async () => {
    const res1 = await request(app).get(`/api/posts/${createdPostSlug}`);
    expect(res1.status).toBe(200);
    expect(res1.body.data.post.id).toBe(createdPostId);

    const res2 = await request(app).get(`/api/posts/${createdPostSlug}`);
    expect(res2.body.data.post.views).toBeGreaterThan(res1.body.data.post.views);
  });

  it('should allow authenticated user to like and unlike post', async () => {
    // Like
    const likeRes = await request(app)
      .post(`/api/posts/${createdPostId}/like`)
      .set('Authorization', `Bearer ${readerToken}`);

    expect(likeRes.status).toBe(200);
    expect(likeRes.body.data.liked).toBe(true);
    expect(likeRes.body.data.likesCount).toBeGreaterThan(0);

    // Unlike
    const unlikeRes = await request(app)
      .post(`/api/posts/${createdPostId}/like`)
      .set('Authorization', `Bearer ${readerToken}`);

    expect(unlikeRes.status).toBe(200);
    expect(unlikeRes.body.data.liked).toBe(false);
  });

  it('should allow authenticated user to bookmark post', async () => {
    const bookmarkRes = await request(app)
      .post(`/api/posts/${createdPostId}/bookmark`)
      .set('Authorization', `Bearer ${readerToken}`);

    expect(bookmarkRes.status).toBe(200);
    expect(bookmarkRes.body.data.bookmarked).toBe(true);
  });
});
