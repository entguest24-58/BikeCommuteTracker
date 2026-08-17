import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession } from "../../helpers/mock-api.js";

test("Login with empty name or PIN is rejected with clear error", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "login_empty_fields_rejected",
    testTitle: "Login with empty name or PIN is rejected with clear error",
  });

  await recorder.step("setup unauthenticated session", async () => {
    await setupUnauthenticatedSession(page);
  });

  await recorder.step("open login page", async () => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  });

  await recorder.step("leave name empty and fill pin", async () => {
    await page.locator("#login-name").fill("");
    await page.locator("#login-pin").fill("1234");
  });

  await recorder.step("submit invalid login form", async () => {
    await page.getByRole("button", { name: "Log in" }).click();
  });

  await recorder.step("assert validation error and retained pin", async () => {
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("Name is required.")).toBeVisible();
    await expect(page.locator("#login-pin")).toHaveValue("1234");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:login_empty_fields_rejected");
  await recorder.save(testInfo);
});
