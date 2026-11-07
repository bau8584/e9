import { defineConfig } from 'vitest/config';

// 규칙 시험만 돌리는 설정. 화면 시험(jsdom)과 섞이지 않게 나눠 둔다.
export default defineConfig({ test: { environment: 'node', include: ['tests/firestore.rules.test.ts'], testTimeout: 20000, hookTimeout: 60000 } });
