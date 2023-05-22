import { test, expect, } from '@playwright/test';
import { currentURL, Configuration, hostName } from '../global_variables';
import { createRole, setRolePermissions, deleteRoles, setObjectPermissions } from '../grpc_api/roles';
import { createUser, setUserPassword, assingUserRole, deleteUsers } from '../grpc_api/users';
import { createArchive, createArchiveVolume, } from '../grpc_api/archives';
import { createGroup, setGroup, addCameraToGroup } from '../grpc_api/groups';
import { createCamera, deleteCameras, addVirtualVideo, changeSingleCameraActiveStatus, changeIPServerCameraActiveStatus, changeSingleCameraID, changeSingleCameraName, changeIPServerCameraID, changeIPServerCameraName} from '../grpc_api/cameras';
import { createLayout, deleteLayouts, } from '../grpc_api/layouts';
import { randomUUID } from 'node:crypto';
import { getHostName } from '../http_api/http_host';
import { isCameraListOpen, getCameraList, cameraAnnihilator, layoutAnnihilator, groupAnnihilator, configurationCollector, userAnnihilator, roleAnnihilator } from "../utils/utils.js";

//Список названий/ID камер для поисковых тестов
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
]

let workerCount = 0;
// let videoChannelList;
let roleId = randomUUID();
let userId = randomUUID();

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
    await cameraAnnihilator();
    await layoutAnnihilator();
    await createCamera(1, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "80", "1", "Camera");
    await createCamera(1, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "80", "2", "Camera");
    await createCamera(1, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "80", "3", "Camera");
    await createCamera(1, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "80", "4", "Camera");
    await createCamera(1, "AxxonSoft", "Virtual IP server", "admin123", "admin", "0.0.0.0", "80", "5", "Camera");
    await createLayout(Configuration.cameras, 2, 2, "Test Layout");
    await createRole("New_Role");
    await setRolePermissions("New_Role");
    await createUser("User_1");
    await assingUserRole("New_Role", "User_1");
    await setUserPassword("User_1", "123");
    console.log(Configuration);
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
    await cameraAnnihilator();
    await layoutAnnihilator();
    await layoutAnnihilator();
    await groupAnnihilator();
    await roleAnnihilator();
    await userAnnihilator();
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
    //Авторизация к юзеру без раскладок
    await page.locator('#at-top-menu-btn').click();
    await page.getByRole('menuitem', { name: 'Change user' }).click();
    await page.getByLabel('Login').fill('User_1');
    await page.getByLabel('Password').fill('123');
    await page.getByLabel('Password').press('Enter');
    //Проверяем что камеры на месте
    await expect(page.getByRole('button', { name: '1.Camera', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '2.Camera', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '3.Camera', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '4.Camera', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '5.0.Camera', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '5.1.Camera', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '5.2.Camera', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '5.3.Camera', exact: true })).toBeVisible();
    //Проверяем цвета камер в списке, чтобы включенные камеры были белыми, а выключенные нет
    await expect(page.locator("xpath=//*/p/span[text()='1.Camera']")).toHaveCSS("color", "rgb(250, 250, 250)");
    await expect(page.locator("xpath=//*/p/span[text()='3.Camera']")).not.toHaveCSS("color", "rgb(250, 250, 250)");
    await expect(page.locator("xpath=//*/p/span[text()='5.0.Camera']")).toHaveCSS("color", "rgb(250, 250, 250)");
    await expect(page.locator("xpath=//*/p/span[text()='5.1.Camera']")).not.toHaveCSS("color", "rgb(250, 250, 250)");
    await expect(page.locator("xpath=//*/p/span[text()='5.2.Camera']")).not.toHaveCSS("color", "rgb(250, 250, 250)");
});


