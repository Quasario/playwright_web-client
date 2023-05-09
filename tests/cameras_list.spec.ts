import { test, expect } from '@playwright/test';
import { currentURL } from '../global_variables';
import { createRole, setRolePermissions, } from '../grpc_api/roles';
import { createUser, setUserPassword, assingUserRole, } from '../grpc_api/users';
import { createArchive, createArchiveVolume, } from '../grpc_api/archives';
import { createCamera, } from '../grpc_api/cameras';
import { beforeEach } from 'node:test';
import { randomUUID } from 'node:crypto';
let roleId = randomUUID();
let userId = randomUUID();
let userWithoutWEB = {
  "feature_access": [
      "FEATURE_ACCESS_DEVICES_SETUP",
      "FEATURE_ACCESS_ARCHIVES_SETUP",
      "FEATURE_ACCESS_DETECTORS_SETUP",
      "FEATURE_ACCESS_SETTINGS_SETUP",
      "FEATURE_ACCESS_PROGRAMMING_SETUP",
      "FEATURE_ACCESS_REALTIME_RECOGNITION_SETUP",
      "FEATURE_ACCESS_CHANGING_LAYOUTS",
      "FEATURE_ACCESS_EXPORT",
      "FEATURE_ACCESS_LAYOUTS_TAB",
      "FEATURE_ACCESS_MINMAX_BUTTON_ALLOWED",
      "FEATURE_ACCESS_SYSTEM_JOURNAL",
      "FEATURE_ACCESS_DOMAIN_MANAGING_OPS",
      "FEATURE_ACCESS_ADD_CAMERA_TO_LAYOUT_IN_MONITORING",
      "FEATURE_ACCESS_SEARCH",
      "FEATURE_ACCESS_EDIT_PTZ_PRESETS",
      "FEATURE_ACCESS_ALLOW_BUTTON_MENU_CAMERA",
      "FEATURE_ACCESS_ALLOW_SHOW_TITLES",
      "FEATURE_ACCESS_SHOW_ERROR_MESSAGES",
      "FEATURE_ACCESS_ALLOW_DELETE_RECORDS",
      "FEATURE_ACCESS_ALLOW_SHOW_PRIVACY_VIDEO_IN_ARCHIVE",
      "FEATURE_ACCESS_ALLOW_SHOW_FACES_IN_LIVE",
      "FEATURE_ACCESS_ALLOW_UNPROTECTED_EXPORT",
      "FEATURE_ACCESS_IS_GUARD_ROLE",
      "FEATURE_ACCESS_GROUP_PANEL",
      "FEATURE_ACCESS_OBJECT_PANEL_AND_CAMERA_SEARCH_PANEL",
      "FEATURE_ACCESS_CONFIDENTIAL_BOOKMARKS"
  ]
}

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
  await page.pause();
  await page.getByLabel('Login').fill('');
  await page.getByLabel('Password').fill('');
  await expect(page.getByRole('button', { name: 'Log in' })).toBeDisabled();
});