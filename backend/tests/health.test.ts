describe('SupportGPT API smoke tests', () => {
  let prismaClient: { $disconnect: () => Promise<void> };

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3001';
    process.env.DATABASE_URL = 'postgresql://supportgpt:supportgpt@localhost:5432/supportgpt_test';
    process.env.JWT_SECRET = 'test_jwt_secret_supportgpt';
    process.env.REFRESH_TOKEN_SECRET = 'test_refresh_secret_supportgpt';
    process.env.CORS_ORIGIN = 'http://localhost:3000';
  });

  afterAll(async () => {
    if (prismaClient) {
      await prismaClient.$disconnect();
    }
  });

  it('serves the API metadata route', async () => {
    const { createApp } = await import('../src/app');
    const { prisma } = await import('../src/config/prisma');
    prismaClient = prisma;
    const request = (await import('supertest')).default;
    const app = createApp();

    const response = await request(app).get('/api');

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe('SupportGPT API');
  });
});
