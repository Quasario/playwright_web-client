import { test, expect } from '@playwright/test';
import { currentURL } from '../global_variables';
import { createRole, setRolePermissions, } from '../methods/roles';
import { createUser, setUserPassword, assignUserRole, } from '../methods/users';
import { createArchive, createArchiveVolume, } from '../methods/archives';
import { createCamera, } from '../methods/cameras';
// import { createRole, setRolePermissions, createUser, setUserPassword, assignUserRole, createArchive, createArchiveVolume } from '../grpc_methods';


test('test', async ({ page }) => {
  let roleId = "60c60ed4-47e3-4d5e-9737-0f00b684f535";
  let userId = "393b06f3-d419-441d-8834-b5d1824c135a";
  // await createRole(roleId, 'extraRole');
  // await setRolePermissions(roleId);
  // await createUser(userId);
  // await setUserPassword(userId, '1');
  // await assignUserRole(roleId, userId);
  // await createArchive();
  // await createArchiveVolume();
  await createCamera(4, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "100");
  await page.goto(currentURL);
  // await page.pause();
  await page.getByLabel('Login').fill('user');
  await page.getByLabel('Password').fill('1');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('button', { name: 'Hardware' })).toBeVisible();
  await expect(page.locator('id=at-app-mode-live')).toBeVisible();
  
  // await page.click("id=at-app-mode-search");
  // await page.pause();
  // await page.click("id=at-app-mode-live");
  // await page.pause();
  // await page.locator("text=hardware").click();
  // await page.pause();
});


test.only('Filter by imported file', async ({ page }) => {
  await page.goto(currentURL);
  await page.pause();
  await page.getByLabel('Login').fill('root');
  await page.getByLabel('Password').fill('root');
  await page.getByLabel('Login').press('Enter');
  await expect(page.getByRole('button', { name: 'Hardware' })).toBeVisible();
  await page.locator('#import-search-camlist-btn').setInputFiles('./test_data/example.xlsx');
  await expect(page.getByRole('button', { name: '108.Camera' })).toBeHidden();
  await expect(page.getByRole('button', { name: '109.Camera' })).toBeVisible();
  await expect(page.getByRole('button', { name: '110.Camera' })).toBeHidden();
});