test('Camera list with layouts (CLOUD-T121)', async ({ page }) => {
    // await page.pause();
    await page.getByRole('button', { name: 'Hardware' }).click();
    //Проверяем что камеры на месте
    await expect(page.getByRole('button', { name: '1.Camera', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '2.Camera', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '3.Camera', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '4.Camera', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '5.0.Camera', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '5.1.Camera', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '5.2.Camera', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '5.3.Camera', exact: true })).toBeVisible();
    //Проверяем цвета камер в списке, чтобы включенные камеры были белыми, а выключенные нет
    await expect(page.locator("xpath=//*/p/span[text()='1.Camera']")).toHaveCSS("color", "rgb(250, 250, 250)");
    await expect(page.locator("xpath=//*/p/span[text()='3.Camera']")).not.toHaveCSS("color", "rgb(250, 250, 250)");
    await expect(page.locator("xpath=//*/p/span[text()='5.0.Camera']")).toHaveCSS("color", "rgb(250, 250, 250)");
    await expect(page.locator("xpath=//*/p/span[text()='5.1.Camera']")).not.toHaveCSS("color", "rgb(250, 250, 250)");
    await expect(page.locator("xpath=//*/p/span[text()='5.2.Camera']")).not.toHaveCSS("color", "rgb(250, 250, 250)");
    await page.getByRole('button', { name: 'Hardware' }).click();
    //Проверяем что панель действительно закрылась
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
    //Берем размер панели из локалстораджа
    let listWidth = await page.evaluate(() => window.localStorage.getItem('cameraList'));
    //Сравниваем размер панели с тем что мы ранее двигали до 400px
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
    //Ждем пока удаленные камеры не исчезнут из списка
    await page.getByRole('button', { name: `11.Camera`, exact: true }).waitFor({state: 'detached', timeout: 5000});
    expect(await page.getByRole('button', { name: '10.Camera', exact: true }).count()).toEqual(0);
    expect(await page.getByRole('button', { name: '11.Camera', exact: true }).count()).toEqual(0);
});

test('Check "Manually open and close" parameter (CLOUD-T124)', async ({ page }) => {
    // await page.pause();
    await page.getByRole('button', { name: 'Hardware' }).click();
    expect(await isCameraListOpen(page)).toBeTruthy();
    //Кликаем на камеру и смотим чтобы список не закрылся
    await page.getByRole('button', { name: '1.Camera', exact: true }).click();
    await expect (page.locator('[role="gridcell"]').filter({hasText: /1\.Camera/})).toBeVisible();
    expect(await isCameraListOpen(page)).toBeTruthy();
    //Кликаем на панель с раскладками и смотрим чтобы список не закрылся
    await page.locator('#at-layout-items').click();
    expect(await isCameraListOpen(page)).toBeTruthy();
    //Отключаем параметр
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
    //Таймаут чтобы список успел прогрузится
    await page.waitForTimeout(5000);
    //Слушаем поток запросов 
    let requestPromise = page.waitForRequest(request => request.url().includes(`${currentURL}/live/media/snapshot/${hostName}/DeviceIpint.1/SourceEndpoint.video:0:1`));
    await page.getByRole('button', { name: '1.Camera', exact: true }).hover();
    await requestPromise;
    await expect(page.locator('[alt="1.Camera"]')).toHaveAttribute("src", /blob:.*/);
    await page.getByRole('button', { name: '3.Camera', exact: true }).hover();
    //Снапшоты с заглушкой несут не картинку, а svg
    await expect(page.locator('[data-testid="at-preview-snapshot"] svg')).toBeVisible();
    requestPromise = page.waitForRequest(request => request.url().includes(`${currentURL}/live/media/snapshot/${hostName}/DeviceIpint.5/SourceEndpoint.video:0:1`));
    await page.getByRole('button', { name: '5.0.Camera', exact: true }).hover();
    await requestPromise;
    await expect(page.locator('[alt="5.0.Camera"]')).toHaveAttribute("src", /blob:.*/);
    await page.getByRole('button', { name: '5.1.Camera', exact: true }).hover();
    await expect(page.locator('[data-testid="at-preview-snapshot"] svg')).toBeVisible();
});

