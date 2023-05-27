import { test, expect, } from '@playwright/test';
import { currentURL, Configuration, hostName } from '../global_variables';
import { createRole, setRolePermissions, deleteRoles, setObjectPermissions } from '../grpc_api/roles';
import { createUser, setUserPassword, assignUserRole, deleteUsers } from '../grpc_api/users';
import { createArchive, createArchiveVolume, createArchiveContext, deleteArchive, getArchiveList } from '../grpc_api/archives';
import { createGroup, setGroup, addCameraToGroup } from '../grpc_api/groups';
import { createCamera, deleteCameras, addVirtualVideo, changeSingleCameraActiveStatus, changeIPServerCameraActiveStatus, changeSingleCameraID, changeSingleCameraName, changeIPServerCameraID, changeIPServerCameraName} from '../grpc_api/cameras';
import { createLayout, deleteLayouts, } from '../grpc_api/layouts';
import { randomUUID } from 'node:crypto';
import { getHostName } from '../http_api/http_host';
import { isCameraListOpen, getCameraList, cameraAnnihilator, layoutAnnihilator, groupAnnihilator, configurationCollector, userAnnihilator, roleAnnihilator } from "../utils/utils.js";

//Список названий/ID камер в конфигурации
let cameras: any;

let userWithoutGroupPanel = {
    "feature_access": [
        "FEATURE_ACCESS_DEVICES_SETUP",
        "FEATURE_ACCESS_ARCHIVES_SETUP",
        "FEATURE_ACCESS_DETECTORS_SETUP",
        "FEATURE_ACCESS_SETTINGS_SETUP",
        "FEATURE_ACCESS_PROGRAMMING_SETUP",
        "FEATURE_ACCESS_REALTIME_RECOGNITION_SETUP",
        "FEATURE_ACCESS_WEB_UI_LOGIN",
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
        "FEATURE_ACCESS_OBJECT_PANEL_AND_CAMERA_SEARCH_PANEL",
        "FEATURE_ACCESS_CONFIDENTIAL_BOOKMARKS"
    ]
}

test.beforeAll(async () => {
    await getHostName();
    await configurationCollector();
    // await getArchiveList();
    // await deleteArchive('Black');
    // await cameraAnnihilator();
    // await layoutAnnihilator();
    // await createCamera(8, "AxxonSoft", "Virtual several streams", "admin", "admin", "0.0.0.0", "80", "", "Camera");
    // await createCamera(2, "AxxonSoft", "Virtual IP server", "admin123", "admin", "0.0.0.0", "80", "", "Camera");
    // await addVirtualVideo(Configuration.cameras, "lprusa", "tracker");
    // await createArchive("Black");
    // await createArchiveVolume("Black", 20);
    // let cameraEndpoints = Configuration.cameras.map(item => item.accessPoint);
    // await createArchiveContext("Black", cameraEndpoints, false);
    cameras = Configuration.cameras.map(item => { return ({
        id: item.displayId,
        name: item.displayName  
    })})

    console.log(cameras);

    // await createLayout(Configuration.cameras, 2, 2, "Test Layout");
    // await createRole("New_Role");
    // await setRolePermissions("New_Role");
    // await createUser("User_1");
    // await assignUserRole("New_Role", "User_1");
    // await setUserPassword("User_1", "123");
    // console.log(Configuration);
    // await addVirtualVideo(Configuration.cameras, "lprusa", "tracker");
    // await changeSingleCameraActiveStatus(Configuration.cameras[2].cameraBinding, false);
    // await changeIPServerCameraActiveStatus(Configuration.cameras[5].videochannelID, false);
    // await changeIPServerCameraActiveStatus(Configuration.cameras[6].videochannelID, false);
    // for (let camera of Configuration.cameras) {
    //     if (camera.isIpServer){
    //         await changeIPServerCameraName(camera.videochannelID, "Camera");
    //     }
    // }
});
  
// test.afterAll(async () => {
//     await cameraAnnihilator();
//     await layoutAnnihilator();
//     await layoutAnnihilator();
//     await groupAnnihilator();
//     await roleAnnihilator();
//     await userAnnihilator();
// });

test.beforeEach(async ({ page }) => {
    // await layoutAnnihilator();
    await page.goto(currentURL);
    await page.getByLabel('Login').fill('root');
    await page.getByLabel('Password').fill('root');
    await page.getByLabel('Password').press('Enter');
});


