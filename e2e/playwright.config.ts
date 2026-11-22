import { defineConfig } from '@playwright/test';

/**
 * Tests de bout en bout (navigateur) : parcours complets sur la version construite (`npm run build`).
 * Le réseau est simulé (images Wikimedia, musées, fonds de carte, IA) : aucun appel réel, aucun crédit dépensé.
 */
export default defineConfig({
  testDir: '.',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    viewport: { width: 390, height: 844 },
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    permissions: ['microphone'],
    trace: 'off',
    launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] },
  },
  webServer: {
    command: 'npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