test('Check "Open selected camera on layout" parameter (CLOUD-T126)', async ({ page }) => {
    // await page.pause();
    await page.getByRole('button', { name: 'Hardware' }).click();
    await page.getByRole('button', { name: '1.Camera', exact: true }).click();
    //Так как DOM выборе камеры перестраивается, то нужно подождать пока элементы снова в нем появятся иначе count() выдаст 0
    await page.locator('[data-testid="at-camera-title"]').first().waitFor({state: 'attached', timeout: 5000});
    let cameraCountInLive = await page.locator('[data-testid="at-camera-title"]').count();
    expect (cameraCountInLive).toEqual(1);
    await expect (page.locator('[data-testid="at-camera-title"]').nth(0)).toHaveText("1.Camera");

    await page.getByRole('button', { name: '5.0.Camera', exact: true }).click();
    await page.locator('[data-testid="at-camera-title"]').first().waitFor({state: 'attached', timeout: 5000});
    cameraCountInLive = await page.locator('[data-testid="at-camera-title"]').count();
    expect (cameraCountInLive).toEqual(1);
    await expect (page.locator('[data-testid="at-camera-title"]').first().nth(0)).toHaveText("5.0.Camera");

    await page.locator('#at-top-menu-btn').click();
    await page.getByRole('menuitem', { name: 'Preferences' }).click();
    await page.getByLabel('Open selected camera on layout').check();
    await page.locator("[role='dialog'] button:last-child").click();

    await page.getByRole('button', { name: '1.Camera', exact: true }).click();
    await page.locator('[data-testid="at-camera-title"]').first().waitFor({state: 'attached', timeout: 5000});
    cameraCountInLive = await page.locator('[data-testid="at-camera-title"]').count();
    expect (cameraCountInLive).toBeGreaterThan(1);
    await expect (page.locator('[data-testid="at-camera-title"]').nth(0)).toHaveText("1.Camera");

    await page.getByRole('button', { name: '5.0.Camera', exact: true }).click();
    await page.locator('[data-testid="at-camera-title"]').first().waitFor({state: 'attached', timeout: 5000});
    cameraCountInLive = await page.locator('[data-testid="at-camera-title"]').count();
    expect (cameraCountInLive).toEqual(1);
    await expect (page.locator('[data-testid="at-camera-title"]').nth(0)).toHaveText("5.0.Camera");
});

test('Check "Show only live cameras" parameter (CLOUD-T127)', async ({ page }) => {
    // await page.pause();
    await page.locator('#at-top-menu-btn').click();
    await page.getByRole('menuitem', { name: 'Preferences' }).click();
    await page.getByLabel('Show only live cameras').check();
    await page.locator('[role="dialog"] button:last-child').click();
    await page.getByRole('button', { name: 'Hardware' }).click();
    //Ждем пока первая камера не появится в списке:
    await page.getByRole('button', { name: `1.Camera`, exact: true }).waitFor({state: 'attached', timeout: 5000});
    //Смотрим что выключенных камер нет в списке
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
    //Ждем пока последняя камера не появится в списке:
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
    //Ждем пока в DOM добавится первая камера из списка
    await page.getByRole('button', { name: `Camera`, exact: true }).first().waitFor({state: 'attached', timeout: 5000});
    expect(await page.getByRole('button', { name: `Camera`, exact: true }).count()).toEqual(8);
    //Когда отключаем отображение ID, то и кнопка сортировки должна пропасть
    await expect(page.locator('[data-testid="at-sort-by-id"]')).toBeHidden();

    await page.locator('#at-top-menu-btn').click();
    await page.getByRole('menuitem', { name: 'Preferences' }).click();
    await page.getByLabel('Show device IDs').check();
    await page.locator('[role="dialog"] button:last-child').click();
    await page.getByRole('button', { name: `1.Camera`, exact: true }).waitFor({state: 'attached', timeout: 5000});
    expect(await page.getByRole('button', { name: `Camera`, exact: true }).count()).toEqual(0);
    await expect(page.locator('[data-testid="at-sort-by-id"]')).toBeVisible();
});


