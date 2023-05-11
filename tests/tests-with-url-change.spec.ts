import { test, expect, } from '@playwright/test';
import { currentURL, createdUnits, hostName, isLocalMachine } from '../global_variables';
import { createRole, setRolePermissions, deleteRoles} from '../grpc_api/roles';
import { createUser, setUserPassword, assingUserRole, deleteUsers} from '../grpc_api/users';
import { createArchive, createArchiveVolume, } from '../grpc_api/archives';
import { createCamera, deleteCameras} from '../grpc_api/cameras';
import { exchangeIndexCredentials } from '../node/fs.mjs';
import { setServerConfig } from '../grpc_api/server';
import { randomUUID } from 'node:crypto';
import { getHostName } from '../http_api/http_host';


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

test('Authorization with changed server URL (CLOUD-T156)', async ({ page }) => {
    let port = "874";
    let prefix = "/web/ui";
    await setServerConfig(port, prefix);
    await page.goto(`${currentURL}:${port}${prefix}`);
    // await page.pause();
    await page.getByLabel('Login').fill('root');
    await page.getByLabel('Password').fill('root');
    await page.getByLabel('Password').press('Enter');
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
    await setServerConfig("80", "/");
});