import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { scopeCss } from './scripts/scope-css.mjs';

export default defineConfig({
  plugins: [react()],
  base: './',
  // AI 대화 시험 서버(chat-test/server.mjs)로 넘긴다. 개발 화면에서만 쓰인다.
  server: { proxy: { '/api/chat': { target: 'http://127.0.0.1:5210', rewrite: () => '/chat' } } },
  build: { assetsInlineLimit: 10000000 },
  css: { postcss: { plugins: [scopeCss()] } },
  // 새 Node의 내장 localStorage가 jsdom 것을 가리지 않게 끈다.
  test: { environment: 'jsdom', include: ['src/**/*.test.ts'], pool: 'forks', poolOptions: { forks: { execArgv: ['--no-experimental-webstorage'] } } },
});
