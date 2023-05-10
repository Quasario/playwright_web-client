import { test, expect } from '@playwright/test';
import { currentURL, createdUnits } from '../global_variables';
import { createRole, setRolePermissions, deleteRoles} from '../grpc_api/roles';
import { createUser, setUserPassword, assingUserRole, deleteUsers} from '../grpc_api/users';
import { createArchive, createArchiveVolume, } from '../grpc_api/archives';
import { createCamera, deleteCameras, getVideChannelsList, addVirtualVideo, changeSingleCameraActiveStatus, changeIPServerCameraActiveStatus} from '../grpc_api/cameras';
import { randomUUID } from 'node:crypto';
let videoChannelList;
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
    await createCamera(4, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "80");
    await createCamera(1, "AxxonSoft", "Virtual IP server", "admin123", "admin", "0.0.0.0", "80");
    console.log(createdUnits.cameras);
    videoChannelList = await getVideChannelsList(createdUnits.cameras);
    await addVirtualVideo(videoChannelList, "lprusa", "tracker");
    await changeSingleCameraActiveStatus(videoChannelList[2].cameraBinding, false);
    await changeIPServerCameraActiveStatus(videoChannelList[5].uid, false);
    await changeIPServerCameraActiveStatus(videoChannelList[6].uid, false);

    // await createRole(roleId, 'Role');
    // await setRolePermissions(roleId);
    // await createUser(userId, "User");
    // await assingUserRole(roleId, userId);
  });
  
test.afterAll(async () => {
    console.log(createdUnits);
    // await deleteRoles(createdUnits.roles);
    // await deleteUsers(createdUnits.users);
    // await deleteCameras(createdUnits.cameras);
});

test.beforeEach(async ({ page }) => {
    await page.goto(currentURL);
    await page.getByLabel('Login').fill('root');
    await page.getByLabel('Password').fill('root');
    await page.getByLabel('Password').press('Enter');
});

test('Authorization attempt with an empty fields (CLOUD-T153)', async ({ page }) => {
    // await page.pause();
    await expect(page.getByRole('button', { name: 'Hardware' })).toBeVisible();
    await expect(page.locator('id=at-app-mode-live')).toBeVisible();
});