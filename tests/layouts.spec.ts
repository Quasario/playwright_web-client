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

test.describe("Tests without created layout", () => {

    test.beforeAll(async () => {
        await getHostName();
        await configurationCollector();
        await deleteArchive('Black');
        await cameraAnnihilator("all");
        await layoutAnnihilator("all");
        await createCamera(8, "AxxonSoft", "Virtual several streams", "admin", "admin", "0.0.0.0", "80", "", "Camera", 0);
        await createCamera(2, "AxxonSoft", "Virtual IP server", "admin123", "admin", "0.0.0.0", "80", "", "Camera");
        await addVirtualVideo(Configuration.cameras, "lprusa", "tracker");
        await createArchive("Black");
        await createArchiveVolume("Black", 20);
        let cameraEndpoints = Configuration.cameras.map(item => item.accessPoint);
        await createArchiveContext("Black", cameraEndpoints, false);
        cameras = Configuration.cameras.map(item => { return ({
            id: item.displayId,
            name: item.displayName  
        })});
    
        console.log(cameras);
        // console.log(Configuration);
    });
    
    test.beforeEach(async ({ page }) => {
        await layoutAnnihilator("all");
        await page.goto(currentURL);
        await page.getByLabel('Login').fill('root');
        await page.getByLabel('Password').fill('root');
        await page.getByLabel('Password').press('Enter');
    });
    
    
    test('Creation of x1 layout (CLOUD-T229)', async ({ page }) => {
        // await page.pause();
    
        await page.locator('#at-layout-menu').click();
        await page.locator('[title="1\u00D71"]').click();
        //Проверяем, что ячейка содержит нужную камеру
        await expect (page.locator('[data-testid="at-camera-title"]').nth(0)).toHaveText(`${cameras[0].id}.${cameras[0].name}`);
        //Сохраняем раскладку
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Проверяем количество ячеек в созданной раскладке
        expect (await page.locator('[data-testid="at-camera-title"]').count()).toEqual(1);
        //Проверяем имя созданной раскладки
        await expect (page.locator('#at-layout-item-0')).toContainText("New Layout");
        //Проверяем название и разрешение камеры
        await expect (page.locator('[data-testid="at-camera-title"]').nth(0)).toHaveText(`${cameras[0].id}.${cameras[0].name}`);
        await expect (page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(0)).toContainText("Auto");
    });
    
    
    test('Creation of x4 layout (CLOUD-T230)', async ({ page }) => {
        // await page.pause();
    
        await page.locator('#at-layout-menu').click();
        await page.locator('[title="2\u00D72"]').click();
        //Проверяем, что ячейки содержат нужные камеры
        await expect (page.locator('[data-testid="at-camera-title"]').nth(0)).toHaveText(`${cameras[0].id}.${cameras[0].name}`);
        await expect (page.locator('[data-testid="at-camera-title"]').nth(1)).toHaveText(`${cameras[1].id}.${cameras[1].name}`);
        await expect (page.locator('[data-testid="at-camera-title"]').nth(2)).toHaveText(`${cameras[2].id}.${cameras[2].name}`);
        await expect (page.locator('[data-testid="at-camera-title"]').nth(3)).toHaveText(`${cameras[3].id}.${cameras[3].name}`);
        //Сохраняем раскладку
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Проверяем количество ячеек в созданной раскладке
        expect (await page.locator('[data-testid="at-camera-title"]').count()).toEqual(4);
        //Проверяем имя созданной раскладки
        await expect (page.locator('#at-layout-item-0')).toContainText("New Layout");
        //Проверяем названия и разрешения камер
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
        //Проверяем, что ячейки по диагонали содержат нужные камеры
        await expect (page.locator('[data-testid="at-camera-title"]').nth(0)).toHaveText(`${cameras[0].id}.${cameras[0].name}`);
        await expect (page.locator('[data-testid="at-camera-title"]').nth(4)).toHaveText(`${cameras[4].id}.${cameras[4].name}`);
        await expect (page.locator('[data-testid="at-camera-title"]').nth(8)).toHaveText(`${cameras[8].id}.${cameras[8].name}`);
        //Сохраняем раскладку
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Проверяем количество ячеек в созданной раскладке
        expect (await page.locator('[data-testid="at-camera-title"]').count()).toEqual(9);
        //Проверяем имя созданной раскладки
        await expect (page.locator('#at-layout-item-0')).toContainText("New Layout");
        //Проверяем названия и разрешения камер по диагонали
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
        //Проверяем, что ячейки по диагонали содержат нужные камеры
        await expect (page.locator('[data-testid="at-camera-title"]').nth(0)).toHaveText(`${cameras[0].id}.${cameras[0].name}`);
        await expect (page.locator('[data-testid="at-camera-title"]').nth(5)).toHaveText(`${cameras[5].id}.${cameras[5].name}`);
        await expect (page.locator('[data-testid="at-camera-title"]').nth(10)).toHaveText(`${cameras[10].id}.${cameras[10].name}`);
        await expect (page.locator('[data-testid="at-camera-title"]').nth(15)).toHaveText(`${cameras[15].id}.${cameras[15].name}`);
        //Сохраняем раскладку
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Проверяем количество ячеек в созданной раскладке
        expect (await page.locator('[data-testid="at-camera-title"]').count()).toEqual(16);
        //Проверяем имя созданной раскладки
        await expect (page.locator('#at-layout-item-0')).toContainText("New Layout");
        //Проверяем названия и разрешения камер по диагонали
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
        //Наводимся на первую камеру и расширяем ее вправо
        await page.locator('[role="gridcell"][tabindex="0"]').hover();
        await page.locator('[role="gridcell"][tabindex="0"] [role="group"]:nth-child(3) button:nth-child(1)').click(); // СДЕЛАТЬ ЛОКАТОРЫ
        //Проверяем что ячейка справа исчезла
        await expect (page.locator('[role="gridcell"][tabindex="1"]')).toBeHidden();
        //Расширяем первую ячейку вниз
        await page.locator('[role="gridcell"][tabindex="0"] [role="group"]:nth-child(4) button:nth-child(1)').click();
        //Проверяем что ячейки 4 и 5 исчезли
        await expect (page.locator('[role="gridcell"][tabindex="3"]')).toBeHidden();
        await expect (page.locator('[role="gridcell"][tabindex="4"]')).toBeHidden();
        //Наводимся на последнюю камеру и расширяем ее вверх
        await page.locator('[role="gridcell"][tabindex="8"]').hover();
        await page.locator('[role="gridcell"][tabindex="8"] [role="group"]:nth-child(2) button:nth-child(1)').click();
        //Проверяем что ячейка 6 исчезла
        await expect (page.locator('[role="gridcell"][tabindex="5"]')).toBeHidden();
        //Наводимся на предпоследнюю камеру и расширяем ее влево
        await page.locator('[role="gridcell"][tabindex="7"]').hover();
        await page.locator('[role="gridcell"][tabindex="7"] [role="group"]:nth-child(1) button:nth-child(1)').click();
        //Проверяем что ячейка 7 исчезла
        await expect (page.locator('[role="gridcell"][tabindex="6"]')).toBeHidden();
        //Возвращаем расщиренную ячейку в начальное состояние
        await page.locator('[role="gridcell"][tabindex="7"] [role="group"]:nth-child(1) button:nth-child(2)').click();
        //Проверяем что в замещенной ячейке теперь сообщение
        await expect (page.getByText("Drag camera here")).toBeVisible();
        //Сохраняем раскладку
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        expect (await page.locator('[data-testid="at-camera-title"]').count()).toEqual(4);
    });
    
    
    test('Cells deleting (CLOUD-T234)', async ({ page }) => {
        // await page.pause();
    
        await page.locator('#at-layout-menu').click();
        await page.locator('[title="3\u00D73"]').click();
        //Удаляем первую ячейку
        await page.locator('[role="gridcell"][tabindex="0"]').hover();
        await page.locator('[role="gridcell"][tabindex="0"] button').last().click(); // СДЕЛАТЬ ЛОКАТОРЫ
        await expect (page.locator('[role="gridcell"][tabindex="0"] h6')).toHaveText("Drag camera here");
        //Удаляем ячейку посередине
        await page.locator('[role="gridcell"][tabindex="4"]').hover();
        await page.locator('[role="gridcell"][tabindex="4"] button').last().click(); // СДЕЛАТЬ ЛОКАТОРЫ
        await expect (page.locator('[role="gridcell"][tabindex="4"] h6')).toHaveText("Drag camera here");
        //Удаляем последнюю ячейку
        await page.locator('[role="gridcell"][tabindex="8"]').hover();
        await page.locator('[role="gridcell"][tabindex="8"] button').last().click(); // СДЕЛАТЬ ЛОКАТОРЫ
        await expect (page.locator('[role="gridcell"][tabindex="8"] h6')).toHaveText("Drag camera here");
        //Удаляем правый столбец
        await page.locator('[role="gridcell"][tabindex="2"]').hover();
        await page.locator('[role="gridcell"][tabindex="2"] button').last().click(); // СДЕЛАТЬ ЛОКАТОРЫ
        await page.locator('[role="gridcell"][tabindex="5"]').hover();
        await page.locator('[role="gridcell"][tabindex="5"] button').last().click(); // СДЕЛАТЬ ЛОКАТОРЫ
        //Проверяем, что последняя удаленная ячейка не отображается
        await expect (page.locator('[role="gridcell"][tabindex="5"]')).toBeHidden();
        //Удаляем нижний ряд
        await page.locator('[role="gridcell"][tabindex="7"]').hover();
        await page.locator('[role="gridcell"][tabindex="7"] button').last().click(); // СДЕЛАТЬ ЛОКАТОРЫ
        await page.locator('[role="gridcell"][tabindex="6"]').hover();
        await page.locator('[role="gridcell"][tabindex="6"] button').last().click(); // СДЕЛАТЬ ЛОКАТОРЫ
        //Проверяем, что последняя удаленная ячейка не отображается
        await expect (page.locator('[role="gridcell"][tabindex="6"]')).toBeHidden();
        //Сохраняем раскладку
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
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
        //Сохраняем раскладку
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        expect (await page.locator('[data-testid="at-camera-title"]').count()).toEqual(2);
    });
    
    test('Undo layout changings (CLOUD-T237)', async ({ page }) => {
        // await page.pause();
        await page.locator('#at-layout-menu').click();
        await page.locator('[title="3\u00D73"]').click();
        //В момент создания раскладки есть некая анимация, если ее не дождаться и сразу начать добавлять ячейки, то боковые панели съезжают
        await page.waitForTimeout(500);
        //Удаляем две ячейки
        await page.locator('[role="gridcell"][tabindex="2"]').hover();
        await page.locator('[role="gridcell"][tabindex="2"] button').last().click(); // СДЕЛАТЬ ЛОКАТОРЫ
        await page.locator('[role="gridcell"][tabindex="5"]').hover();
        await page.locator('[role="gridcell"][tabindex="5"] button').last().click();
        //Проверяем что в последней ячейке есть сообщение
        await expect (page.locator('[role="gridcell"][tabindex="5"] h6')).toHaveText("Drag camera here");
        await expect (page.locator('[role="gridcell"][tabindex="5"] .VideoCell__video')).toBeHidden();
        //Отменяем удаление последней ячейки и проверяем что в ней идет видео
        await page.locator('.layout [role="group"] button').nth(1).click(); // СДЕЛАТЬ ЛОКАТОРЫ
        await expect (page.locator('[role="gridcell"][tabindex="5"] h6')).toBeHidden();
        await expect (page.locator('[role="gridcell"][tabindex="5"] .VideoCell__video')).toBeVisible();
        //Переключаем разрешение на первой и второй ячейках
        await page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(0).click();
        await page.locator('[role="listbox"] [data-value="CAMERA_STREAM_RESOLUTION_HIGH"]').click();
        await expect (page.locator('[role="gridcell"][tabindex="0"]')).toContainText("High");
        await page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(0).click();
        await page.locator('[role="listbox"] [data-value="CAMERA_STREAM_RESOLUTION_LOW"]').click();
        await expect (page.locator('[role="gridcell"][tabindex="1"]')).toContainText("Low");
        //Дважды отменяем изменения
        await page.locator('.layout [role="group"] button').nth(1).click();
        await expect (page.locator('[role="gridcell"][tabindex="1"]')).toContainText("Auto");
        await page.locator('.layout [role="group"] button').nth(1).click();
        await expect (page.locator('[role="gridcell"][tabindex="0"]')).toContainText("Auto");
        //Возвращаем отмененное изменение один раз
        await page.locator('.layout [role="group"] button').nth(2).click();
        await expect (page.locator('[role="gridcell"][tabindex="0"]')).toContainText("High");
        await expect (page.locator('[role="gridcell"][tabindex="1"]')).toContainText("Auto");
        //Расширяем первую камеру вправо
        await page.locator('[role="gridcell"][tabindex="0"]').hover();
        await page.locator('[role="gridcell"][tabindex="0"] [role="group"]:nth-child(3) button:nth-child(1)').click(); // СДЕЛАТЬ ЛОКАТОРЫ
        //Проверяем что вторая ячейка исчезла
        await expect (page.locator('[role="gridcell"][tabindex="1"]')).toBeHidden();
        //Отменяем изменение
        await page.locator('.layout [role="group"] button').nth(1).click();
        //Проверяем что вернулась и в ней идет видео
        await expect (page.locator('[role="gridcell"][tabindex="1"]')).toBeVisible();
        await expect (page.locator('[role="gridcell"][tabindex="1"] .VideoCell__video')).toBeVisible();
        //Возвращаем изменения
        await page.locator('.layout [role="group"] button').nth(2).click();
        await expect (page.locator('[role="gridcell"][tabindex="1"]')).toBeHidden();
        //Сохраняем раскладку
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        expect (await page.locator('[data-testid="at-camera-title"]').count()).toEqual(7);
    });
    
    test('Add cameras to cells (CLOUD-T238)', async ({ page }) => {
        // await page.pause();
        await page.locator('#at-layout-menu').click();
        await page.locator('[title="3\u00D73"]').click();
        //В момент создания раскладки есть некая анимация, если ее не дождаться и сразу начать добавлять ячейки, то боковые панели съезжают
        await page.waitForTimeout(500);
        //Добавляем столбец справа
        await page.locator('.layout > div:last-child > button').nth(2).click(); // СДЕЛАТЬ ЛОКАТОРЫ
        //Удаляем две ячейки
        await page.locator('[role="gridcell"][tabindex="2"]').hover();
        await page.locator('[role="gridcell"][tabindex="2"] button').last().click(); // СДЕЛАТЬ ЛОКАТОРЫ
        await page.locator('[role="gridcell"][tabindex="5"]').hover();
        await page.locator('[role="gridcell"][tabindex="5"] button').last().click();
    
        //Проверяем открыта ли панель с камерами, и открываем если нет
        if (!(await isCameraListOpen(page))) {
            await page.getByRole('button', { name: 'Hardware'}).click();
        }
    
        //Получаем координаты ячеек для добавляения, чтобы потом перетащить туда камеры
        let cellIDs = [2, 5, 9, 10, 11];
        let cellsCoorinates = Array();
        if (await isCameraListOpen(page)){
            for (let cameraId of cellIDs) {
                let coordinates = await page.locator(`[role="gridcell"][tabindex="${cameraId}"]`).boundingBox();
                if (coordinates === null) {
                    test.fail();
                } else {
                    cellsCoorinates.push(coordinates);
                }
            }
        }
    
        //Добавляем камеры в ячейки
        for (let i = 9; i < 14; i++) {
            await page.locator('[data-testid="at-camera-list-item"]').nth(i).hover();
            await page.mouse.down();
            await page.mouse.move(cellsCoorinates[i-9]!.x + cellsCoorinates[i-9]!.width / 2, cellsCoorinates[i-9]!.y + cellsCoorinates[i-9]!.height / 2);
            await page.mouse.up();
        }
        //Проверяем что в добавленных ячейках есть видео
        await expect (page.locator('[role="gridcell"][tabindex="2"] .VideoCell__video')).toBeVisible();
        await expect (page.locator('[role="gridcell"][tabindex="5"] .VideoCell__video')).toBeVisible();
        await expect (page.locator('[role="gridcell"][tabindex="9"] .VideoCell__video')).toBeVisible();
        await expect (page.locator('[role="gridcell"][tabindex="10"] .VideoCell__video')).toBeVisible();
        await expect (page.locator('[role="gridcell"][tabindex="11"] .VideoCell__video')).toBeVisible();
        //Сохраняем раскладку
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        expect (await page.locator('[data-testid="at-camera-title"]').count()).toEqual(12);
    });
    
    test('Changing cells streams (CLOUD-T239)', async ({ page }) => {
        // await page.pause();
        await page.locator('#at-layout-menu').click();
        await page.locator('[title="3\u00D73"]').click();
    
        //Переключаем потоки раскладок - первый ряд High, второй Low, третий остаётся Auto
        for (let i = 0; i < 6; i++) {
            if (i < 3) {
                await page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(0).click();
                await page.locator('[role="listbox"] [data-value="CAMERA_STREAM_RESOLUTION_HIGH"]').click();
            } else if (i < 6) {
                await page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(0).click();
                await page.locator('[role="listbox"] [data-value="CAMERA_STREAM_RESOLUTION_LOW"]').click();
            }
        }
    
        //Проверяем что все камеры имеют нужный поток
        for (let i = 0; i < 9; i++) {
            if (i < 3) {
                await expect (page.locator(`[role="gridcell"][tabindex="${i}"]`)).toContainText("High"); 
            } else if (i < 6) {
                await expect (page.locator(`[role="gridcell"][tabindex="${i}"]`)).toContainText("Low");
            } else if (i < 9) {
                await expect (page.locator(`[role="gridcell"][tabindex="${i}"]`)).toContainText("Auto");
            }
        }
    
        //Проверяем цифры на верхней панели с кнопками, отражающие сколько камер принадлежат конкретному потоку
        await expect (page.locator(`header [role="group"]>span:nth-child(1)`)).toContainText("3");
        await expect (page.locator(`header [role="group"]>span:nth-child(2)`)).toContainText("3");
        await expect (page.locator(`header [role="group"]>span:nth-child(3)`)).toContainText("3");
    
        //Сохраняем раскладку
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
    
        //Снова проверяем что все камеры имеют нужный поток
        for (let i = 0; i < 9; i++) {
            if (i < 3) {
                await expect (page.locator(`[role="gridcell"][tabindex="${i}"]`)).toContainText("High");
            } else if (i < 6) {
                await expect (page.locator(`[role="gridcell"][tabindex="${i}"]`)).toContainText("Low");
            } else if (i < 9) {
                await expect (page.locator(`[role="gridcell"][tabindex="${i}"]`)).toContainText("Auto");
            }
        }
    
        //Перезагружаем страницу и вновь проверяем потоки камер
        await page.reload();
        for (let i = 0; i < 9; i++) {
            if (i < 3) {
                await expect (page.locator(`[role="gridcell"][tabindex="${i}"]`)).toContainText("High");
            } else if (i < 6) {
                await expect (page.locator(`[role="gridcell"][tabindex="${i}"]`)).toContainText("Low");
            } else if (i < 9) {
                await expect (page.locator(`[role="gridcell"][tabindex="${i}"]`)).toContainText("Auto");
            }
        }
    });    
})

