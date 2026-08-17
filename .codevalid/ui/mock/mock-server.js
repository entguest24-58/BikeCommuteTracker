import { authSession, emptyEvents } from "./mock-data.js";

function json(route, status, body) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

export async function setupMockRoutes(page, options = {}) {
  const events = options.events ?? emptyEvents;
  const session = options.session ?? authSession;

  await page.route("**/api/auth/signin", async (route) =>
    json(route, 200, session)
  );
  await page.route("**/api/auth/signup", async (route) =>
    json(route, 201, session)
  );
  await page.route("**/api/events", async (route) =>
    json(route, 200, events)
  );
}

export { json };
