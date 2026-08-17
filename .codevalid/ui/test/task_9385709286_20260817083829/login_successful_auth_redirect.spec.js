import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import {
  setupRepoAppReady,
  setupUnauthenticatedSession,
  mockIdentifySuccess,
  mockDashboardSuccess,
  mockUserSettingsUnauthenticated,
} from "../../helpers/mock-api.js";

test("User successfully logs in with correct name and PIN and is redirected to dashboard", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("login_successful_auth_redirect", "User successfully logs in with correct name and PIN and is redirected to dashboard");

  await recorder.step("Mock API startup, login success, dashboard, and unauthenticated settings guard");
  await setupRepoAppReady(page);
  await setupUnauthenticatedSession(page);
  await mockIdentifySuccess(page, {
    expectedName: "JohnDoe",
    expectedPin: "1234",
    session: { userId: 101, userName: "JohnDoe", authorized: true },
  });
  await mockDashboardSuccess(page);
  await mockUserSettingsUnauthenticated(page);

  await recorder.step("Open the login page");
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();

  await recorder.step("Enter the registered rider name");
  await page.locator("#login-name").fill("JohnDoe");

  await recorder.step("Enter the correct PIN");
  await page.locator("#login-pin").fill("1234");

  await recorder.step("Submit the login form");
  await page.getByRole("button", { name: "Log in" }).click();

  await recorder.step("Verify redirect to dashboard and authenticated content");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Your riding story, one screen." })).toBeVisible();
  await expect(page.getByText("Name or PIN is incorrect.")).toHaveCount(0);
  await expect.poll(async () => {
    return page.evaluate(() => {
      const raw = window.sessionStorage.getItem("bike_tracking_auth_session");
      return raw ? JSON.parse(raw) : null;
    });
  }).toMatchObject({ userId: 101, userName: "JohnDoe" });

  console.log("CODEVALID_TEST_ASSERTION_OK:login_successful_auth_redirect");
  await recorder.save(testInfo);
});
