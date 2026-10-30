import { setupServer } from "msw/node";

// Unhandled requests fail the test, so a test can never reach the real rate source.
export const server = setupServer();