test('Creation of x1 layout (CLOUD-T229)', async ({ page }) => {
    // await page.pause();

    await page.locator('#at-layout-menu').click();
    await page.locator('[title="1\u00D71"]').click();
    await expect (page.locator('[data-testid="at-camera-title"]').nth(0)).toHaveText(`${cameras[0].id}.${cameras[0].name}`);
    let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await requestPromise;

    expect (await page.locator('[data-testid="at-camera-title"]').count()).toEqual(1);
    await expect (page.locator('#at-layout-item-0')).toContainText("New Layout");
    await expect (page.locator('[data-testid="at-camera-title"]').nth(0)).toHaveText(`${cameras[0].id}.${cameras[0].name}`);
    await expect (page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(0)).toContainText("Auto");
});


test('Creation of x4 layout (CLOUD-T230)', async ({ page }) => {
    // await page.pause();

    await page.locator('#at-layout-menu').click();
    await page.locator('[title="2\u00D72"]').click();
    await expect (page.locator('[data-testid="at-camera-title"]').nth(0)).toHaveText(`${cameras[0].id}.${cameras[0].name}`);
    await expect (page.locator('[data-testid="at-camera-title"]').nth(1)).toHaveText(`${cameras[1].id}.${cameras[1].name}`);
    await expect (page.locator('[data-testid="at-camera-title"]').nth(2)).toHaveText(`${cameras[2].id}.${cameras[2].name}`);
    await expect (page.locator('[data-testid="at-camera-title"]').nth(3)).toHaveText(`${cameras[3].id}.${cameras[3].name}`);
    let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await requestPromise;

    expect (await page.locator('[data-testid="at-camera-title"]').count()).toEqual(4);
    await expect (page.locator('#at-layout-item-0')).toContainText("New Layout");
    await expect (page.locator('[data-testid="at-camera-title"]').nth(0)).toHaveText(`${cameras[0].id}.${cameras[0].name}`);
    await expect (page.locator('[data-testid="at-camera-title"]').nth(1)).toHaveText(`${cameras[1].id}.${cameras[1].name}`);
    await expect (page.locator('[data-testid="at-camera-title"]').nth(2)).toHaveText(`${cameras[2].id}.${cameras[2].name}`);
    await expect (page.locator('[data-testid="at-camera-title"]').nth(3)).toHaveText(`${cameras[3].id}.${cameras[3].name}`);
    await expect (page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(0)).toContainText("Auto");
    await expect (page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(1)).toContainText("Auto");
    await expect (page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(2)).toContainText("Auto");
    await expect (page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(3)).toContainText("Auto");
});


test('Creation of x9 layout (CLOUD-T231)', async ({ page }) => {
    // await page.pause();

    await page.locator('#at-layout-menu').click();
    await page.locator('[title="3\u00D73"]').click();
    await expect (page.locator('[data-testid="at-camera-title"]').nth(0)).toHaveText(`${cameras[0].id}.${cameras[0].name}`);
    await expect (page.locator('[data-testid="at-camera-title"]').nth(4)).toHaveText(`${cameras[4].id}.${cameras[4].name}`);
    await expect (page.locator('[data-testid="at-camera-title"]').nth(8)).toHaveText(`${cameras[8].id}.${cameras[8].name}`);
    let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await requestPromise;

    expect (await page.locator('[data-testid="at-camera-title"]').count()).toEqual(9);
    await expect (page.locator('#at-layout-item-0')).toContainText("New Layout");
    await expect (page.locator('[data-testid="at-camera-title"]').nth(0)).toHaveText(`${cameras[0].id}.${cameras[0].name}`);
    await expect (page.locator('[data-testid="at-camera-title"]').nth(4)).toHaveText(`${cameras[4].id}.${cameras[4].name}`);
    await expect (page.locator('[data-testid="at-camera-title"]').nth(8)).toHaveText(`${cameras[8].id}.${cameras[8].name}`);
    await expect (page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(0)).toContainText("Auto");
    await expect (page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(4)).toContainText("Auto");
    await expect (page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(8)).toContainText("Auto");
});