test('Reltime camera status change in list (CLOUD-T129)', async ({ page }) => {
    // await page.pause();
    await page.getByRole('button', { name: 'Hardware'}).click();

    await changeSingleCameraActiveStatus(Configuration.cameras[0].cameraBinding, false);
    await changeSingleCameraActiveStatus(Configuration.cameras[1].cameraBinding, false);
    await changeIPServerCameraActiveStatus(Configuration.cameras[4].videochannelID, false);
    await page.waitForTimeout(5000);
    //Проверяем подсветку выключенных/включенных одиночных и nvr-камер в списке
    for (let camera of Configuration.cameras) {
        if (camera.isActivated) {
            await expect(page.locator(`xpath=//*/p/span[text()='${camera.displayId}.${camera.displayName}']`)).toHaveCSS("color", "rgb(250, 250, 250)");
        } else {
            await expect(page.locator(`xpath=//*/p/span[text()='${camera.displayId}.${camera.displayName}']`)).not.toHaveCSS("color", "rgb(250, 250, 250)");
            //Включаем камеры обратно
            if (camera.isIpServer) {
                await changeIPServerCameraActiveStatus(camera.videochannelID, true);
            } else {
                await changeSingleCameraActiveStatus(camera.cameraBinding, true);
            }
        }
    };
    //Проверяем что все камеры отображаются как включенные
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

    //Проверяем текущую конфигурацию камер и меняем их ID/имена если они не совпадают с тестовым списком
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
    await page.locator('[data-testid="at-sort-by-name"]').click();
    
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(0)).toHaveText('5.5.Площадь', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(1)).toHaveText('5.1.Кабинет 1-эт', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(2)).toHaveText('5.3.undefined', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(3)).toHaveText('100.Smith & Wesson', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(4)).toHaveText('2.Device', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(5)).toHaveText('A.Camera', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(6)).toHaveText('4.221B Baker Street', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(7)).toHaveText(`5.11.!@#$%^&*()_+=?<'>""/|\\.,~:;`, { ignoreCase: false });

    await page.locator('[data-testid="at-sort-by-name"]').click();

    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(0)).toHaveText(`5.11.!@#$%^&*()_+=?<'>""/|\\.,~:;`, { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(1)).toHaveText('4.221B Baker Street', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(2)).toHaveText('A.Camera', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(3)).toHaveText('2.Device', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(4)).toHaveText('100.Smith & Wesson', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(5)).toHaveText('5.3.undefined', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(6)).toHaveText('5.1.Кабинет 1-эт', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(7)).toHaveText('5.5.Площадь', { ignoreCase: false });
});

test('Sort by ID (CLOUD-T134)', async ({ page }) => {
    // await page.pause();

    //Проверяем текущую конфигурацию камер и меняем их ID/имена если они не совпадают с тестовым списком
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
    
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(0)).toHaveText('2.Device', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(1)).toHaveText('4.221B Baker Street', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(2)).toHaveText('5.1.Кабинет 1-эт', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(3)).toHaveText('5.3.undefined', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(4)).toHaveText('5.5.Площадь', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(5)).toHaveText(`5.11.!@#$%^&*()_+=?<'>""/|\\.,~:;`, { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(6)).toHaveText('100.Smith & Wesson', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(7)).toHaveText('A.Camera', { ignoreCase: false });

    await page.locator('[data-testid="at-sort-by-id"]').click();

    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(0)).toHaveText('A.Camera', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(1)).toHaveText('100.Smith & Wesson', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(2)).toHaveText(`5.11.!@#$%^&*()_+=?<'>""/|\\.,~:;`, { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(3)).toHaveText('5.5.Площадь', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(4)).toHaveText('5.3.undefined', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(5)).toHaveText('5.1.Кабинет 1-эт', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(6)).toHaveText('4.221B Baker Street', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(7)).toHaveText('2.Device', { ignoreCase: false });

});

test('Sort by favorite (CLOUD-T132)', async ({ page }) => {
    // await page.pause();

    //Проверяем текущую конфигурацию камер и меняем их ID/имена если они не совпадают с тестовым списком
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
    //Наводимся на камеру 2.Device и делаем ее избранной
    await page.locator('[data-testid="at-camera-list-item"]').nth(0).hover();
    await page.locator('.camera-list [type="checkbox"]').nth(0).click();
    //Наводимся на камеру 5.3.undefined и делаем ее избранной
    await page.locator('[data-testid="at-camera-list-item"]').nth(3).hover();
    await page.locator('.camera-list [type="checkbox"]').nth(1).click();
    //Наводимся на камеру A.Camera и делаем ее избранной
    await page.locator('[data-testid="at-camera-list-item"]').nth(7).hover();
    await page.locator('.camera-list [type="checkbox"]').nth(2).click();
    //Сортируем по избранным
    await page.locator('[data-testid="at-favorites-checkbox"]').click();
    //Проверяем что в списке именно они
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(0)).toHaveText('2.Device', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(1)).toHaveText('5.3.undefined', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(2)).toHaveText('A.Camera', { ignoreCase: false });
    //Убираем избранность с камеры 5.3.undefined
    await page.locator('.camera-list [type="checkbox"]').nth(1).click();
    //Проверяем что в списке две камеры
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(0)).toHaveText('2.Device', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(1)).toHaveText('A.Camera', { ignoreCase: false });
    //Убираем сорировку и проверяем название последней камеры
    await page.locator('[data-testid="at-favorites-checkbox"]').click();
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(7)).toHaveText('A.Camera', { ignoreCase: false });
});

