import { test, expect } from '@playwright/test';
import {currentURL} from '../global_variables';
import {getCameraList} from '../grpc_methods';

// test("Authorization in WebUI", async ({page}) => {

//     await page.goto("http://127.0.0.1");
//     await expect(page).toHaveTitle("Axxon Next client");
// })

// test('has title', async ({ page }) => {
//     await page.goto('https://playwright.dev/');
  
//     // Expect a title "to contain" a substring.
//     await expect(page).toHaveTitle(/Playwright/);
//   });



test('test', async ({ page }) => {
  await page.goto(currentURL);
  await page.getByLabel('Login').click();
  await page.getByLabel('Login').fill('root');
  await page.getByLabel('Login').press('Tab');
  await page.getByLabel('Password').fill('root');
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.click("id=at-app-mode-search");
  await page.pause();
  getCameraList();
  await page.click("id=at-app-mode-live");
  await page.pause();
  await page.locator("text=hardware").click();
  await page.pause();
});