import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession } from "../../helpers/mock-api.js";

test("unauthenticated user is redirected to login page when accessing dashboard page", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "dashboard_unauthenticated_redirect",
    testTitle: testInfo.title,
  });

  await recorder.step("clear any authenticated session", async () => {
    await setupUnauthenticatedSession(page);
  });

  await recorder.step("navigate directly to dashboard", async () => {
    await page.goto("/dashboard");
  });

  await recorder.step("verify redirect to login and no dashboard content", async () => {
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Your riding story, one screen." })
    ).toHaveCount(0);
    await expect(page.getByText("Total Expenses")).toHaveCount(0);
    await expect(page.getByText("Oil Change Savings")).toHaveCount(0);
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:dashboard_unauthenticated_redirect");
  await recorder.save(testInfo);
});
