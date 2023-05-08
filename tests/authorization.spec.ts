import { test, expect } from '@playwright/test';
import { currentURL } from '../global_variables';
import { createRole, setRolePermissions, } from '../methods/roles';
import { createUser, setUserPassword, assingUserRole, } from '../methods/users';
import { createArchive, createArchiveVolume, } from '../methods/archives';
import { createCamera, } from '../methods/cameras';
import { beforeEach } from 'node:test';
import { randomUUID } from 'node:crypto';
// let roles = {
//     root: {
//       roleId: undefined,
//       userId: undefined,
//     },
//     role: {
//       roleId: randomUUID(),
//       users: {
//         user: {
//           userId: randomUUID()
//         }
//       }
//     }
//   }
let roleId = randomUUID();
let userId = randomUUID();

test.beforeAll(async () => {
  await createCamera(2, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "100");

  await createRole(roleId, 'Role');
  await setRolePermissions(roleId);
  await createUser(userId, "User");
  await assingUserRole(roleId, userId);
  console.log(userId, roleId);
});

test.afterAll(async () => {
  //delete all objects
});

test('Authorization attempt with an empty fields (CLOUD-T153)', async ({ page }) => {
  await page.goto(currentURL);
  // await page.pause();
  await page.getByLabel('Login').fill('');
  await page.getByLabel('Password').fill('');
  await expect(page.getByRole('button', { name: 'Log in' })).toBeDisabled();
});


test('Authorization attempt with an empty password (CLOUD-T154)', async ({ page }) => {
  await page.goto(currentURL);
  // await page.pause();
  await page.getByLabel('Login').fill('root');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.locator('id=password-helper-text')).toHaveText("Incorrect login or password");
  await expect(page.getByLabel('Login')).toBeEmpty();
});

test('Authorization with an empty password (CLOUD-T633)', async ({ page }) => {
  await setUserPassword(userId, '')
  console.log(userId);
  await page.goto(currentURL);
  // await page.pause();
  await page.getByLabel('Login').fill('user');
  await page.getByLabel('Login').press('Enter');
  await expect(page.getByRole('button', { name: 'Hardware' })).toBeVisible();
  await expect(page.locator('id=at-app-mode-live')).toBeVisible();
});

test('Authorization with default server URL (CLOUD-T417)', async ({ page }) => {
  await setUserPassword(userId, 'admin123');
  console.log(userId);
  await page.goto(currentURL);
  // await page.pause();
  await page.getByLabel('Login').fill('root');
  await page.getByLabel('Password').fill('root');
  await page.getByLabel('Login').press('Enter');
  await expect(page.getByRole('button', { name: 'Hardware' })).toBeVisible();
  await expect(page.locator('id=at-app-mode-live')).toBeVisible();
  await page.locator('#at-top-menu-btn').click();
  await expect(page.getByText('root', { exact: true })).toBeVisible(); 
  await page.getByRole('menuitem', { name: 'Change user' }).click();
  await page.getByLabel('Login').fill('user');
  await page.getByLabel('Password').fill('admin123');
  await page.getByLabel('Password').press('Enter');
  await page.locator('#at-top-menu-btn').click();
  await expect(page.getByText('User', { exact: true })).toBeVisible(); 
});




