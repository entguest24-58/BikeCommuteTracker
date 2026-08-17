import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession, mockApiHealthFailure } from "../../helpers/mock-api.js";

test("HTTP 500 or non-200 health response triggers error state", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("api_health_500_response_treated_as_unready", "HTTP 500 or non-200 health response triggers error state");

  await recorder.step("Set unauthenticated session and return 500 from /health", async () => {
    await setupUnauthenticatedSession(page);
    await mockApiHealthFailure(page, { type: "http", status: 500, body: { message: "Internal Server Error" } });
  });

  await recorder.step("Launch application", async () => {
    await page.goto("/");
  });

  await recorder.step("Verify spinner persists until timeout then error appears", async () => {
    await expect(page.getByText("Connecting…")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Unable to connect to BikeTracking API" })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Log in" })).not.toBeVisible();
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:api_health_500_response_treated_as_unready");
  await recorder.save(testInfo);
});
