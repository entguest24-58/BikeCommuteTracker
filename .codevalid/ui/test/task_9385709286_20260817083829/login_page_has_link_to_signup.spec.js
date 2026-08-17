import { test, expect } from "@playwright/test";
import { ExecutionRecorder } from "../../helpers/execution-recorder.js";
import { setupRepoAppReady, setupUnauthenticatedSession } from "../../helpers/mock-api.js";

test("Login page provides clear navigation link to Create User signup page", async ({ page }, testInfo) => {
  const recorder = new ExecutionRecorder("login_page_has_link_to_signup", "Login page provides clear navigation link to Create User signup page");

  await recorder.step("Mock startup and open unauthenticated login page");
  await setupRepoAppReady(page);
  await setupUnauthenticatedSession(page);
  await page.goto("/login");

  await recorder.step("Verify signup link is visible");
  const signupLink = page.getByRole("link", { name: "Create an account" });
  await expect(signupLink).toBeVisible();

  await recorder.step("Click the signup link");
  await signupLink.click();

  await recorder.step("Verify navigation to signup page");
  await expect(page).toHaveURL(/\/signup$/);
  await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();

  console.log("CODEVALID_TEST_ASSERTION_OK:login_page_has_link_to_signup");
  await recorder.save(testInfo);
});