test('Sort by imported list (CLOUD-T135)', async ({ page }) => {
    // await page.pause();

    //Проверяем текущую конфигурацию камер и меняем их ID/имена если они не совпадают с тестовым списком
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
    //Загружаем xlsx файл
    await page.locator('#import-search-camlist-btn').setInputFiles('./test_data/example.xlsx');
    //Проверяем коректность списка
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(0)).toHaveText('4.221B Baker Street', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(1)).toHaveText('5.1.Кабинет 1-эт', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(2)).toHaveText('5.3.undefined', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(3)).toHaveText(`5.11.!@#$%^&*()_+=?<'>""/|\\.,~:;`, { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(4)).toHaveText('100.Smith & Wesson', { ignoreCase: false });
    //Проверяем что чекбоксы камер в списке активны
    for (let item of await page.locator('.camera-list [type="checkbox"]').all()) {
        expect(item.isChecked());
    }
    //Убираем сорировку и проверяем название последней камеры
    await page.locator('[data-testid="at-favorites-checkbox"]').click();
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(7)).toHaveText('A.Camera', { ignoreCase: false });
});

test('Search by partial match (CLOUD-T136)', async ({ page }) => {
    // await page.pause();
    
    //Проверяем текущую конфигурацию камер и меняем их ID/имена если они не совпадают с тестовым списком
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
    //Список значений для поиска
    let searchList = ["1B", "e", "Street", "DEV", "ка"];

    await page.getByRole('button', { name: 'Hardware'}).click();

    for (let input of searchList) {
        //Вписываем в поиск значение из тестового массива
        await page.locator('input[type="search"]').fill(input);
        //Ждем пока элемент загрузки списка появится и исчезнет из DOM
        await page.locator('[role="progressbar"]').waitFor({state: 'attached', timeout: 5000});
        await page.locator('[role="progressbar"]').waitFor({state: 'detached', timeout: 5000});
        //Считаем количество отображаемых камер в списке
        let camerasCount = await page.locator('[data-testid="at-camera-list-item"]').count();
        //Провяем необходимое количество камер в результатах поиска
        if (input === "e") {
            expect(camerasCount).toEqual(5);
        } else {
            expect(camerasCount).toEqual(1);
        }   
    }
});

test('Search by single ID (CLOUD-T137)', async ({ page }) => {
    // await page.pause();
    
    //Проверяем текущую конфигурацию камер и меняем их ID/имена если они не совпадают с тестовым списком
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
    //Список значений для поиска
    let searchList = ["4", "100", "100.", "5"];

    await page.getByRole('button', { name: 'Hardware'}).click();

    for (let input of searchList) {
        //Вписываем в поиск значение из тестового массива
        await page.locator('input[type="search"]').fill(input);
        //Ждем пока элемент загрузки списка появится и исчезнет из DOM
        await page.locator('[role="progressbar"]').waitFor({state: 'attached', timeout: 5000});
        await page.locator('[role="progressbar"]').waitFor({state: 'detached', timeout: 5000});
        //Считаем количество отображаемых камер в списке
        let camerasCount = await page.locator('[data-testid="at-camera-list-item"]').count();
        //Провяем необходимое количество камер в результатах поиска
        if (input === "5") {
            expect(camerasCount).toEqual(4);
        } else {
            expect(camerasCount).toEqual(1);
        }   
    }
});

