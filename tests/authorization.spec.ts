import { test, expect, } from '@playwright/test';
import { currentURL, Configuration, hostName, isLocalMachine } from '../global_variables';
import { createRole, setRolePermissions, deleteRoles} from '../grpc_api/roles';
import { createUser, setUserPassword, assingUserRole, deleteUsers} from '../grpc_api/users';
import { createArchive, createArchiveVolume, } from '../grpc_api/archives';
import { createCamera, deleteCameras} from '../grpc_api/cameras';
import { exchangeIndexCredentials } from '../utils/fs.mjs';
import { getHostName } from '../http_api/http_host';
import { yellow, } from 'colors';
import { configurationCollector, cameraAnnihilator, roleAnnihilator, userAnnihilator } from "../utils/utils.js";
let role = "Role";
let user = "User";

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
    await getHostName();
    await roleAnnihilator();
    await userAnnihilator();
    await createCamera(2, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "100");
    await createRole(role);
    await setRolePermissions(role);
    await createUser(user);
    await assingUserRole(role, user);
    await configurationCollector();
    console.log(Configuration.users);
    console.log(Configuration.roles);
});

test.afterAll(async () => {
    console.log(Configuration.users);
    console.log(Configuration.roles);
    await roleAnnihilator();
    await userAnnihilator();
    await cameraAnnihilator();
    exchangeIndexCredentials("", "");
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
    await setUserPassword(user, '')
    await page.goto(currentURL);
    // await page.pause();
    await page.getByLabel('Login').fill('user');
    await page.getByLabel('Login').press('Enter');
    await expect(page.getByRole('button', { name: 'Hardware' })).toBeVisible();
    await expect(page.locator('id=at-app-mode-live')).toBeVisible();
});

test('Authorization with default server URL (CLOUD-T417)', async ({ page }) => {
    await setUserPassword(user, 'admin123');
    await page.goto(currentURL);
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
});

test('Authorization via index.html file (CLOUD-T633)', async ({ page }) => {
    if (!isLocalMachine) {
        console.log(yellow("Can't resolve test CLOUD-T633, it can be execute only if server stands on local machine"));
        test.skip();
    }
    
    exchangeIndexCredentials("User", "admin123");
    await page.goto(currentURL);
    // await page.pause();
    await page.locator('#at-top-menu-btn').click();
    await expect(page.getByText('User', { exact: true })).toBeVisible();
    await page.getByRole('menuitem', { name: 'Change user' }).click();
    await page.locator('#at-top-menu-btn').click();
    await expect(page.getByText('User', { exact: true })).toBeVisible();
    exchangeIndexCredentials("", "");
    await page.getByRole('menuitem', { name: 'Change user' }).click();
    await page.getByLabel('Login').fill('root');
    await page.getByLabel('Password').fill('root');
    await page.getByLabel('Password').press('Enter');
    await page.locator('#at-top-menu-btn').click();
    await expect(page.getByText('root', { exact: true })).toBeVisible(); 
});

test('Authorization attempt without access to WEBUI (CLOUD-T157)', async ({ page }) => {
    await setRolePermissions(role, userWithoutWEB);
    await page.goto(currentURL);
    // await page.pause();
    await page.getByLabel('Login').fill('user');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page.locator('id=password-helper-text')).toHaveText("Access forbidden");
    await expect(page.getByLabel('Login')).toBeEmpty();
    await expect(page.getByLabel('Password')).toBeEmpty();
});








