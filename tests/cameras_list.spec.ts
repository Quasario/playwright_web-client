import { test, expect, } from '@playwright/test';
import { currentURL, createdUnits, hostName } from '../global_variables';
import { createRole, setRolePermissions, deleteRoles} from '../grpc_api/roles';
import { createUser, setUserPassword, assingUserRole, deleteUsers} from '../grpc_api/users';
import { createArchive, createArchiveVolume, } from '../grpc_api/archives';
import { createCamera, deleteCameras, getVideChannelsList, addVirtualVideo, changeSingleCameraActiveStatus, changeIPServerCameraActiveStatus, changeSingleCameraID, changeSingleCameraName, changeIPServerCameraID, changeIPServerCameraName} from '../grpc_api/cameras';
import { createLayout, deleteLayouts, } from '../grpc_api/layouts';
import { randomUUID } from 'node:crypto';
import { getHostName } from '../http_api/http_host';
let websockets = {events: {},
video: {},}; 

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
    await getHostName();
//     await createCamera(1, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "80", "1", "Camera");
//     await createCamera(1, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "80", "2", "Camera");
//     await createCamera(1, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "80", "3", "Camera");
//     await createCamera(1, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "80", "4", "Camera");
//     await createCamera(1, "AxxonSoft", "Virtual IP server", "admin123", "admin", "0.0.0.0", "80", "5", "Camera");
//     console.log(createdUnits.cameras);
//     videoChannelList = await getVideChannelsList(createdUnits.cameras);
//     await addVirtualVideo(videoChannelList, "lprusa", "tracker");
//     await changeSingleCameraActiveStatus(videoChannelList[2].cameraBinding, false);
//     await changeIPServerCameraActiveStatus(videoChannelList[5].uid, false);
//     await changeIPServerCameraActiveStatus(videoChannelList[6].uid, false);
//     await changeIPServerCameraName(videoChannelList[4].uid, "Camera");
//     await changeIPServerCameraName(videoChannelList[5].uid, "Camera");
//     await changeIPServerCameraName(videoChannelList[6].uid, "Camera");
//     await changeIPServerCameraName(videoChannelList[7].uid, "Camera");
});
  
// test.afterAll(async () => {
//     console.log(createdUnits);
//     await deleteRoles(createdUnits.roles);
//     await deleteUsers(createdUnits.users);
//     await deleteCameras(createdUnits.cameras);
//     await deleteLayouts(createdUnits.layouts);
// });

test.beforeEach(async ({ page }) => {
    await page.goto(currentURL);
    // page.on('request', request => console.log('>>', request.method(), request.url()));
    let wsAdr = currentURL.replace(/http\w*:/, 'ws:');
    page.on('websocket', ws => {
        if (ws.url().includes(`${wsAdr}/ws?`)) {
            websockets["video"] = ws;
        }
        if (ws.url().includes(`${wsAdr}/events?`)) {
            websockets["events"] = ws;
        }
        console.log(`WebSocket opened: ${ws.url()}>`);
        // console.log(ws);
        
        // ws.on('framesent', event => console.log(event.payload));
        // ws.on('framereceived', event => console.log(event.payload));
        // ws.on('close', () => console.log('WebSocket closed'));
    });
    await page.getByLabel('Login').fill('root');
    await page.getByLabel('Password').fill('root');
    await page.getByLabel('Password').press('Enter');
    // await page.pause();
    await page.locator('#at-top-menu-btn').click();
    await page.getByRole('menuitem', { name: 'Preferences' }).click();
    await page.getByLabel('Show only live cameras').uncheck();
    await page.locator("[role='dialog'] button:last-child").click();
});

// test('Camera list without layouts (CLOUD-T113)', async ({ page }) => {
//     // await page.pause();
//     await expect(page.getByRole('button', { name: '1.Camera', exact: true })).toBeVisible();
//     await expect(page.getByRole('button', { name: '2.Camera', exact: true })).toBeVisible();
//     await expect(page.getByRole('button', { name: '3.Camera', exact: true })).toBeVisible();
//     await expect(page.getByRole('button', { name: '4.Camera', exact: true })).toBeVisible();
//     await expect(page.getByRole('button', { name: '5.0.Camera', exact: true })).toBeVisible();
//     await expect(page.getByRole('button', { name: '5.1.Camera', exact: true })).toBeVisible();
//     await expect(page.getByRole('button', { name: '5.2.Camera', exact: true })).toBeVisible();
//     await expect(page.getByRole('button', { name: '5.3.Camera', exact: true })).toBeVisible();
//     await expect(page.locator("xpath=//*/p/span[text()='1.Camera']")).toHaveCSS("color", "rgb(250, 250, 250)");
//     await expect(page.locator("xpath=//*/p/span[text()='3.Camera']")).not.toHaveCSS("color", "rgb(250, 250, 250)");
//     await expect(page.locator("xpath=//*/p/span[text()='5.0.Camera']")).toHaveCSS("color", "rgb(250, 250, 250)");
//     await expect(page.locator("xpath=//*/p/span[text()='5.1.Camera']")).not.toHaveCSS("color", "rgb(250, 250, 250)");
//     await expect(page.locator("xpath=//*/p/span[text()='5.2.Camera']")).not.toHaveCSS("color", "rgb(250, 250, 250)");
// });