test('Creation of x16 layout (CLOUD-T232)', async ({ page }) => {
    // await page.pause();

    await page.locator('#at-layout-menu').click();
    await page.locator('[title="4\u00D74"]').click();
    await expect (page.locator('[data-testid="at-camera-title"]').nth(0)).toHaveText(`${cameras[0].id}.${cameras[0].name}`);
    await expect (page.locator('[data-testid="at-camera-title"]').nth(5)).toHaveText(`${cameras[5].id}.${cameras[5].name}`);
    await expect (page.locator('[data-testid="at-camera-title"]').nth(10)).toHaveText(`${cameras[10].id}.${cameras[10].name}`);
    await expect (page.locator('[data-testid="at-camera-title"]').nth(15)).toHaveText(`${cameras[15].id}.${cameras[15].name}`);
    let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await requestPromise;

    expect (await page.locator('[data-testid="at-camera-title"]').count()).toEqual(16);
    await expect (page.locator('#at-layout-item-0')).toContainText("New Layout");
    await expect (page.locator('[data-testid="at-camera-title"]').nth(0)).toHaveText(`${cameras[0].id}.${cameras[0].name}`);
    await expect (page.locator('[data-testid="at-camera-title"]').nth(5)).toHaveText(`${cameras[5].id}.${cameras[5].name}`);
    await expect (page.locator('[data-testid="at-camera-title"]').nth(10)).toHaveText(`${cameras[10].id}.${cameras[10].name}`);
    await expect (page.locator('[data-testid="at-camera-title"]').nth(15)).toHaveText(`${cameras[15].id}.${cameras[15].name}`);
    await expect (page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(0)).toContainText("Auto");
    await expect (page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(5)).toContainText("Auto");
    await expect (page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(10)).toContainText("Auto");
    await expect (page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(15)).toContainText("Auto");
});


test('Cells size changing (CLOUD-T233)', async ({ page }) => {
    // await page.pause();

    await page.locator('#at-layout-menu').click();
    await page.locator('[title="3\u00D73"]').click();
    await page.locator('[role="gridcell"][tabindex="0"]').hover();
    await page.locator('[role="gridcell"][tabindex="0"] [role="group"]:nth-child(3) button:nth-child(1)').click(); // СДЕЛАТЬ ЛОКАТОРЫ
    //Ячейка 2 исчезла
    await expect (page.locator('[role="gridcell"][tabindex="1"]')).toBeHidden();

    await page.locator('[role="gridcell"][tabindex="0"] [role="group"]:nth-child(4) button:nth-child(1)').click();
    //Ячейки 4 и 5 исчезли
    await expect (page.locator('[role="gridcell"][tabindex="3"]')).toBeHidden();
    await expect (page.locator('[role="gridcell"][tabindex="4"]')).toBeHidden();

    await page.locator('[role="gridcell"][tabindex="8"]').hover();
    await page.locator('[role="gridcell"][tabindex="8"] [role="group"]:nth-child(2) button:nth-child(1)').click();
    //Ячейка 6 исчезла
    await expect (page.locator('[role="gridcell"][tabindex="5"]')).toBeHidden();

    await page.locator('[role="gridcell"][tabindex="7"]').hover();
    await page.locator('[role="gridcell"][tabindex="7"] [role="group"]:nth-child(1) button:nth-child(1)').click();
    //Ячейка 7 исчезла
    await expect (page.locator('[role="gridcell"][tabindex="6"]')).toBeHidden();
    await page.locator('[role="gridcell"][tabindex="7"] [role="group"]:nth-child(1) button:nth-child(2)').click();
    await expect (page.getByText("Drag camera here")).toBeVisible();

    let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await requestPromise;

    expect (await page.locator('[data-testid="at-camera-title"]').count()).toEqual(4);

});