test('Search by double ID (CLOUD-T764)', async ({ page }) => {
    // await page.pause();
    
    //Проверяем текущую конфигурацию камер и меняем их ID/имена если они не совпадают с тестовым списком
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
    //Список значений для поиска
    let searchList = ["5.1", "5.3", "5.5.", "5.11."];

    await page.getByRole('button', { name: 'Hardware'}).click();

    for (let input of searchList) {
        //Вписываем в поиск значение из тестового массива
        await page.locator('input[type="search"]').fill(input);
        //Ждем пока элемент загрузки списка появится и исчезнет из DOM
        await page.locator('[role="progressbar"]').waitFor({state: 'attached', timeout: 5000});
        await page.locator('[role="progressbar"]').waitFor({state: 'detached', timeout: 5000});
        //Считаем количество отображаемых камер в списке
        let camerasCount = await page.locator('[data-testid="at-camera-list-item"]').count();
        //Провяем необходимое количество камер в результатах поиска
        if (input === "5.1") {
            expect(camerasCount).toEqual(2);
        } else {
            expect(camerasCount).toEqual(1);
        }   
    }
});

test('Search by fullname, case sensitive (CLOUD-T762)', async ({ page }) => {
    // await page.pause();
    
    //Проверяем текущую конфигурацию камер и меняем их ID/имена если они не совпадают с тестовым списком
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
    //Список значений для поиска
    let searchList = ["221B Baker Street", "Device", "Кабинет 1-эт", "undefined"];

    await page.getByRole('button', { name: 'Hardware'}).click();

    for (let input of searchList) {
        //Вписываем в поиск значение из тестового массива
        await page.locator('input[type="search"]').fill(input);
        //Ждем пока элемент загрузки списка появится и исчезнет из DOM
        await page.locator('[role="progressbar"]').waitFor({state: 'attached', timeout: 5000});
        await page.locator('[role="progressbar"]').waitFor({state: 'detached', timeout: 5000});
        //Считаем количество отображаемых камер в списке
        let camerasCount = await page.locator('[data-testid="at-camera-list-item"]').count();
        //Провяем необходимое количество камер в результатах поиска
        expect(camerasCount).toEqual(1);
    }
});

test('Search by fullname, case insensitive (CLOUD-T763)', async ({ page }) => {
    // await page.pause();
    
    //Проверяем текущую конфигурацию камер и меняем их ID/имена если они не совпадают с тестовым списком
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
    //Список значений для поиска
    let searchList = ["221b baker street", "DEVICE", "camera"];

    await page.getByRole('button', { name: 'Hardware'}).click();

    for (let input of searchList) {
        //Вписываем в поиск значение из тестового массива
        await page.locator('input[type="search"]').fill(input);
        //Ждем пока элемент загрузки списка появится и исчезнет из DOM
        await page.locator('[role="progressbar"]').waitFor({state: 'attached', timeout: 5000});
        await page.locator('[role="progressbar"]').waitFor({state: 'detached', timeout: 5000});
        //Считаем количество отображаемых камер в списке
        let camerasCount = await page.locator('[data-testid="at-camera-list-item"]').count();
        //Провяем необходимое количество камер в результатах поиска
        expect(camerasCount).toEqual(1);
    }
});

test('Search by nonexistent camera (CLOUD-T139)', async ({ page }) => {
    // await page.pause();
    
    //Проверяем текущую конфигурацию камер и меняем их ID/имена если они не совпадают с тестовым списком
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
    //Список значений для поиска
    let searchList = ["200", "null", "nihill"];

    await page.getByRole('button', { name: 'Hardware'}).click();

    for (let input of searchList) {
        //Вписываем в поиск значение из тестового массива
        await page.locator('input[type="search"]').fill(input);
        //Ждем пока элемент загрузки списка появится и исчезнет из DOM
        await page.locator('[role="progressbar"]').waitFor({state: 'attached', timeout: 5000});
        await page.locator('[role="progressbar"]').waitFor({state: 'detached', timeout: 5000});
        //Считаем количество отображаемых камер в списке
        let camerasCount = await page.locator('[data-testid="at-camera-list-item"]').count();
        //Провяем необходимое количество камер в результатах поиска
        expect(camerasCount).toEqual(0);

    }
});