test.describe("Tests with created layout", () => {
    //эту раскладку удалять будем только после всех тестов
    let stableLayout
    
    test.beforeAll(async () => {
        await getHostName();
        await configurationCollector();
        await layoutAnnihilator("all");
        cameras = Configuration.cameras.map(item => { return ({
            id: item.displayId,
            name: item.displayName  
        })});
        
        stableLayout = await createLayout(Configuration.cameras, 2, 2, "Test Layout");
    });
    
    test.beforeEach(async ({ page }) => {
        await configurationCollector("layouts");
        console.log(Configuration.layouts);
        let deleteCreatedLayouts = Configuration.layouts.filter(item => item.meta.layout_id != stableLayout);
        console.log(deleteCreatedLayouts);
        await layoutAnnihilator(deleteCreatedLayouts);
        await page.goto(currentURL);
        await page.getByLabel('Login').fill('root');
        await page.getByLabel('Password').fill('root');
        await page.getByLabel('Password').press('Enter');
    });

    test('Check positions in menu (CLOUD-T350)', async ({ page }) => {
        
        // await page.pause();
        await page.locator('#at-layout-menu').click();
        await page.locator('[title="2\u00D72"]').click();
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Проверяем пункты в меню веб-клиентовской раскладки
        await page.locator('#at-layout-menu').click();
        await expect (page.locator('[tabindex="-1"][role="menuitem"]').nth(1)).toHaveText('Delete/Reorder layouts');
        await expect (page.locator('[tabindex="-1"][role="menuitem"]').nth(2)).toHaveText('Edit layout');
        await expect (page.locator('[tabindex="-1"][role="menuitem"]').nth(3)).toHaveText('Copy layout');
        await expect (page.locator('[tabindex="-1"][role="menuitem"]').nth(4)).toHaveText('Use by default');
        //Закрываем меню
        await page.keyboard.press('Escape');
        //Проверяем пункты в меню GUI раскладки
        await page.locator('#at-layout-expand').click();
        await page.waitForTimeout(1000); //Таймаут нужен так как ниже при клике игнорируется видимость элемента через флаг forсe, это нужно так как элемент aria-disabled="true"
        await page.locator('#at-layout-item-1').click({force: true});
        await page.locator('#at-layout-menu').click();
        await expect (page.locator('[tabindex="-1"][role="menuitem"]').nth(1)).toHaveText('Delete/Reorder layouts');
        await expect (page.locator('[tabindex="-1"][role="menuitem"]').nth(2)).toHaveText('Edit layout');
        await expect (page.locator('[tabindex="-1"][role="menuitem"]').nth(3)).toHaveText('Copy layout');
        await expect (page.locator('[tabindex="-1"][role="menuitem"]').nth(4)).toHaveText('Use by default');
    });

    test('Pick default layout (CLOUD-T351)', async ({ page }) => {
        
        // await page.pause();
        //Создаем x9 раскладку
        await page.locator('#at-layout-menu').click();
        await page.locator('[title="3\u00D73"]').click();
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Создаем x1 раскладку
        await page.locator('#at-layout-menu').click();
        await page.locator('[title="1\u00D71"]').click();
        requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Назначаем раскладку 3 дефолтной
        await page.locator('#at-layout-expand').click();
        await page.waitForTimeout(1000); //Таймаут нужен так как ниже при клике игнорируется видимость элемента через флаг forсe, это нужно так как элемент aria-disabled="true"
        await page.locator('#at-layout-item-2').click({force: true});
        await page.locator('[data-testid="at-camera-title"]').nth(0).waitFor({state: 'attached', timeout: 5000});
        expect (await page.locator('[data-testid="at-camera-title"]').count()).toEqual(4);
        await page.locator('#at-layout-menu').click();
        await page.getByRole('menuitem', { name: 'Use by default', exact: true }).click();
        //Проверяем что появилась иконка
        await page.locator('#at-layout-expand').click();
        await expect (page.locator('#at-layout-item-0 svg').nth(0)).toBeHidden();
        await expect (page.locator('#at-layout-item-1 svg').nth(0)).toBeHidden();
        await expect (page.locator('#at-layout-item-2 svg').nth(0)).toBeVisible();
        //Перезагружаем страницу и проверяем, что открылась нужная раскладка (по количеству камер) и что иконка дефолтности висит на раскладке 3
        await page.reload();
        await page.locator('[data-testid="at-camera-title"]').nth(0).waitFor({state: 'attached', timeout: 5000});
        expect (await page.locator('[data-testid="at-camera-title"]').count()).toEqual(4);
        await page.locator('#at-layout-expand').click();
        await expect (page.locator('#at-layout-item-0 svg').nth(0)).toBeHidden();
        await expect (page.locator('#at-layout-item-1 svg').nth(0)).toBeHidden();
        await expect (page.locator('#at-layout-item-2 svg').nth(0)).toBeVisible();
        //Назначаем раскладку 2 дефолтной
        await page.waitForTimeout(1000); //Таймаут нужен так как ниже при клике игнорируется видимость элемента через флаг forсe, это нужно так как элемент aria-disabled="true"
        await page.locator('#at-layout-item-1').click({force: true});
        await page.locator('[data-testid="at-camera-title"]').nth(0).waitFor({state: 'attached', timeout: 5000});
        expect (await page.locator('[data-testid="at-camera-title"]').count()).toEqual(9);
        await page.locator('#at-layout-menu').click();
        await page.getByRole('menuitem', { name: 'Use by default', exact: true }).click();
        await page.locator('#at-layout-expand').click();
        //Проверяем что появилась иконка над второй раскладкой
        await expect (page.locator('#at-layout-item-0 svg').nth(0)).toBeHidden();
        await expect (page.locator('#at-layout-item-1 svg').nth(0)).toBeVisible();
        await expect (page.locator('#at-layout-item-2 svg').nth(0)).toBeHidden();
        //Перезагружаем страницу и проверяем, что открылась нужная раскладка (по количеству камер) и что иконка дефолтности висит на раскладке 2
        await page.reload();
        await page.locator('[data-testid="at-camera-title"]').nth(0).waitFor({state: 'attached', timeout: 5000});
        expect (await page.locator('[data-testid="at-camera-title"]').count()).toEqual(9);
        await page.locator('#at-layout-expand').click();
        await expect (page.locator('#at-layout-item-0 svg').nth(0)).toBeHidden();
        await expect (page.locator('#at-layout-item-1 svg').nth(0)).toBeVisible();
        await expect (page.locator('#at-layout-item-2 svg').nth(0)).toBeHidden();
        //Снимаем дефолтность со второй раскладки
        await page.locator('#at-layout-menu').click();
        await page.getByRole('menuitem', { name: 'Do not use by default', exact: true }).click();
        await page.locator('#at-layout-expand').click();
        //Проверяем, что иконка дефолтности скрыта
        await expect (page.locator('#at-layout-item-0 svg').nth(0)).toBeHidden();
        await expect (page.locator('#at-layout-item-1 svg').nth(0)).toBeHidden();
        await expect (page.locator('#at-layout-item-2 svg').nth(0)).toBeHidden();
        //Перезагружаем страницу и проверяем что открылась первая раскладка
        await page.reload();
        await page.locator('[data-testid="at-camera-title"]').nth(0).waitFor({state: 'attached', timeout: 5000});
        expect (await page.locator('[data-testid="at-camera-title"]').count()).toEqual(1);
    });

})

