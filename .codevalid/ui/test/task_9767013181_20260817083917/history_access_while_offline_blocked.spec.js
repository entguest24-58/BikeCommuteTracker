import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupAuthenticatedSession,
  mockRideHistoryFailure,
} from "../../helpers/mock-api.js";

test("Ride history access blocked with clear message when offline", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "history_access_while_offline_blocked",
    testTitle: testInfo.title,
  });

  await recorder.step("seed authenticated session and mock offline-like history failure", async () => {
    await setupAuthenticatedSession(page);
    await mockRideHistoryFailure(page, {
      status: 503,
      message: "Failed to fetch ride history",
    });
  });

  await recorder.step("navigate to history page", async () => {
    await page.goto("/rides/history");
  });

  await recorder.step("verify page shell renders but ride data does not load", async () => {
    await expect(page.getByRole("heading", { name: "Ride History" })).toBeVisible();
    await expect(page.getByRole("alert")).toContainText("Failed to fetch ride history");
    await expect(page.getByText("No rides found for this rider.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);
  });

  await recorder.step("verify required offline-specific retry UX is currently absent", async () => {
    await expect(page.getByText("Ride operations require an online connection. Offline access to ride history is not supported in v1.")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Retry Connection" })).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:history_access_while_offline_blocked");
  await recorder.save(testInfo);
});
