import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupUnauthenticatedSession, mockLocalIdentityLoginFailure } from "../../helpers/mock-api.js";

test("Incorrect name or PIN denies login with generic error", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder({
    testId: "login_incorrect_credentials_rejected",
    testTitle: "Incorrect name or PIN denies login with generic error",
  });

  await recorder.step("setup unauthenticated session and login failure mock", async () => {
    await setupUnauthenticatedSession(page);
    await mockLocalIdentityLoginFailure(page, { message: "Name or PIN is incorrect." });
  });

  await recorder.step("open login page", async () => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  });

  await recorder.step("fill incorrect credentials", async () => {
    await page.locator("#login-name").fill("alex");
    await page.locator("#login-pin").fill("9999");
  });

  await recorder.step("submit login form", async () => {
    await page.getByRole("button", { name: "Log in" }).click();
  });

  await recorder.step("assert generic login error and preserved values", async () => {
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("Name or PIN is incorrect.")).toBeVisible();
    await expect(page.locator("#login-name")).toHaveValue("alex");
    await expect(page.locator("#login-pin")).toHaveValue("9999");
  });

  console.log("CODEVALID_TEST_ASSERTION_OK:login_incorrect_credentials_rejected");
  await recorder.save(testInfo);
});
