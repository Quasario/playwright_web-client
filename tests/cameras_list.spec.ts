import { test, expect,} from '@playwright/test';
import { currentURL, Configuration, hostName } from '../global_variables';
import { createRole, setRolePermissions, deleteRoles} from '../grpc_api/roles';
import { createUser, setUserPassword, assingUserRole, deleteUsers} from '../grpc_api/users';
import { createArchive, createArchiveVolume, } from '../grpc_api/archives';
import { createCamera, deleteCameras, addVirtualVideo, changeSingleCameraActiveStatus, changeIPServerCameraActiveStatus, changeSingleCameraID, changeSingleCameraName, changeIPServerCameraID, changeIPServerCameraName} from '../grpc_api/cameras';
import { createLayout, deleteLayouts, } from '../grpc_api/layouts';
import { randomUUID } from 'node:crypto';
import { getHostName } from '../http_api/http_host';
import { isCameraListOpen, getCameraList, cameraAnnihilator, layoutAnnihilator, configurationCollector } from "../utils/utils.js";

let workerCount = 0;
// let videoChannelList;
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
    await configurationCollector();
    await cameraAnnihilator();
    await layoutAnnihilator();
    await createCamera(1, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "80", "1", "Camera");
    await createCamera(1, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "80", "2", "Camera");
    await createCamera(1, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "80", "3", "Camera");
    await createCamera(1, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "80", "4", "Camera");
    await createCamera(1, "AxxonSoft", "Virtual IP server", "admin123", "admin", "0.0.0.0", "80", "5", "Camera");
    console.log(Configuration);
    // videoChannelList = await getVideChannelsList(createdUnits.cameras);
    await addVirtualVideo(Configuration.cameras, "lprusa", "tracker");
    await changeSingleCameraActiveStatus(Configuration.cameras[2].cameraBinding, false);
    await changeIPServerCameraActiveStatus(Configuration.cameras[5].videochannelID, false);
    await changeIPServerCameraActiveStatus(Configuration.cameras[6].videochannelID, false);
    for (let camera of Configuration.cameras) {
        if (camera.isIpServer){
            await changeIPServerCameraName(camera.videochannelID, "Camera");
        }
    }

});
  
test.afterAll(async () => {
//     console.log(createdUnits);
//     await deleteRoles(createdUnits.roles);
//     await deleteUsers(createdUnits.users);
//     await deleteCameras(createdUnits.cameras);
//     await deleteLayouts(createdUnits.layouts);
});

test.beforeEach(async ({ page }) => {
    await page.goto(currentURL);
    await page.getByLabel('Login').fill('root');
    await page.getByLabel('Password').fill('root');
    await page.getByLabel('Password').press('Enter');
    // await page.pause();
    await page.locator('#at-top-menu-btn').click();
    await page.getByRole('menuitem', { name: 'Preferences' }).click();
    await page.getByLabel('Show only live cameras').uncheck();
    await page.locator("[role='dialog'] button:last-child").click();
});


test('Camera list without layouts (CLOUD-T113)', async ({ page }) => {
    // await page.pause();
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
});


