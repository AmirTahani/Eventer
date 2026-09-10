import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer()).get('/health').expect(200);
  });

  it('/config (GET) returns telegram bot username', async () => {
    const res = await request(app.getHttpServer()).get('/config').expect(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        telegramBotUsername: expect.any(String),
      }),
    );
  });

  it('/auth/telegram-login rejects missing bot token or bad payload', async () => {
    await request(app.getHttpServer())
      .post('/auth/telegram-login')
      .send({
        id: 1,
        first_name: 'A',
        auth_date: Math.floor(Date.now() / 1000),
        hash: 'ff'.repeat(32),
      })
      .expect(401);
  });

  it('/auth/telegram-login validates body shape', async () => {
    await request(app.getHttpServer())
      .post('/auth/telegram-login')
      .send({ first_name: 'A' })
      .expect(400);
  });

  it('/auth/telegram-login rejects invalid signed hashes even when token exists', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/telegram-login')
      .send({
        id: 999001,
        first_name: 'E2E',
        auth_date: Math.floor(Date.now() / 1000),
        hash: 'ab'.repeat(32),
      });
    expect([401, 500]).toContain(res.status);
  });
});
