import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession, mockLocalIdentitySignupDuplicateName } from "../../helpers/mock-api.js";

test("Signup with duplicate normalized name is rejected with clear message", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "signup_duplicate_normalized_name_rejected",
    testTitle: "Signup with duplicate normalized name is rejected with clear message",
  });

  await recorder.step("setup unauthenticated session and duplicate-name mock", async () => {
    await setupUnauthenticatedSession(page);
    await mockLocalIdentitySignupDuplicateName(page);
  });

  await recorder.step("open signup page", async () => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();
  });

  await recorder.step("fill duplicate normalized name and pin", async () => {
    await page.locator("#signup-name").fill("ALEX");
    await page.locator("#signup-pin").fill("5678");
  });

  await recorder.step("submit signup form", async () => {
    await page.getByRole("button", { name: "Create account" }).click();
  });

  await recorder.step("assert duplicate-name error and retained values", async () => {
    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.getByText("name already exists")).toBeVisible();
    await expect(page.locator("#signup-name")).toHaveValue("ALEX");
    await expect(page.locator("#signup-pin")).toHaveValue("5678");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:signup_duplicate_normalized_name_rejected");
  await recorder.save(testInfo);
});