test('Camera list with layouts (CLOUD-T121)', async ({ page }) => {
    let cameraList = await getCameraList();
    await createLayout(cameraList, 2, 2, "Test Layout");
    // await page.pause();
    await page.reload();
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
    // await page.pause();
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


test('Reltime list update (CLOUD-T123)', async ({ page }) => {
    // await page.pause();
    await page.getByRole('button', { name: 'Hardware' }).click();
    await createCamera(1, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "80", "10", "Camera");
    await createCamera(1, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "80", "11", "Camera");
    await expect(page.getByRole('button', { name: '10.Camera', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '11.Camera', exact: true })).toBeVisible();
    await deleteCameras([Configuration.cameras[Configuration.cameras.length - 2].cameraBinding, Configuration.cameras[Configuration.cameras.length - 1].cameraBinding]);
    await page.getByRole('button', { name: `11.Camera`, exact: true }).waitFor({state: 'detached', timeout: 5000});
    // await page.waitForTimeout(5000);
    expect(await page.getByRole('button', { name: '10.Camera', exact: true }).count()).toEqual(0);
    expect(await page.getByRole('button', { name: '11.Camera', exact: true }).count()).toEqual(0);
});

test('Check "Manually open and close" parameter (CLOUD-T124)', async ({ page }) => {
    // await page.pause();
    await page.getByRole('button', { name: 'Hardware' }).click();
    expect(await isCameraListOpen(page)).toBeTruthy();
    await page.getByRole('button', { name: '1.Camera', exact: true }).click();
    await expect (page.locator('[role="gridcell"]').filter({hasText: /1\.Camera/})).toBeVisible();
    expect(await isCameraListOpen(page)).toBeTruthy();
    await page.locator('#at-layout-items').click();
    expect(await isCameraListOpen(page)).toBeTruthy();
    await page.locator('#at-top-menu-btn').click();
    await page.getByRole('menuitem', { name: 'Preferences' }).click();
    await page.getByLabel('Manually open and close').uncheck();
    await page.locator("[role='dialog'] button:last-child").click();
    await page.locator('#at-layout-items').click();
    expect(await isCameraListOpen(page)).not.toBeTruthy();
    await page.getByRole('button', { name: 'Hardware' }).click();
    await page.getByRole('button', { name: '3.Camera', exact: true }).click();
    await expect (page.locator('[role="gridcell"]').filter({hasText: /3\.Camera/})).toBeVisible();
    expect(await isCameraListOpen(page)).not.toBeTruthy();
});

test('Check camera preview in list (CLOUD-T125)', async ({ page }) => {
    // await page.pause();
    await page.getByRole('button', { name: 'Hardware' }).click();
    await page.waitForTimeout(5000);
    let requestPromise = page.waitForRequest(request => request.url().includes(`${currentURL}/live/media/snapshot/${hostName}/DeviceIpint.1/SourceEndpoint.video:0:1`));
    await page.getByRole('button', { name: '1.Camera', exact: true }).hover();
    await requestPromise;
    await expect(page.locator('[alt="1.Camera"]')).toHaveAttribute("src", /blob:.*/);
    await page.getByRole('button', { name: '3.Camera', exact: true }).hover();
    // await expect(page.locator('[alt="3.Camera"]')).toHaveAttribute("src", /data:image.*/);
    expect(await page.locator('[alt="3.Camera"]').count()).toEqual(0);
    requestPromise = page.waitForRequest(request => request.url().includes(`${currentURL}/live/media/snapshot/${hostName}/DeviceIpint.5/SourceEndpoint.video:0:1`));
    await page.getByRole('button', { name: '5.0.Camera', exact: true }).hover();
    await requestPromise;
    await expect(page.locator('[alt="5.0.Camera"]')).toHaveAttribute("src", /blob:.*/);
    await page.getByRole('button', { name: '5.1.Camera', exact: true }).hover();
    // await expect(page.locator('[alt="5.1.Camera"]')).toHaveAttribute("src", /data:image.*/);
    expect(await page.locator('[alt="5.1.Camera"]').count()).toEqual(0);
});

test('Check "Open selected camera on layout" parameter (CLOUD-T126)', async ({ page }) => {
    test.skip();

    // await page.pause();
    await page.getByRole('button', { name: 'Hardware' }).click();
    await page.getByRole('button', { name: '1.Camera', exact: true }).click();
    let cameraCountInLive = await page.locator('[role="gridcell"]').count();
    expect (cameraCountInLive).toEqual(1);
    await expect (page.locator('.VideoCell__bar-container').nth(0)).toHaveText("1.Camera");
    await page.getByRole('button', { name: '5.0.Camera', exact: true }).click();
    cameraCountInLive = await page.locator('[role="gridcell"]').count();
    expect (cameraCountInLive).toEqual(1);
    await expect (page.locator('.VideoCell__bar-container').nth(0)).toHaveText("5.0.Camera");

    await page.locator('#at-top-menu-btn').click();
    await page.getByRole('menuitem', { name: 'Preferences' }).click();
    await page.getByLabel('Open selected camera on layout').check();
    await page.locator("[role='dialog'] button:last-child").click();

    await page.getByRole('button', { name: '1.Camera', exact: true }).click();
    cameraCountInLive = await page.locator('[role="gridcell"]').count();
    expect (cameraCountInLive).toBeGreaterThan(1);
    await expect (page.locator('.VideoCell__bar-container').nth(0)).toHaveText("1.Camera");
    await page.getByRole('button', { name: '5.0.Camera', exact: true }).click();
    cameraCountInLive = await page.locator('[role="gridcell"]').count();
    expect (cameraCountInLive).toEqual(1);
    await expect (page.locator('.VideoCell__bar-container').nth(0)).toHaveText("5.0.Camera");
});

test('Check "Show only live cameras" parameter (CLOUD-T127)', async ({ page }) => {
    // await page.pause();

    await page.locator('#at-top-menu-btn').click();
    await page.getByRole('menuitem', { name: 'Preferences' }).click();
    await page.getByLabel('Show only live cameras').check();
    await page.locator('[role="dialog"] button:last-child').click();
    await page.getByRole('button', { name: 'Hardware' }).click();
    //ждем пока первая камера не появится в списке:
    await page.getByRole('button', { name: `1.Camera`, exact: true }).waitFor({state: 'attached', timeout: 5000});
    for (let camera of Configuration.cameras) {
        if (camera.isActivated) {
            expect(await page.getByRole('button', { name: `${camera.displayId}.${camera.displayName}`, exact: true }).count()).toEqual(1);
        } else {
            expect(await page.getByRole('button', { name: `${camera.displayId}.${camera.displayName}`, exact: true }).count()).toEqual(0);
        }
    };

    await page.locator('#at-top-menu-btn').click();
    await page.getByRole('menuitem', { name: 'Preferences' }).click();
    await page.getByLabel('Show only live cameras').uncheck();
    await page.locator('[role="dialog"] button:last-child').click();
    //ждем пока последняя камера не появится в списке:
    await page.getByRole('button', { name: `5.3.Camera`, exact: true }).waitFor({state: 'attached', timeout: 5000});
    for (let camera of Configuration.cameras) {
        expect(await page.getByRole('button', { name: `${camera.displayId}.${camera.displayName}`, exact: true }).count()).toEqual(1);
    };
});


test('Check "Show device IDs" parameter (CLOUD-T128)', async ({ page }) => {
    //await page.pause();

    await page.locator('#at-top-menu-btn').click();
    await page.getByRole('menuitem', { name: 'Preferences' }).click();
    await page.getByLabel('Show device IDs').uncheck();
    await page.locator('[role="dialog"] button:last-child').click();
    await page.getByRole('button', { name: 'Hardware'}).click();
    await page.getByRole('button', { name: `Camera`, exact: true }).first().waitFor({state: 'attached', timeout: 5000});
    expect(await page.getByRole('button', { name: `Camera`, exact: true }).count()).toBeGreaterThanOrEqual(8);
    await expect(page.getByRole('button', { name: `Sort the camera list by ID`, exact: true })).toBeHidden();

    await page.locator('#at-top-menu-btn').click();
    await page.getByRole('menuitem', { name: 'Preferences' }).click();
    await page.getByLabel('Show device IDs').check();
    await page.locator('[role="dialog"] button:last-child').click();
    await page.getByRole('button', { name: `1.Camera`, exact: true }).waitFor({state: 'attached', timeout: 5000});
    expect(await page.getByRole('button', { name: `Camera`, exact: true }).count()).toEqual(0);
    await expect(page.getByRole('button', { name: `Sort the camera list by ID`, exact: true })).toBeVisible();
});


test('Reltime camera status change in list (CLOUD-T129)', async ({ page }) => {
    // await page.pause();
    await page.getByRole('button', { name: 'Hardware'}).click();

    await changeSingleCameraActiveStatus(Configuration.cameras[0].cameraBinding, false);
    await changeSingleCameraActiveStatus(Configuration.cameras[1].cameraBinding, false);
    await changeIPServerCameraActiveStatus(Configuration.cameras[4].videochannelID, false);
    await page.waitForTimeout(5000);

    for (let camera of Configuration.cameras) {
        if (camera.isActivated) {
            // await expect(page.getByRole('button', { name: `${camera.displayId}.${camera.displayName}`, exact: true })).toHaveCSS("color", "rgb(250, 250, 250)");
            await expect(page.locator(`xpath=//*/p/span[text()='${camera.displayId}.${camera.displayName}']`)).toHaveCSS("color", "rgb(250, 250, 250)");
        } else {
            // await expect(page.getByRole('button', { name: `${camera.displayId}.${camera.displayName}`, exact: true })).not.toHaveCSS("color", "rgb(250, 250, 250)");
            await expect(page.locator(`xpath=//*/p/span[text()='${camera.displayId}.${camera.displayName}']`)).not.toHaveCSS("color", "rgb(250, 250, 250)");
            //включаем камеры обратно
            if (camera.isIpServer) {
                await changeIPServerCameraActiveStatus(camera.videochannelID, true);
            } else {
                await changeSingleCameraActiveStatus(camera.cameraBinding, true);
            }
        }
    };

    for (let camera of Configuration.cameras) {
        await expect(page.locator(`xpath=//*/p/span[text()='${camera.displayId}.${camera.displayName}']`)).toHaveCSS("color", "rgb(250, 250, 250)");
    };
});

test('Camera ID change (CLOUD-T130)', async ({ page }) => {
    // await page.pause();

    await changeSingleCameraID(Configuration.cameras[0].cameraBinding, "100");
    await changeSingleCameraID(Configuration.cameras[2].cameraBinding, "A");
    await changeIPServerCameraID(Configuration.cameras[4].videochannelID, "11");
    await changeIPServerCameraID(Configuration.cameras[6].videochannelID, "5");

    await page.getByRole('button', { name: 'Hardware'}).click();

    await expect(page.getByRole('button', { name: `100.Camera`, exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: `A.Camera`, exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: `5.11.Camera`, exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: `5.5.Camera`, exact: true })).toBeVisible();
});

test('Camera name change (CLOUD-T131)', async ({ page }) => {
    // await page.pause();

    await changeSingleCameraName(Configuration.cameras[1].cameraBinding, "Device");
    await changeSingleCameraName(Configuration.cameras[3].cameraBinding, "221B Baker Street");
    await changeIPServerCameraName(Configuration.cameras[5].videochannelID, "Кабинет 1-эт");
    await changeIPServerCameraName(Configuration.cameras[7].videochannelID, "undefined");

    await page.getByRole('button', { name: 'Hardware'}).click();

    await expect(page.getByRole('button', { name: `2.Device`, exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: `4.221B Baker Street`, exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: `5.1.Кабинет 1-эт`, exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: `5.3.undefined`, exact: true })).toBeVisible();
});

test('Sort by name (CLOUD-T133)', async ({ page }) => {
    // await page.pause();
    let testCameraNames = [
        {
            fullId: "100",
            id: "100",
            name: "Smith & Wesson"
        },
        {
            fullId: "2",
            id: "2",
            name: "Device"
        },
        {
            fullId: "A",
            id: "A",
            name: "Camera"
        },
        {
            fullId: "4",
            id: "4",
            name: "221B Baker Street"
        },
        {
            fullId: "5.11",
            id: "11",
            name: `!@#$%^&*()_+=?<'>""/|\\.,~:;`
        },
        {
            fullId: "5.1",
            id: "1",
            name: `Кабинет 1-эт`
        },
        {
            fullId: "5.5",
            id: "5",
            name: `Площадь`
        },
        {
            fullId: "5.3",
            id: "3",
            name: `undefined`
        },
    ];

    for (let i = 0; i < Configuration.cameras.length; i++) {
        if (Configuration.cameras[i].displayId != testCameraNames[i].fullId) {
            if (Configuration.cameras[i].isIpServer) {
                await changeIPServerCameraID(Configuration.cameras[i].videochannelID, testCameraNames[i].id);
            } else {
                await changeSingleCameraID(Configuration.cameras[i].cameraBinding, testCameraNames[i].id);
            }
        }
        if (Configuration.cameras[i].displayName != testCameraNames[i].name) {
            if (Configuration.cameras[i].isIpServer) {
                await changeIPServerCameraName(Configuration.cameras[i].videochannelID, testCameraNames[i].name);
            } else {
                await changeSingleCameraName(Configuration.cameras[i].cameraBinding, testCameraNames[i].name);
            }
        }
    }

    await page.getByRole('button', { name: 'Hardware'}).click();
    await page.locator('.camera-list span>[type="button"]:nth-child(2)').click();
    
    await expect(page.locator('[draggable="true"]:nth-child(1)')).toHaveText('5.5.Площадь', { ignoreCase: false });
    await expect(page.locator('[draggable="true"]:nth-child(2)')).toHaveText('5.1.Кабинет 1-эт', { ignoreCase: false });
    await expect(page.locator('[draggable="true"]:nth-child(3)')).toHaveText('5.3.undefined', { ignoreCase: false });
    await expect(page.locator('[draggable="true"]:nth-child(4)')).toHaveText('100.Smith & Wesson', { ignoreCase: false });
    await expect(page.locator('[draggable="true"]:nth-child(5)')).toHaveText('2.Device', { ignoreCase: false });
    await expect(page.locator('[draggable="true"]:nth-child(6)')).toHaveText('A.Camera', { ignoreCase: false });
    await expect(page.locator('[draggable="true"]:nth-child(7)')).toHaveText('4.221B Baker Street', { ignoreCase: false });
    await expect(page.locator('[draggable="true"]:nth-child(8)')).toHaveText(`5.11.!@#$%^&*()_+=?<'>""/|\\.,~:;`, { ignoreCase: false });

    await page.locator('.camera-list span>[type="button"]:nth-child(2)').click();

    await expect(page.locator('[draggable="true"]:nth-child(1)')).toHaveText(`5.11.!@#$%^&*()_+=?<'>""/|\\.,~:;`, { ignoreCase: false });
    await expect(page.locator('[draggable="true"]:nth-child(2)')).toHaveText('4.221B Baker Street', { ignoreCase: false });
    await expect(page.locator('[draggable="true"]:nth-child(3)')).toHaveText('A.Camera', { ignoreCase: false });
    await expect(page.locator('[draggable="true"]:nth-child(4)')).toHaveText('2.Device', { ignoreCase: false });
    await expect(page.locator('[draggable="true"]:nth-child(5)')).toHaveText('100.Smith & Wesson', { ignoreCase: false });
    await expect(page.locator('[draggable="true"]:nth-child(6)')).toHaveText('5.3.undefined', { ignoreCase: false });
    await expect(page.locator('[draggable="true"]:nth-child(7)')).toHaveText('5.1.Кабинет 1-эт', { ignoreCase: false });
    await expect(page.locator('[draggable="true"]:nth-child(8)')).toHaveText('5.5.Площадь', { ignoreCase: false });
});

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