test('Search by special symbols (CLOUD-T138)', async ({ page }) => {
    test.skip();
    // await page.pause();
    
    //Проверяем текущую конфигурацию камер и меняем их ID/имена если они не совпадают с тестовым списком
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
    //Список значений для поиска
    let searchList = ["!", "@", "$", "%", "*", "^", "(", ")", "-", "_", "=", "?", "<", "'", ">", '"', "/", "|", "\\", ".", ",", "~", ":", ";", " ", "#", "+", "&"];

    await page.getByRole('button', { name: 'Hardware'}).click();

    for (let input of searchList) {
        //Вписываем в поиск значение из тестового массива
        await page.locator('input[type="search"]').fill(input);
        //Ждем пока элемент загрузки списка появится и исчезнет из DOM
        await page.locator('[role="progressbar"]').waitFor({state: 'attached', timeout: 5000});
        await page.locator('[role="progressbar"]').waitFor({state: 'detached', timeout: 5000});
        //Считаем количество отображаемых камер в списке
        let camerasCount = await page.locator('[data-testid="at-camera-list-item"]').count();
        //Провяем необходимое количество камер в результатах поиска
        switch(input) {
            case "&":
                expect(camerasCount).toEqual(2);
                break;
            case " ":
                expect(camerasCount).toEqual(3);
                break;
            case ".":
                expect(camerasCount).toEqual(8);
                break;
            default:
                expect(camerasCount).toEqual(1);

        }
    }
});

test('Camera list with gruops (CLOUD-T140)', async ({ page }) => {
    // await page.pause();
    
    //Проверяем текущую конфигурацию камер и меняем их ID/имена если они не совпадают с тестовым списком
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

    await groupAnnihilator();
    let first = await createGroup("First");
    let second = await createGroup("Second");
    let subfirst = await createGroup("Subfirst", first);

    await addCameraToGroup(first, [Configuration.cameras[0].accessPoint, Configuration.cameras[3].accessPoint, Configuration.cameras[7].accessPoint, Configuration.cameras[5].accessPoint,]);
    await addCameraToGroup(subfirst, [Configuration.cameras[0].accessPoint, Configuration.cameras[5].accessPoint, Configuration.cameras[6].accessPoint,]);
    await addCameraToGroup(second, [Configuration.cameras[1].accessPoint, Configuration.cameras[2].accessPoint, Configuration.cameras[4].accessPoint,]);

    const responsePromise = page.waitForResponse(request => request.url().includes(`${currentURL}/group`));
    await page.reload();
    await responsePromise;
    //await setObjectPermissions("New_Role", [Configuration.cameras[0].accessPoint, Configuration.cameras[1].accessPoint, Configuration.cameras[6].accessPoint, Configuration.cameras[7].accessPoint], "CAMERA_ACCESS_FORBID");

    await page.getByRole('button', { name: 'Hardware'}).click();
    await expect(page.locator('[id="at-groups-list"]')).toHaveText('Default', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(0)).toHaveText('2.Device', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(7)).toHaveText('A.Camera', { ignoreCase: false });
    expect(await page.locator('[data-testid="at-camera-list-item"]').count()).toEqual(8);
    
    await page.locator('[id="at-groups-list"]').click();
    await page.getByRole('button', { name: "First", exact: true }).click();
    await expect(page.locator('[id="at-groups-list"]')).toHaveText('First', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(0)).toHaveText('4.221B Baker Street', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(3)).toHaveText('100.Smith & Wesson', { ignoreCase: false });
    expect(await page.locator('[data-testid="at-camera-list-item"]').count()).toEqual(4);

    await page.locator('[id="at-groups-list"]').click();
    await page.getByRole('button', { name: "Second", exact: true }).click();
    await expect(page.locator('[id="at-groups-list"]')).toHaveText('Second', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(0)).toHaveText('2.Device', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(2)).toHaveText('A.Camera', { ignoreCase: false });
    expect(await page.locator('[data-testid="at-camera-list-item"]').count()).toEqual(3);

    await page.locator('[id="at-groups-list"]').click();
    await page.getByRole('button', { name: "First > Subfirst", exact: true }).click();
    await expect(page.locator('[id="at-groups-list"]')).toHaveText('Subfirst', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(0)).toHaveText('5.1.Кабинет 1-эт', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(2)).toHaveText('100.Smith & Wesson', { ignoreCase: false });
    expect(await page.locator('[data-testid="at-camera-list-item"]').count()).toEqual(3);

    await page.locator('[id="at-groups-list"]').click();
    await page.getByRole('button', { name: "Default", exact: true }).click();
    await expect(page.locator('[id="at-groups-list"]')).toHaveText('Default', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(0)).toHaveText('2.Device', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(7)).toHaveText('A.Camera', { ignoreCase: false });
    expect(await page.locator('[data-testid="at-camera-list-item"]').count()).toEqual(8);

});

