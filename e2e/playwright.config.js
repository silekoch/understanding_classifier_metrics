import process from "node:process";

const PORT = 4173;

export default {
  testDir: ".",
  testMatch: ["**/*.pw.js"],
  timeout: 30_000,
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    headless: true,
  },
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
};
