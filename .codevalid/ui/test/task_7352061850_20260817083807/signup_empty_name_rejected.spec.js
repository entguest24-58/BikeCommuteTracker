import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession } from "../../helpers/mock-api.js";

test("Signup with empty name is rejected with clear error", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "signup_empty_name_rejected",
    testTitle: "Signup with empty name is rejected with clear error",
  });

  await recorder.step("setup unauthenticated session", async () => {
    await setupUnauthenticatedSession(page);
  });

  await recorder.step("open signup page", async () => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
  });

  await recorder.step("leave name empty and fill pin", async () => {
    await page.locator("#signup-name").fill("");
    await page.locator("#signup-pin").fill("1234");
  });

  await recorder.step("submit invalid signup form", async () => {
    await page.getByRole("button", { name: "Create account" }).click();
  });

  await recorder.step("assert validation error and retained pin", async () => {
    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.getByText("Name is required.")).toBeVisible();
    await expect(page.locator("#signup-pin")).toHaveValue("1234");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:signup_empty_name_rejected");
  await recorder.save(testInfo);
});
