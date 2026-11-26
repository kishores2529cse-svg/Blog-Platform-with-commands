import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('Interactive Commenting System & Nested Replies APIs', () => {
  let readerToken = '';
  let authorToken = '';
  let testPostId = '';
  let rootCommentId = '';
  let replyCommentId = '';

  beforeAll(async () => {
    const readerRes = await request(app).post('/api/auth/login').send({
      login: 'alex@example.com',
      password: 'Password123!',
    });
    readerToken = readerRes.body.data.token;

    const authorRes = await request(app).post('/api/auth/login').send({
      login: 'marcus@chronicle.dev',
      password: 'Password123!',
    });
    authorToken = authorRes.body.data.token;

    // Get a post id
    const postsRes = await request(app).get('/api/posts?limit=1');
    testPostId = postsRes.body.data.posts[0].id;
  });

  it('should create a top-level comment on a post', async () => {
    const res = await request(app)
      .post(`/api/posts/${testPostId}/comments`)
      .set('Authorization', `Bearer ${readerToken}`)
      .send({
        content: 'This is a test root comment verifying API integrity.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.comment.id).toBeDefined();
    expect(res.body.data.comment.content).toBe('This is a test root comment verifying API integrity.');
    expect(res.body.data.comment.parentId).toBeNull();

    rootCommentId = res.body.data.comment.id;
  });

  it('should create a nested reply to the root comment', async () => {
    const res = await request(app)
      .post(`/api/posts/${testPostId}/comments`)
      .set('Authorization', `Bearer ${authorToken}`)
      .send({
        content: 'This is a nested reply replying to the root comment.',
        parentId: rootCommentId,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.comment.parentId).toBe(rootCommentId);

    replyCommentId = res.body.data.comment.id;
  });

  it('should fetch comments tree with nested replies structured hierarchically', async () => {
    const res = await request(app).get(`/api/posts/${testPostId}/comments`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.comments)).toBe(true);

    const rootComment = res.body.data.comments.find((c: any) => c.id === rootCommentId);
    expect(rootComment).toBeDefined();
    expect(Array.isArray(rootComment.replies)).toBe(true);
    expect(rootComment.replies.some((r: any) => r.id === replyCommentId)).toBe(true);
  });

  it('should allow author of comment to edit it', async () => {
    const res = await request(app)
      .put(`/api/comments/${rootCommentId}`)
      .set('Authorization', `Bearer ${readerToken}`)
      .send({
        content: 'Updated content of the test root comment.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.comment.content).toBe('Updated content of the test root comment.');
  });

  it('should allow author of comment to delete it', async () => {
    const res = await request(app)
      .delete(`/api/comments/${replyCommentId}`)
      .set('Authorization', `Bearer ${authorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