test('Camera list with layouts (CLOUD-T121)', async ({ page }) => {
    // await createLayout(videoChannelList, 2, 2, "Test Layout");
    await page.pause();
    await page.getByRole('button', { name: 'Hardware' }).click();
    await expect(page.getByRole('button', { name: '1.Camera', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '2.Camera', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '3.Camera', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '4.Camera', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '5.0.Camera', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '5.1.Camera', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '5.2.Camera', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '5.3.Camera', exact: true })).toBeVisible();
    await expect(page.locator("xpath=//*/p/span[text()='1.Camera']")).toHaveCSS("color", "rgb(250, 250, 250)");
    await expect(page.locator("xpath=//*/p/span[text()='3.Camera']")).not.toHaveCSS("color", "rgb(250, 250, 250)");
    await expect(page.locator("xpath=//*/p/span[text()='5.0.Camera']")).toHaveCSS("color", "rgb(250, 250, 250)");
    await expect(page.locator("xpath=//*/p/span[text()='5.1.Camera']")).not.toHaveCSS("color", "rgb(250, 250, 250)");
    await expect(page.locator("xpath=//*/p/span[text()='5.2.Camera']")).not.toHaveCSS("color", "rgb(250, 250, 250)");
    await page.getByRole('button', { name: 'Hardware' }).click();
    await expect(page.getByRole('button', { name: '1.Camera', exact: true })).toBeHidden();
});


test('Change width camera list (CLOUD-T122)', async ({ page }) => {
    await page.pause();
    await page.getByRole('button', { name: 'Hardware' }).click();
    await page.locator('.camera-list [role=none]').hover();
    await page.mouse.down();
    await page.mouse.move(400, 0);
    await page.mouse.up();
    await page.getByRole('button', { name: 'Hardware' }).click();
    await page.getByRole('button', { name: 'Hardware' }).click();
    let listWidth = await page.evaluate(() => window.localStorage.getItem('cameraList'));
    expect(Number(listWidth) == 400).toBeTruthy();
    await page.locator('.camera-list [role=none]').hover();
    await page.mouse.down();
    await page.mouse.move(250, 0);
    await page.mouse.up();
    await page.getByRole('button', { name: 'Hardware' }).click();
    await page.getByRole('button', { name: 'Hardware' }).click();
    listWidth = await page.evaluate(() => window.localStorage.getItem('cameraList'));
    expect(Number(listWidth) == 250).toBeTruthy();
});


test.only('Reltime list update (CLOUD-T123)', async ({ page }) => {
    // await createLayout(videoChannelList, 2, 2, "Test Layout");
    // await page.pause();
    
    // page.on('request', request => console.log('>>', request.method(), request.url()));
    await page.getByRole('button', { name: 'Hardware' }).click();
    await createCamera(1, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "80", "10", "Camera");
    await createCamera(1, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "80", "11", "Camera");
    await expect(page.getByRole('button', { name: '10.Camera', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '11.Camera', exact: true })).toBeVisible();
    await deleteCameras([createdUnits.cameras[createdUnits.cameras.length - 2], createdUnits.cameras[createdUnits.cameras.length - 1]]);
    console.log(websockets.events.url());
    console.log(websockets.video.url());
    await page.waitForTimeout(5000);  // лучше переписать
    expect(await page.getByRole('button', { name: '10.Camera', exact: true }).count()).toEqual(0);
    expect(await page.getByRole('button', { name: '11.Camera', exact: true }).count()).toEqual(0);
});

// test('Authorization attempt with an empty fields (CLOUD-T153)', async ({ page }) => {
//     await createLayout(videoChannelList, 2, 2, "Test Layout");
//     // await page.pause();
//     await expect(page.getByRole('button', { name: 'Hardware' })).toBeVisible();
//     await expect(page.locator('id=at-app-mode-live')).toBeVisible();
//     await expect(page.getByRole('button', { name: '1.Camera', exact: true })).toBeVisible();
//     await expect(page.getByRole('button', { name: '2.Camera', exact: true })).toBeVisible();
//     await expect(page.getByRole('button', { name: '3.Camera', exact: true })).toBeVisible();
//     await expect(page.getByRole('button', { name: '4.Camera', exact: true })).toBeVisible();
//     await expect(page.getByRole('button', { name: '5.0.Camera', exact: true })).toBeVisible();
//     await expect(page.getByRole('button', { name: '5.1.Camera', exact: true })).toBeVisible();
//     await expect(page.getByRole('button', { name: '5.2.Camera', exact: true })).toBeVisible();
//     await expect(page.getByRole('button', { name: '5.3.Camera', exact: true })).toBeVisible();
// });

// test('Filter by imported file', async ({ page }) => {
//     await page.goto(currentURL);
//     await page.pause();
//     await page.getByLabel('Login').fill('root');
//     await page.getByLabel('Password').fill('root');
//     await page.getByLabel('Login').press('Enter');
//     await expect(page.getByRole('button', { name: 'Hardware' })).toBeVisible();
//     await page.locator('#import-search-camlist-btn').setInputFiles('./test_data/example.xlsx');
//     await expect(page.getByRole('button', { name: '108.Camera' })).toBeHidden();
//     await expect(page.getByRole('button', { name: '109.Camera' })).toBeVisible();
//     await expect(page.getByRole('button', { name: '110.Camera' })).toBeHidden();
// });