test('Access to group panel check (CLOUD-T503)', async ({ page }) => {
    // await page.pause();
    
    //Проверяем текущую конфигурацию камер и меняем их ID/имена если они не совпадают с тестовым списком
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

    if (Configuration.groups.length == 0) {
        let extra = await createGroup("Extra");
        await addCameraToGroup(extra, [Configuration.cameras[0].accessPoint, Configuration.cameras[3].accessPoint,]);
    }

    await setRolePermissions("New_Role", userWithoutGroupPanel);

    await page.locator('#at-top-menu-btn').click();
    await page.getByRole('menuitem', { name: 'Change user' }).click();
    await page.getByLabel('Login').fill('User_1');
    await page.getByLabel('Password').fill('123');
    await page.getByLabel('Password').press('Enter');

    await expect(page.locator('[id="at-groups-list"]')).toBeHidden();
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(0)).toHaveText('2.Device', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(7)).toHaveText('A.Camera', { ignoreCase: false });
    expect(await page.locator('[data-testid="at-camera-list-item"]').count()).toEqual(8);
});

test('Access to cameras (CLOUD-T141)', async ({ page }) => {
    // await page.pause();
    
    //Проверяем текущую конфигурацию камер и меняем их ID/имена если они не совпадают с тестовым списком
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
    
    await setObjectPermissions("New_Role", [Configuration.cameras[0].accessPoint, Configuration.cameras[1].accessPoint, Configuration.cameras[6].accessPoint, Configuration.cameras[7].accessPoint], "CAMERA_ACCESS_FORBID");

    await page.locator('#at-top-menu-btn').click();
    await page.getByRole('menuitem', { name: 'Change user' }).click();
    await page.getByLabel('Login').fill('User_1');
    await page.getByLabel('Password').fill('123');
    await page.getByLabel('Password').press('Enter');
    
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(0)).toHaveText('4.221B Baker Street', { ignoreCase: false });
    await expect(page.locator('[data-testid="at-camera-list-item"]').nth(3)).toHaveText('A.Camera', { ignoreCase: false });
    expect(await page.locator('[data-testid="at-camera-list-item"]').count()).toEqual(4);

});

test('Camrera panel width saving after reload (CLOUD-T716)', async ({ page }) => {
    // await page.pause();
    await page.getByRole('button', { name: 'Hardware' }).click();
    await page.locator('.camera-list [role=none]').hover();
    await page.mouse.down();
    await page.mouse.move(400, 0);
    await page.mouse.up();
    await page.getByRole('button', { name: 'Hardware' }).click();
    await page.reload();
    await page.getByRole('button', { name: 'Hardware' }).click();
    await page.waitForTimeout(1000);
    //Берем размер панели из локалстораджа
    let listWidth = await page.evaluate(() => window.localStorage.getItem('cameraList'));
    //Сравниваем размер панели с тем что мы ранее двигали до 400px
    expect(Number(listWidth) == 400).toBeTruthy();
    //На всякий случай сравниваем реальный размер панели в UI с ожидаемым
    let realWidth = await page.locator('.camera-list>div>div').boundingBox();
    expect(Number(realWidth?.width) === 400).toBeTruthy();

    await page.locator('.camera-list [role=none]').hover();
    await page.mouse.down();
    await page.mouse.move(250, 0);
    await page.mouse.up();
    await page.getByRole('button', { name: 'Hardware' }).click();
    await page.reload();
    await page.getByRole('button', { name: 'Hardware' }).click();
    await page.waitForTimeout(1000);
    listWidth = await page.evaluate(() => window.localStorage.getItem('cameraList'));
    realWidth = await page.locator('.camera-list>div>div').boundingBox();
    expect(Number(realWidth?.width) == 250).toBeTruthy();
    expect(Number(listWidth) == 250).toBeTruthy();
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