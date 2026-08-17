import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupRepoAppReady, setupUnauthenticatedSession } from "../../helpers/mock-api.js";

test("Login form prevents submission if name or PIN fields are empty or whitespace-only", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("login_form_prevents_empty_inputs", "Login form prevents submission if name or PIN fields are empty or whitespace-only");

  await recorder.step("Mock startup and open login page");
  await setupRepoAppReady(page);
  await setupUnauthenticatedSession(page);
  await page.goto("/login");

  await recorder.step("Submit with empty name and valid PIN");
  await page.locator("#login-name").fill("");
  await page.locator("#login-pin").fill("1234");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("Name is required.")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);

  await recorder.step("Submit with whitespace-only name and valid PIN");
  await page.locator("#login-name").fill("   \t  ");
  await page.locator("#login-pin").fill("1234");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("Name is required.")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);

  await recorder.step("Submit with valid name and empty PIN");
  await page.locator("#login-name").fill("JohnDoe");
  await page.locator("#login-pin").fill("");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("PIN must be numeric and 4 to 8 digits long.")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);

  console.log("CODEVALID_TEST_ASSERTION_OK:login_form_prevents_empty_inputs");
  await recorder.save(testInfo);
});