test('Cells deleting (CLOUD-T234)', async ({ page }) => {
    // await page.pause();

    await page.locator('#at-layout-menu').click();
    await page.locator('[title="3\u00D73"]').click();
    await page.locator('[role="gridcell"][tabindex="0"]').hover();
    await page.locator('[role="gridcell"][tabindex="0"] button').last().click(); // СДЕЛАТЬ ЛОКАТОРЫ
    //Ячейка 1 пуста
    await expect (page.locator('[role="gridcell"][tabindex="0"] h6')).toHaveText("Drag camera here");

    await page.locator('[role="gridcell"][tabindex="4"]').hover();
    await page.locator('[role="gridcell"][tabindex="4"] button').last().click(); // СДЕЛАТЬ ЛОКАТОРЫ
    //Ячейка 5 пуста
    await expect (page.locator('[role="gridcell"][tabindex="4"] h6')).toHaveText("Drag camera here");

    await page.locator('[role="gridcell"][tabindex="8"]').hover();
    await page.locator('[role="gridcell"][tabindex="8"] button').last().click(); // СДЕЛАТЬ ЛОКАТОРЫ
    //Ячейка 9 пуста
    await expect (page.locator('[role="gridcell"][tabindex="8"] h6')).toHaveText("Drag camera here");

    //Удаляем правый столбец
    await page.locator('[role="gridcell"][tabindex="2"]').hover();
    await page.locator('[role="gridcell"][tabindex="2"] button').last().click(); // СДЕЛАТЬ ЛОКАТОРЫ
    await page.locator('[role="gridcell"][tabindex="5"]').hover();
    await page.locator('[role="gridcell"][tabindex="5"] button').last().click(); // СДЕЛАТЬ ЛОКАТОРЫ

    await expect (page.locator('[role="gridcell"][tabindex="5"]')).toBeHidden();

    //Удаляем нижний ряд
    await page.locator('[role="gridcell"][tabindex="7"]').hover();
    await page.locator('[role="gridcell"][tabindex="7"] button').last().click(); // СДЕЛАТЬ ЛОКАТОРЫ
    await page.locator('[role="gridcell"][tabindex="6"]').hover();
    await page.locator('[role="gridcell"][tabindex="6"] button').last().click(); // СДЕЛАТЬ ЛОКАТОРЫ

    await expect (page.locator('[role="gridcell"][tabindex="6"]')).toBeHidden();

    let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await requestPromise;
    console.log(requestPromise);
    expect (await page.locator('[data-testid="at-camera-title"]').count()).toEqual(2);

});


test('Clear layout from empty cells (CLOUD-T236)', async ({ page }) => {
    // await page.pause();
    await page.locator('#at-layout-menu').click();
    await page.locator('[title="1\u00D71"]').click();
    //В момент создания раскладки есть некая анимация, если ее не дождаться и сразу начать добавлять ячейки, то боковые панели съезжают
    await page.waitForTimeout(500);

    //Добавляем два столбца справа
    await page.locator('.layout > div:last-child > button').nth(2).click(); // СДЕЛАТЬ ЛОКАТОРЫ
    await page.locator('.layout > div:last-child > button').nth(2).click(); // СДЕЛАТЬ ЛОКАТОРЫ
    //Добавляем ряд снизу
    await page.locator('.layout > div:last-child > button').nth(3).click(); // СДЕЛАТЬ ЛОКАТОРЫ
    //Проверяем новые ячейки на текст
    await expect (page.locator('[role="gridcell"][tabindex="1"] h6')).toHaveText("Drag camera here");
    await expect (page.locator('[role="gridcell"][tabindex="2"] h6')).toHaveText("Drag camera here");
    await expect (page.locator('[role="gridcell"][tabindex="3"] h6')).toHaveText("Drag camera here");
    await expect (page.locator('[role="gridcell"][tabindex="4"] h6')).toHaveText("Drag camera here");
    await expect (page.locator('[role="gridcell"][tabindex="5"] h6')).toHaveText("Drag camera here");


    //Проверяем открыта ли панель с камерами, и открываем если нет
    if (!(await isCameraListOpen(page))) {
        await page.getByRole('button', { name: 'Hardware'}).click();
    }

    //Получаем координаты ячейки 3, чтобы потом перетащить туда камеру
    let cell;
    if (await isCameraListOpen(page)){
        cell = await page.locator('[role="gridcell"][tabindex="2"]').boundingBox();
        if (cell === null) {
            test.fail();
        }
    }

    //Перетаскиваем вторую камеру из списка в ячейку 3
    await page.locator('[data-testid="at-camera-list-item"]').nth(1).hover();
    await page.mouse.down();
    await page.mouse.move(cell!.x + cell!.width / 2, cell!.y + cell!.height / 2);
    await page.mouse.up();
    //Проверяем что в ячейке больше нет текста
    await expect (page.locator('[role="gridcell"][tabindex="2"] h6')).toBeHidden();
    //Жмем на кнопку очистки
    await page.getByRole('button', { name: 'Clean up'}).click();
    expect (await page.locator('[role="gridcell"]').count()).toEqual(2);

    let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await requestPromise;
    expect (await page.locator('[data-testid="at-camera-title"]').count()).toEqual(2);

});