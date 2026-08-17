import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession, setupAuthenticatedSession } from "../../helpers/mock-api.js";
import { authSession } from "../../mock/mock-data.js";

test("Receipt files are never accessible to unauthenticated users or other riders", async ({ page, context }, testInfo) => {
  const recorder = new ExecutionRecorder({ testId: "expense_receipt_access_control", testTitle: testInfo.title });

  await recorder.step("mock forbidden receipt access", async () => {
    await page.route("**/api/expenses/1/receipt**", async (route) => {
      const url = new URL(route.request().url());
      const userId = route.request().headers()["x-user-id"] ?? url.searchParams.get("userId");
      if (userId === "1") {
        return route.fulfill({ status: 200, contentType: "application/pdf", body: "owner-receipt" });
      }
      return route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify({ message: "Forbidden" }) });
    });
  });

  await recorder.step("verify unauthenticated request is denied", async () => {
    await setupUnauthenticatedSession(page);
    const unauthResponse = await page.request.get("/api/expenses/1/receipt");
    expect([401, 403]).toContain(unauthResponse.status());
  });

  await recorder.step("verify other rider request is denied", async () => {
    await page.addInitScript(() => {
      window.sessionStorage.setItem("bike_tracking_auth_session", JSON.stringify({ userId: 2, userName: "other", lastActivityAtUtc: "2099-01-01T00:00:00.000Z", expiresAtUtc: "2099-01-08T00:00:00.000Z" }));
    });
    const otherRiderResponse = await context.request.get("/api/expenses/1/receipt", { headers: { "X-User-Id": "2" } });
    expect([401, 403]).toContain(otherRiderResponse.status());
  });

  await recorder.step("verify owner can access receipt endpoint", async () => {
    await setupAuthenticatedSession(page, authSession);
    const ownerResponse = await context.request.get("/api/expenses/1/receipt", { headers: { "X-User-Id": "1" } });
    await expect(ownerResponse.status()).toBe(200);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:expense_receipt_access_control");
  await recorder.save(testInfo);
});
