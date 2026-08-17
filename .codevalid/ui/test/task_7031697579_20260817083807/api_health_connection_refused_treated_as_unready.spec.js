import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession, mockApiHealthFailure } from "../../helpers/mock-api.js";

test("Network connection refused triggers error state", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("api_health_connection_refused_treated_as_unready", "Network connection refused triggers error state");

  await recorder.step("Set unauthenticated session and simulate connection refused for /health", async () => {
    await setupUnauthenticatedSession(page);
    await mockApiHealthFailure(page, { type: "connection-refused" });
  });

  await recorder.step("Launch application", async () => {
    await page.goto("/");
  });

  await recorder.step("Verify user sees friendly error instead of stack trace", async () => {
    await expect(page.getByRole("heading", { name: "Unable to connect to BikeTracking API" })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
    await expect(page.getByText("Connecting…")).not.toBeVisible();
    await expect(page.getByText(/ECONNREFUSED/i)).not.toBeVisible();
    await expect(page.getByText(/TypeError/i)).not.toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:api_health_connection_refused_treated_as_unready");
  await recorder.save(testInfo);
});
