import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupRepoAppReady, setupUnauthenticatedSession } from "../../helpers/mock-api.js";

test("Signup page provides clear navigation link back to login page", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("signup_page_has_link_to_login", "Signup page provides clear navigation link back to login page");

  await recorder.step("Mock startup and open unauthenticated signup page");
  await setupRepoAppReady(page);
  await setupUnauthenticatedSession(page);
  await page.goto("/signup");

  await recorder.step("Verify login link is visible");
  const loginLink = page.getByRole("link", { name: "Log in" });
  await expect(loginLink).toBeVisible();

  await recorder.step("Click the login link");
  await loginLink.click();

  await recorder.step("Verify navigation back to login page");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:signup_page_has_link_to_login");
  await recorder.save(testInfo);
});
