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
import { isCameraListOpen, getCameraList, cameraAnnihilator, layoutAnnihilator, groupAnnihilator, configurationCollector, userAnnihilator, roleAnnihilator, waitAnimationEnds } from "../utils/utils.js";

//Список названий/ID камер в конфигурации
let cameras: any;

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
        await expect(page.locator('[data-testid="at-camera-title"]').nth(0)).toHaveText(`${cameras[0].id}.${cameras[0].name}`);
        //Сохраняем раскладку
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Проверяем количество ячеек в созданной раскладке
        expect(await page.locator('[data-testid="at-camera-title"]').count()).toEqual(1);
        //Проверяем имя созданной раскладки
        await expect(page.locator('#at-layout-item-0')).toContainText("New Layout");
        //Проверяем название и разрешение камеры
        await expect(page.locator('[data-testid="at-camera-title"]').nth(0)).toHaveText(`${cameras[0].id}.${cameras[0].name}`);
        await expect(page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(0)).toContainText("Auto");
    });
    
    
    test('Creation of x4 layout (CLOUD-T230)', async ({ page }) => {
        // await page.pause();
    
        await page.locator('#at-layout-menu').click();
        await page.locator('[title="2\u00D72"]').click();
        //Проверяем, что ячейки содержат нужные камеры
        await expect(page.locator('[data-testid="at-camera-title"]').nth(0)).toHaveText(`${cameras[0].id}.${cameras[0].name}`);
        await expect(page.locator('[data-testid="at-camera-title"]').nth(1)).toHaveText(`${cameras[1].id}.${cameras[1].name}`);
        await expect(page.locator('[data-testid="at-camera-title"]').nth(2)).toHaveText(`${cameras[2].id}.${cameras[2].name}`);
        await expect(page.locator('[data-testid="at-camera-title"]').nth(3)).toHaveText(`${cameras[3].id}.${cameras[3].name}`);
        //Сохраняем раскладку
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Проверяем количество ячеек в созданной раскладке
        expect(await page.locator('[data-testid="at-camera-title"]').count()).toEqual(4);
        //Проверяем имя созданной раскладки
        await expect (page.locator('#at-layout-item-0')).toContainText("New Layout");
        //Проверяем названия и разрешения камер
        await expect(page.locator('[data-testid="at-camera-title"]').nth(0)).toHaveText(`${cameras[0].id}.${cameras[0].name}`);
        await expect(page.locator('[data-testid="at-camera-title"]').nth(1)).toHaveText(`${cameras[1].id}.${cameras[1].name}`);
        await expect(page.locator('[data-testid="at-camera-title"]').nth(2)).toHaveText(`${cameras[2].id}.${cameras[2].name}`);
        await expect(page.locator('[data-testid="at-camera-title"]').nth(3)).toHaveText(`${cameras[3].id}.${cameras[3].name}`);
        await expect(page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(0)).toContainText("Auto");
        await expect(page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(1)).toContainText("Auto");
        await expect(page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(2)).toContainText("Auto");
        await expect(page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(3)).toContainText("Auto");
    });
    
    
    test('Creation of x9 layout (CLOUD-T231)', async ({ page }) => {
        // await page.pause();
    
        await page.locator('#at-layout-menu').click();
        await page.locator('[title="3\u00D73"]').click();
        //Проверяем, что ячейки по диагонали содержат нужные камеры
        await expect(page.locator('[data-testid="at-camera-title"]').nth(0)).toHaveText(`${cameras[0].id}.${cameras[0].name}`);
        await expect(page.locator('[data-testid="at-camera-title"]').nth(4)).toHaveText(`${cameras[4].id}.${cameras[4].name}`);
        await expect(page.locator('[data-testid="at-camera-title"]').nth(8)).toHaveText(`${cameras[8].id}.${cameras[8].name}`);
        //Сохраняем раскладку
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Проверяем количество ячеек в созданной раскладке
        expect (await page.locator('[data-testid="at-camera-title"]').count()).toEqual(9);
        //Проверяем имя созданной раскладки
        await expect (page.locator('#at-layout-item-0')).toContainText("New Layout");
        //Проверяем названия и разрешения камер по диагонали
        await expect(page.locator('[data-testid="at-camera-title"]').nth(0)).toHaveText(`${cameras[0].id}.${cameras[0].name}`);
        await expect(page.locator('[data-testid="at-camera-title"]').nth(4)).toHaveText(`${cameras[4].id}.${cameras[4].name}`);
        await expect(page.locator('[data-testid="at-camera-title"]').nth(8)).toHaveText(`${cameras[8].id}.${cameras[8].name}`);
        await expect(page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(0)).toContainText("Auto");
        await expect(page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(4)).toContainText("Auto");
        await expect(page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(8)).toContainText("Auto");
    });
    
    
    test('Creation of x16 layout (CLOUD-T232)', async ({ page }) => {
        // await page.pause();
    
        await page.locator('#at-layout-menu').click();
        await page.locator('[title="4\u00D74"]').click();
        //Проверяем, что ячейки по диагонали содержат нужные камеры
        await expect(page.locator('[data-testid="at-camera-title"]').nth(0)).toHaveText(`${cameras[0].id}.${cameras[0].name}`);
        await expect(page.locator('[data-testid="at-camera-title"]').nth(5)).toHaveText(`${cameras[5].id}.${cameras[5].name}`);
        await expect(page.locator('[data-testid="at-camera-title"]').nth(10)).toHaveText(`${cameras[10].id}.${cameras[10].name}`);
        await expect(page.locator('[data-testid="at-camera-title"]').nth(15)).toHaveText(`${cameras[15].id}.${cameras[15].name}`);
        //Сохраняем раскладку
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Проверяем количество ячеек в созданной раскладке
        expect(await page.locator('[data-testid="at-camera-title"]').count()).toEqual(16);
        //Проверяем имя созданной раскладки
        await expect(page.locator('#at-layout-item-0')).toContainText("New Layout");
        //Проверяем названия и разрешения камер по диагонали
        await expect(page.locator('[data-testid="at-camera-title"]').nth(0)).toHaveText(`${cameras[0].id}.${cameras[0].name}`);
        await expect(page.locator('[data-testid="at-camera-title"]').nth(5)).toHaveText(`${cameras[5].id}.${cameras[5].name}`);
        await expect(page.locator('[data-testid="at-camera-title"]').nth(10)).toHaveText(`${cameras[10].id}.${cameras[10].name}`);
        await expect(page.locator('[data-testid="at-camera-title"]').nth(15)).toHaveText(`${cameras[15].id}.${cameras[15].name}`);
        await expect(page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(0)).toContainText("Auto");
        await expect(page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(5)).toContainText("Auto");
        await expect(page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(10)).toContainText("Auto");
        await expect(page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(15)).toContainText("Auto");
    });
    
    
    test('Cells size changing (CLOUD-T233)', async ({ page }) => {
        // await page.pause();
    
        await page.locator('#at-layout-menu').click();
        await page.locator('[title="3\u00D73"]').click();
        //Наводимся на первую камеру и расширяем ее вправо
        await page.locator('[role="gridcell"][tabindex="0"]').hover();
        await page.locator('[role="gridcell"][tabindex="0"] [role="group"]:nth-child(3) button:nth-child(1)').click(); // СДЕЛАТЬ ЛОКАТОРЫ
        //Проверяем что ячейка справа исчезла
        await expect(page.locator('[role="gridcell"][tabindex="1"]')).toBeHidden();
        //Расширяем первую ячейку вниз
        await page.locator('[role="gridcell"][tabindex="0"] [role="group"]:nth-child(4) button:nth-child(1)').click();
        //Проверяем что ячейки 4 и 5 исчезли
        await expect(page.locator('[role="gridcell"][tabindex="3"]')).toBeHidden();
        await expect(page.locator('[role="gridcell"][tabindex="4"]')).toBeHidden();
        //Наводимся на последнюю камеру и расширяем ее вверх
        await page.locator('[role="gridcell"][tabindex="8"]').hover();
        await page.locator('[role="gridcell"][tabindex="8"] [role="group"]:nth-child(2) button:nth-child(1)').click();
        //Проверяем что ячейка 6 исчезла
        await expect(page.locator('[role="gridcell"][tabindex="5"]')).toBeHidden();
        //Наводимся на предпоследнюю камеру и расширяем ее влево
        await page.locator('[role="gridcell"][tabindex="7"]').hover();
        await page.locator('[role="gridcell"][tabindex="7"] [role="group"]:nth-child(1) button:nth-child(1)').click();
        //Проверяем что ячейка 7 исчезла
        await expect(page.locator('[role="gridcell"][tabindex="6"]')).toBeHidden();
        //Возвращаем расщиренную ячейку в начальное состояние
        await page.locator('[role="gridcell"][tabindex="7"] [role="group"]:nth-child(1) button:nth-child(2)').click();
        //Проверяем что в замещенной ячейке теперь сообщение
        await expect(page.getByText("Drag camera here")).toBeVisible();
        //Сохраняем раскладку
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        expect(await page.locator('[data-testid="at-camera-title"]').count()).toEqual(4);
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
        await expect(page.locator('[role="gridcell"][tabindex="5"]')).toBeHidden();
        //Удаляем нижний ряд
        await page.locator('[role="gridcell"][tabindex="7"]').hover();
        await page.locator('[role="gridcell"][tabindex="7"] button').last().click(); // СДЕЛАТЬ ЛОКАТОРЫ
        await page.locator('[role="gridcell"][tabindex="6"]').hover();
        await page.locator('[role="gridcell"][tabindex="6"] button').last().click(); // СДЕЛАТЬ ЛОКАТОРЫ
        //Проверяем, что последняя удаленная ячейка не отображается
        await expect(page.locator('[role="gridcell"][tabindex="6"]')).toBeHidden();
        //Сохраняем раскладку
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        expect(await page.locator('[data-testid="at-camera-title"]').count()).toEqual(2);
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
        await expect(page.locator('[role="gridcell"][tabindex="1"] h6')).toHaveText("Drag camera here");
        await expect(page.locator('[role="gridcell"][tabindex="2"] h6')).toHaveText("Drag camera here");
        await expect(page.locator('[role="gridcell"][tabindex="3"] h6')).toHaveText("Drag camera here");
        await expect(page.locator('[role="gridcell"][tabindex="4"] h6')).toHaveText("Drag camera here");
        await expect(page.locator('[role="gridcell"][tabindex="5"] h6')).toHaveText("Drag camera here");
    
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
        expect(await page.locator('[role="gridcell"]').count()).toEqual(2);
        //Сохраняем раскладку
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        expect(await page.locator('[data-testid="at-camera-title"]').count()).toEqual(2);
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
        await expect(page.locator('[role="gridcell"][tabindex="5"] h6')).toHaveText("Drag camera here");
        await expect(page.locator('[role="gridcell"][tabindex="5"] .VideoCell__video')).toBeHidden();
        //Отменяем удаление последней ячейки и проверяем что в ней идет видео
        await page.locator('.layout [role="group"] button').nth(1).click(); // СДЕЛАТЬ ЛОКАТОРЫ
        await expect(page.locator('[role="gridcell"][tabindex="5"] h6')).toBeHidden();
        await expect(page.locator('[role="gridcell"][tabindex="5"] .VideoCell__video')).toBeVisible();
        //Переключаем разрешение на первой и второй ячейках
        await page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(0).click();
        await page.locator('[role="listbox"] [data-value="CAMERA_STREAM_RESOLUTION_HIGH"]').click();
        await expect(page.locator('[role="gridcell"][tabindex="0"]')).toContainText("High");
        await page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(0).click();
        await page.locator('[role="listbox"] [data-value="CAMERA_STREAM_RESOLUTION_LOW"]').click();
        await expect(page.locator('[role="gridcell"][tabindex="1"]')).toContainText("Low");
        //Дважды отменяем изменения
        await page.locator('.layout [role="group"] button').nth(1).click();
        await expect(page.locator('[role="gridcell"][tabindex="1"]')).toContainText("Auto");
        await page.locator('.layout [role="group"] button').nth(1).click();
        await expect(page.locator('[role="gridcell"][tabindex="0"]')).toContainText("Auto");
        //Возвращаем отмененное изменение один раз
        await page.locator('.layout [role="group"] button').nth(2).click();
        await expect(page.locator('[role="gridcell"][tabindex="0"]')).toContainText("High");
        await expect(page.locator('[role="gridcell"][tabindex="1"]')).toContainText("Auto");
        //Расширяем первую камеру вправо
        await page.locator('[role="gridcell"][tabindex="0"]').hover();
        await page.locator('[role="gridcell"][tabindex="0"] [role="group"]:nth-child(3) button:nth-child(1)').click(); // СДЕЛАТЬ ЛОКАТОРЫ
        //Проверяем что вторая ячейка исчезла
        await expect(page.locator('[role="gridcell"][tabindex="1"]')).toBeHidden();
        //Отменяем изменение
        await page.locator('.layout [role="group"] button').nth(1).click();
        //Проверяем что вернулась и в ней идет видео
        await expect(page.locator('[role="gridcell"][tabindex="1"]')).toBeVisible();
        await expect(page.locator('[role="gridcell"][tabindex="1"] .VideoCell__video')).toBeVisible();
        //Возвращаем изменения
        await page.locator('.layout [role="group"] button').nth(2).click();
        await expect(page.locator('[role="gridcell"][tabindex="1"]')).toBeHidden();
        //Сохраняем раскладку
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        expect(await page.locator('[data-testid="at-camera-title"]').count()).toEqual(7);
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
        await expect(page.locator('[role="gridcell"][tabindex="2"] .VideoCell__video')).toBeVisible();
        await expect(page.locator('[role="gridcell"][tabindex="5"] .VideoCell__video')).toBeVisible();
        await expect(page.locator('[role="gridcell"][tabindex="9"] .VideoCell__video')).toBeVisible();
        await expect(page.locator('[role="gridcell"][tabindex="10"] .VideoCell__video')).toBeVisible();
        await expect(page.locator('[role="gridcell"][tabindex="11"] .VideoCell__video')).toBeVisible();
        //Сохраняем раскладку
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        expect(await page.locator('[data-testid="at-camera-title"]').count()).toEqual(12);
    });

    test('Undo camera addition to layout (CLOUD-T717)', async ({ page }) => {
        // await page.pause();
        await page.locator('#at-layout-menu').click();
        await page.locator('[title="2\u00D72"]').click();
        //Проверяем открыта ли панель с камерами, и открываем если нет
        if (!(await isCameraListOpen(page))) {
            await page.getByRole('button', { name: 'Hardware'}).click();
        }
        //Перетаскиваем камеру с панели в занятую ячейку
        let source = page.locator('[data-testid="at-camera-list-item"]').nth(7);
        let target = page.locator('[role="gridcell"][tabindex="1"]');
        await source.dragTo(target);
        await expect(page.locator('[data-testid="at-camera-title"]').nth(1)).toHaveText(`${cameras[7].id}.${cameras[7].name}`);
        await expect(page.locator('[role="gridcell"][tabindex="1"] video')).toBeVisible();
        //Отменяем перенос
        await page.locator('.layout [role="group"] button').nth(1).click();
        await expect(page.locator('[data-testid="at-camera-title"]').nth(1)).toHaveText(`${cameras[1].id}.${cameras[1].name}`);
        await expect(page.locator('[role="gridcell"][tabindex="1"] video')).toBeVisible();
        //Добавляем столбец справа
        await page.locator('.layout > div:last-child > button').nth(2).click(); // СДЕЛАТЬ ЛОКАТОРЫ
        //Перетаскиваем камеру с панели в новую ячейку
        source = page.locator('[data-testid="at-camera-list-item"]').nth(8);
        target = page.locator('[role="gridcell"][tabindex="5"]');
        await source.dragTo(target);
        await expect(page.locator('[data-testid="at-camera-title"]').last()).toHaveText(`${cameras[8].id}.${cameras[8].name}`);
        await expect(page.locator('[role="gridcell"][tabindex="5"] video')).toBeVisible();
        //Отменяем перенос
        await page.locator('.layout [role="group"] button').nth(1).click();
        await expect(page.locator('[role="gridcell"][tabindex="5"] video')).toBeHidden();
        await expect (page.locator('[role="gridcell"][tabindex="5"] h6')).toHaveText("Drag camera here");
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
                await expect(page.locator(`[role="gridcell"][tabindex="${i}"]`)).toContainText("High"); 
            } else if (i < 6) {
                await expect(page.locator(`[role="gridcell"][tabindex="${i}"]`)).toContainText("Low");
            } else if (i < 9) {
                await expect(page.locator(`[role="gridcell"][tabindex="${i}"]`)).toContainText("Auto");
            }
        }
    
        //Проверяем цифры на верхней панели с кнопками, отражающие сколько камер принадлежат конкретному потоку
        await expect(page.locator(`header [role="group"]>span:nth-child(1)`)).toContainText("3");
        await expect(page.locator(`header [role="group"]>span:nth-child(2)`)).toContainText("3");
        await expect(page.locator(`header [role="group"]>span:nth-child(3)`)).toContainText("3");
    
        //Сохраняем раскладку
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
    
        //Снова проверяем что все камеры имеют нужный поток
        for (let i = 0; i < 9; i++) {
            if (i < 3) {
                await expect(page.locator(`[role="gridcell"][tabindex="${i}"]`)).toContainText("High");
            } else if (i < 6) {
                await expect(page.locator(`[role="gridcell"][tabindex="${i}"]`)).toContainText("Low");
            } else if (i < 9) {
                await expect(page.locator(`[role="gridcell"][tabindex="${i}"]`)).toContainText("Auto");
            }
        }
    
        //Перезагружаем страницу и вновь проверяем потоки камер
        await page.reload();
        for (let i = 0; i < 9; i++) {
            if (i < 3) {
                await expect(page.locator(`[role="gridcell"][tabindex="${i}"]`)).toContainText("High");
            } else if (i < 6) {
                await expect(page.locator(`[role="gridcell"][tabindex="${i}"]`)).toContainText("Low");
            } else if (i < 9) {
                await expect(page.locator(`[role="gridcell"][tabindex="${i}"]`)).toContainText("Auto");
            }
        }
    });

    test('Create layout after stream change (CLOUD-T463)', async ({ page }) => {
        // await page.pause();
        //Проверяем что открылась первая камера
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(1);
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveText(`${cameras[0].id}.${cameras[0].name}`);
        //Переключаем поток на камере и создаем раскладку
        await page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').click();
        await page.locator('[role="listbox"] [data-value="CAMERA_STREAM_RESOLUTION_LOW"]').click();
        await page.locator('#at-layout-menu').click();
        await page.locator('[title="2\u00D72"]').click();
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Проверяем количество ячеек на раскладке, названия и разрешения камер
        expect(await page.locator('[data-testid="at-camera-title"]').count()).toEqual(4);
        await expect(page.locator('[data-testid="at-camera-title"]').nth(0)).toHaveText(`${cameras[0].id}.${cameras[0].name}`);
        await expect(page.locator('[data-testid="at-camera-title"]').nth(1)).toHaveText(`${cameras[1].id}.${cameras[1].name}`);
        await expect(page.locator('[data-testid="at-camera-title"]').nth(2)).toHaveText(`${cameras[2].id}.${cameras[2].name}`);
        await expect(page.locator('[data-testid="at-camera-title"]').nth(3)).toHaveText(`${cameras[3].id}.${cameras[3].name}`);
        await expect(page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(0)).toContainText("Auto");
        await expect(page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(1)).toContainText("Auto");
        await expect(page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(2)).toContainText("Auto");
        await expect(page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(3)).toContainText("Auto");
    
    });
})

test.describe("Tests with created layout", () => {
    //эту раскладку не будем удалять
    let stableLayout;
    
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
        let deleteCreatedLayouts = Configuration.layouts.filter(item => item.meta.layout_id != stableLayout);
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

    test('Copying layout (CLOUD-T352/CLOUD-T353)', async ({ page }) => {
        
        // await page.pause();
        await page.locator('#at-layout-menu').click();
        await page.getByRole('menuitem', { name: 'Copy layout', exact: true }).click();
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Проверяем количество ячеек в созданной раскладке
        expect (await page.locator('[data-testid="at-camera-title"]').count()).toEqual(4);
        //Проверяем имя созданной раскладки
        await expect (page.locator('#at-layout-item-0')).toHaveText("Test Layout copy");
        //Создаем копию копии
        await page.locator('#at-layout-menu').click();
        await page.getByRole('menuitem', { name: 'Copy layout', exact: true }).click();
        requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Проверяем количество ячеек в созданной раскладке
        expect (await page.locator('[data-testid="at-camera-title"]').count()).toEqual(4);
        //Проверяем имя созданной раскладки
        await expect (page.locator('#at-layout-item-0')).toHaveText("Test Layout copy 1");
    });

    test('Layout changing (CLOUD-T354)', async ({ page }) => {
        
        // await page.pause();
        //Создаем x4 раскладку
        await page.locator('#at-layout-menu').click();
        await page.locator('[title="2\u00D72"]').click();
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Переходим в меню редактирования
        await page.locator('#at-layout-menu').click();
        await page.getByRole('menuitem', { name: 'Edit layout', exact: true }).click();
        //Меняем разрешение камер в нижнем ряду
        await page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(3).click();
        await page.locator('[role="listbox"] [data-value="CAMERA_STREAM_RESOLUTION_LOW"]').click();
        await page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(2).click();
        await page.locator('[role="listbox"] [data-value="CAMERA_STREAM_RESOLUTION_HIGH"]').click();
        //Удаляем вторую камеру с раскладки
        await page.locator('[role="gridcell"][tabindex="1"]').hover();
        await page.locator('[role="gridcell"][tabindex="1"] button').last().click(); // СДЕЛАТЬ ЛОКАТОРЫ
        //Добавляем столбец справа и камеры туда
        await page.locator('.layout > div:last-child > button').nth(2).click(); // СДЕЛАТЬ ЛОКАТОРЫ
        await page.getByRole('button', { name: 'Hardware'}).click();
        await page.locator('[role="gridcell"][tabindex="4"]').click();
        await page.locator('[data-testid="at-camera-list-item"]').nth(9).click();
        await page.locator('[role="gridcell"][tabindex="5"]').click();
        await page.locator('[data-testid="at-camera-list-item"]').nth(10).click();
        //Сохраняем изменения
        requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Проверяем количество активных ячеек
        expect (await page.locator('[data-testid="at-camera-title"]').count()).toEqual(5);
        //Проверяем что в новых ячейках нужные камеры
        await expect (page.locator('[role="gridcell"][tabindex="4"]')).toContainText(`${cameras[9].id}.${cameras[9].name}`);
        await expect (page.locator('[role="gridcell"][tabindex="5"]')).toContainText(`${cameras[10].id}.${cameras[10].name}`);
        //Проверяем потоки измененных ячеек
        await expect (page.locator('[role="gridcell"][tabindex="2"]')).toContainText("High");
        await expect (page.locator('[role="gridcell"][tabindex="3"]')).toContainText("Low");
    });

    test('Synchronous layout changing (CLOUD-T401)', async ({ page }) => {
        
        // await page.pause();
        //Создаем x1 раскладку
        await page.locator('#at-layout-menu').click();
        await page.locator('[title="1\u00D71"]').click();
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Создаем x4 раскладку
        await page.locator('#at-layout-menu').click();
        await page.locator('[title="2\u00D72"]').click();
        requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Переходим в меню редактирования x4 раскладки
        await page.locator('#at-layout-menu').click();
        await page.getByRole('menuitem', { name: 'Edit layout', exact: true }).click();
        //Меняем разрешение камер в нижнем ряду
        await page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(3).click();
        await page.locator('[role="listbox"] [data-value="CAMERA_STREAM_RESOLUTION_LOW"]').click();
        await page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(2).click();
        await page.locator('[role="listbox"] [data-value="CAMERA_STREAM_RESOLUTION_HIGH"]').click();
        //Удаляем вторую камеру с раскладки
        await page.locator('[role="gridcell"][tabindex="1"]').hover();
        await page.locator('[role="gridcell"][tabindex="1"] button').last().click(); // СДЕЛАТЬ ЛОКАТОРЫ
        //Выбираем раскладку x1
        await page.locator('#at-layout-expand').click();
        await page.waitForTimeout(1000); //Таймаут нужен так как ниже при клике игнорируется видимость элемента через флаг forсe, это нужно так как элемент aria-disabled="true"
        await page.locator('#at-layout-item-1').click({force: true, position: {x:10, y:10}}); //Костыль с координатами так как forse флаг жмет на центр блока минуя видимость и промахивается
        //Добавляем столбец справа и камеру туда
        await page.locator('.layout > div:last-child > button').nth(2).click(); // СДЕЛАТЬ ЛОКАТОРЫ
        await page.getByRole('button', { name: 'Hardware'}).click();
        await page.locator('[role="gridcell"][tabindex="1"]').click();
        await page.locator('[data-testid="at-camera-list-item"]').nth(7).click();
        await page.getByRole('button', { name: 'Hardware'}).click();
        //Сохраняем изменения
        requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Проверяем количество активных ячеек
        expect (await page.locator('[data-testid="at-camera-title"]').count()).toEqual(2);
        //Проверяем что в новой ячейке нужная камера
        await expect (page.locator('[role="gridcell"][tabindex="1"]')).toContainText(`${cameras[7].id}.${cameras[7].name}`);
        //Выбираем раскладку x4
        await page.locator('#at-layout-expand').click();
        await page.waitForTimeout(1000); //Таймаут нужен так как ниже при клике игнорируется видимость элемента через флаг forсe, это нужно так как элемент aria-disabled="true"
        await page.locator('#at-layout-item-0').click({force: true});
        //Проверям количество ячеек
        await page.locator('[role="gridcell"][tabindex="3"]').waitFor({state: 'attached', timeout: 5000});
        expect (await page.locator('[data-testid="at-camera-title"]').count()).toEqual(3);
        //Проверяем потоки измененных ячеек
        await expect (page.locator('[role="gridcell"][tabindex="2"]')).toContainText("High");
        await expect (page.locator('[role="gridcell"][tabindex="3"]')).toContainText("Low");
    });

    test('Layout rename (CLOUD-T355)', async ({ page }) => {
        //Создаем несколько раскладку через API
        await createLayout(Configuration.cameras, 3, 2, "New Test Layout");
        // await page.pause();
        //Создаем x4 раскладку
        await page.locator('#at-layout-menu').click();
        await page.locator('[title="2\u00D72"]').click();
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Мееяем название первой раскладки
        await page.locator('#at-layout-item-0').dblclick({force: true});
        await page.locator('#at-layout-item-0 input').fill('Red Square', {force: true});
        await page.locator('#at-layout-item-0').press('Enter');
        await expect(page.locator('#at-layout-item-0')).toHaveText('Red Square');
        requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        await expect(page.locator('#at-layout-item-0')).toHaveText('Red Square');
        //Мееяем название второй раскладки
        await page.locator('#at-layout-expand').click();
        await page.waitForTimeout(1000); //Таймаут нужен так как ниже при клике игнорируется видимость элемента через флаг forсe, это нужно так как элемент aria-disabled="true"
        await page.locator('#at-layout-item-1').dblclick({force: true});
        await page.locator('#at-layout-item-1 input').type(' Changed');
        requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        await expect(page.locator('#at-layout-item-1')).toHaveText('New Test Layout Changed');
    });

    test('Layout rename partial (CLOUD-T890)', async ({ page }) => {
        //Создаем несколько раскладку через API
        await createLayout(Configuration.cameras, 3, 2, "New Layout");
        // await page.pause();
        await page.reload();
        //Активируем поле изменения названия
        await page.locator('#at-layout-item-0').dblclick({force: true});
        await waitAnimationEnds(page.locator('#at-layout-items')); 
        let inputSize = await page.locator('#at-layout-item-0 input').boundingBox();
        //Удаляем первую часть слова и пишем Changed
        await page.mouse.click(inputSize!.x + 25,  inputSize!.y + inputSize!.height / 2);
        await page.keyboard.press("Backspace");
        await page.keyboard.press("Backspace");
        await page.keyboard.press("Backspace");
        await page.keyboard.type("Changed");
        await page.keyboard.press("Enter");
        await expect(page.locator('#at-layout-item-0')).toHaveText('Changed Layout');
        //Сохраняем раскладку и проверям, что название осталось
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        await expect(page.locator('#at-layout-item-0')).toHaveText('Changed Layout');
    });

    test('Accepting buttons is presented (CLOUD-T864)', async ({ page }) => {
        //Создаем несколько раскладку через API
        await createLayout(Configuration.cameras, 3, 2, "New Layout");
        // await page.pause();
        await page.reload();
        //Активируем поле изменения названия
        await page.locator('#at-layout-item-0').dblclick({force: true});
        await waitAnimationEnds(page.locator('#at-layout-items'));
        //Не меняя названия раскладки кликаем в пространство вне меню (в данно случае в середину экрана, так как #app это обобщающий блок)
        let viewCenter = await page.locator('#app').boundingBox();
        await page.mouse.click(viewCenter!.x + viewCenter!.width / 2,  viewCenter!.y + viewCenter!.height / 2);
        //Проверяем, что кнопки сохранить/отменить исчезли и поле инпута неактивно
        await expect(page.getByRole('button', { name: 'Save', exact: true })).not.toBeInViewport(); // не toBeHidden() так как элемент присутсвует в DOM и имеет некую ширину
        await expect(page.getByRole('button', { name: 'Cancel', exact: true })).not.toBeInViewport();
        await expect(page.locator('#at-layout-item-0 input')).toBeHidden();
        //Снова активируем поле изменения названия
        await page.locator('#at-layout-item-0').dblclick({force: true});
        await waitAnimationEnds(page.locator('#at-layout-items'));
        //Меняем название раскладки и кликаем в пространство вне меню
        await page.locator('#at-layout-item-0 input').fill('Sergeant Billy', {force: true});
        await page.mouse.click(viewCenter!.x + viewCenter!.width / 2,  viewCenter!.y + viewCenter!.height / 2);
        //Проверяем, что кнопки сохранить/отменить на месте а поле инпута неактивно
        await expect(page.getByRole('button', { name: 'Save', exact: true })).toBeInViewport();
        await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeInViewport();
        await expect(page.locator('#at-layout-item-0 input')).toBeHidden();
    });

    test('Pick layout in filled panel (CLOUD-T374)', async ({ page }) => {
        //Создаем несколько раскладок через API
        await createLayout(Configuration.cameras, 1, 1, "Test Layout 2");
        await createLayout(Configuration.cameras, 3, 2, "Test Layout 3");
        await createLayout(Configuration.cameras, 3, 3, "Test Layout 4");
        await createLayout(Configuration.cameras, 1, 2, "Test Layout 5");
        // await page.pause();
        await page.reload();
        //Разворачиваем панель раскладок и проверяем, что последняя раскладка отображается в визуальной области
        await page.locator('#at-layout-expand').click();
        await expect(page.locator('#at-layout-item-4')).toBeInViewport();
        //Кликаем по последней раскладке ждем пока блок свернется и проверяем, что раскладка отображается в визуальной области, то есть список пролистался до нее
        await page.locator('#at-layout-item-4').click({force: true});
        await page.waitForTimeout(500); //таймаут анимации панели
        await expect(page.locator('#at-layout-item-4')).toBeInViewport();
    });

    test('Layout search (CLOUD-T402)', async ({ page }) => {
        //Создаем x1 раскладку через API
        await createLayout(Configuration.cameras, 1, 1, "221B Baker Street");
        // await page.pause();
        //Создаем x4 раскладку в UI
        await page.locator('#at-layout-menu').click();
        await page.locator('[title="2\u00D72"]').click();
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;

        let searchList = ["street", "e", "New", "221B Baker Street", "new layout"];
    
        for (let input of searchList) {
            //Вписываем в поиск значение из тестового массива
            await page.locator('input[type="search"]').fill(input);
            //Ждем пока элемент загрузки списка появится и исчезнет из DOM
            await page.locator('[role="progressbar"]').waitFor({state: 'attached', timeout: 5000});
            await page.locator('[role="progressbar"]').waitFor({state: 'detached', timeout: 5000});
            //Считаем количество отображаемых раскладок на панели
            let camerasCount = await page.locator('#at-layout-items li').count();
            //Провяем необходимое количество раскладок на панели
            if (input === "e") {
                expect(camerasCount).toBeGreaterThan(1);
            } else {
                expect(camerasCount).toEqual(1);
            }   
        }
    });

    test('Nonexistent layout search (CLOUD-T403)', async ({ page }) => {

        // await page.pause();
        await page.locator('#at-layout-items li').waitFor({state: 'attached', timeout: 10000});

        let searchList = ["undefined", "nihill",];
    
        for (let input of searchList) {
            //Вписываем в поиск значение из тестового массива
            await page.locator('input[type="search"]').fill(input);
            //Ждем пока элемент загрузки списка появится и исчезнет из DOM
            await page.locator('[role="progressbar"]').waitFor({state: 'attached', timeout: 5000});
            await page.locator('[role="progressbar"]').waitFor({state: 'detached', timeout: 5000});
            //Считаем количество отображаемых раскладок на панели
            let camerasCount = await page.locator('#at-layout-items li').count();
            //Провяем необходимое количество раскладок на панели
            expect(camerasCount).toEqual(0);
        }
    });

    test('Change layouts order (CLOUD-T374)', async ({ page }) => {
        //Создаем несколько раскладок через API
        await createLayout(Configuration.cameras, 1, 1, "Test Layout 3");
        await createLayout(Configuration.cameras, 3, 2, "Test Layout 2");
        // await page.pause();
        await page.reload();
        //Переходим в режим переопределения порядка раскладок
        await page.locator('#at-layout-menu').click();
        await page.getByRole('menuitem', { name: 'Delete/Reorder layouts', exact: true }).click();
        //Разворачиваем панель раскладок
        await page.locator('#at-layout-expand').click();
        await waitAnimationEnds(page.locator('#at-layout-items'));
        //Получаем координаты второй раскладки в панели
        let firstLayout = await page.locator('#at-layout-item-0').boundingBox();
        //Перетаскиваем вторую раскладку на место первой
        await page.locator('#at-layout-item-1').hover();
        await page.mouse.down();
        await page.mouse.move(firstLayout!.x + firstLayout!.width / 2, firstLayout!.y + firstLayout!.height / 2);
        await page.mouse.up();
        await waitAnimationEnds(page.locator('#at-layout-items'));
        //Сохраняем изменения
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Проверяем порядок раскладок
        await expect(page.locator('#at-layout-item-0')).toHaveText('Test Layout 3');
        await expect(page.locator('#at-layout-item-1')).toHaveText('Test Layout 2');
        //Перезагружаем страницу и проверяем порядок раскладок
        await page.reload();
        await expect(page.locator('#at-layout-item-0')).toHaveText('Test Layout 3');
        await expect(page.locator('#at-layout-item-1')).toHaveText('Test Layout 2');
    });

    test('Go to search after layout delete (CLOUD-T891)', async ({ page }) => {
        //Создаем несколько раскладок через API
        await createLayout(Configuration.cameras, 3, 2, "Test Layout 3");
        // await page.pause();
        await page.reload();
        //Переходим в режим переопределения порядка раскладок
        await page.locator('#at-layout-menu').click();
        await page.getByRole('menuitem', { name: 'Delete/Reorder layouts', exact: true }).click();
        //Удаялем первую раскладку не разворачивая блок с раскладками
        await page.locator('#at-layout-item-0 button:last-child').click();
        //Сохраняем изменения
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Пытаемся перейти в раздел поиска   
        await page.locator('#at-app-mode-search').click();
        //Получаем сообщение с предупреждением
        await expect(page.locator('.MuiAlert-message')).toHaveText('Please select the camera');
    });

    test('Delete layouts (CLOUD-T409)', async ({ page }) => {
        //Создаем несколько раскладок через API
        await createLayout(Configuration.cameras, 1, 1, "Test Layout 2");
        await createLayout(Configuration.cameras, 3, 2, "Test Layout 3");
        // await page.pause();
        await page.reload();
        //Переходим в режим переопределения порядка раскладок
        await page.locator('#at-layout-menu').click();
        await page.getByRole('menuitem', { name: 'Delete/Reorder layouts', exact: true }).click();
        //Удаялем первую раскладку не разворачивая блок с раскладками
        await page.locator('#at-layout-item-0 button:last-child').click();
        await waitAnimationEnds(page.locator('#at-layout-items'));
        expect(await page.locator('#at-layout-items li').count()).toEqual(2);
        //Разворачиваем панель раскладок и удаляем вторую добавленную раскладку
        await page.locator('#at-layout-expand').click();
        await waitAnimationEnds(page.locator('#at-layout-items'));
        await page.locator('#at-layout-item-0 button:last-child').click();
        await waitAnimationEnds(page.locator('#at-layout-items'));
        expect(await page.locator('#at-layout-items li').count()).toEqual(1);
        //Сохраняем изменения
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Проверям количество и названия раскладок
        expect(await page.locator('#at-layout-items li').count()).toEqual(1);
    });

    test('Cancel delete layouts (CLOUD-T408)', async ({ page }) => {
        //Создаем несколько раскладок через API
        await createLayout(Configuration.cameras, 1, 1, "Test Layout 2");
        await createLayout(Configuration.cameras, 3, 2, "Test Layout 3");
        // await page.pause();
        await page.reload();
        //Переходим в режим переопределения порядка раскладок
        await page.locator('#at-layout-menu').click();
        await page.getByRole('menuitem', { name: 'Delete/Reorder layouts', exact: true }).click();
        //Разворачиваем панель раскладок и удаляем две раскладки добавленную раскладку
        await page.locator('#at-layout-expand').click();
        await waitAnimationEnds(page.locator('#at-layout-items'));
        await page.locator('#at-layout-item-0 button:last-child').click();
        await waitAnimationEnds(page.locator('#at-layout-items'));
        expect(await page.locator('#at-layout-items li').count()).toEqual(2);
        await page.locator('#at-layout-item-0 button:last-child').click();
        await waitAnimationEnds(page.locator('#at-layout-items'));
        expect(await page.locator('#at-layout-items li').count()).toEqual(1);
        //Слушаем запросы, чтобы при отмене не отсылался запрос на изменение раскладки
        let requestNotSent = true;
        page.on("request", request => {
            if(request.url().includes(`/v1/layouts?`)) {
                requestNotSent = false;
            }
        });
        await page.getByRole('button', { name: 'Cancel', exact: true }).click();
        //Проверям количество и названия раскладок
        await page.locator('#at-layout-item-2').waitFor({state: 'attached', timeout: 5000});
        expect(await page.locator('#at-layout-items li').count()).toEqual(3);
        await expect(page.locator('#at-layout-item-0')).toHaveText('Test Layout 3');
        await expect(page.locator('#at-layout-item-1')).toHaveText('Test Layout 2');
        //Проверяем, что запрос на раскладки не был отправлен
        expect(requestNotSent).toBeTruthy();
    });

    test('Cancel change layouts order (CLOUD-T407)', async ({ page }) => {
        //Создаем несколько раскладок через API
        await createLayout(Configuration.cameras, 1, 1, "Test Layout 2");
        await createLayout(Configuration.cameras, 3, 2, "Test Layout 3");
        // await page.pause();
        await page.reload();
        //Переходим в режим переопределения порядка раскладок
        await page.locator('#at-layout-menu').click();
        await page.getByRole('menuitem', { name: 'Delete/Reorder layouts', exact: true }).click();
        //Разворачиваем панель раскладок
        await page.locator('#at-layout-expand').click();
        await waitAnimationEnds(page.locator('#at-layout-items'));
        //Получаем координаты второй раскладки в панели
        let firstLayout = await page.locator('#at-layout-item-0').boundingBox();
        //Перетаскиваем вторую раскладку на место первой
        await page.locator('#at-layout-item-1').hover();
        await page.mouse.down();
        await page.mouse.move(firstLayout!.x + firstLayout!.width / 2, firstLayout!.y + firstLayout!.height / 2);
        await page.mouse.up();
        await waitAnimationEnds(page.locator('#at-layout-items'));
        //Слушаем запросы, чтобы при отмене не отсылался запрос на изменение раскладки
        let requestNotSent = true;
        page.on("request", request => {
            if(request.url().includes(`/v1/layouts?`)) {
                requestNotSent = false;
            }
        });
        await page.getByRole('button', { name: 'Cancel', exact: true }).click();
        //Проверяем порядок раскладок
        await expect(page.locator('#at-layout-item-0')).toHaveText('Test Layout 3');
        await expect(page.locator('#at-layout-item-1')).toHaveText('Test Layout 2');
        //Проверяем, что запрос на раскладки не был отправлен
        expect(requestNotSent).toBeTruthy();
    });

    test('Cancel layout changing (CLOUD-T405)', async ({ page }) => {
        
        // await page.pause();
        //Переходим в меню редактирования
        await page.locator('#at-layout-menu').click();
        await page.getByRole('menuitem', { name: 'Edit layout', exact: true }).click();
        //Меняем разрешение камер в нижнем ряду
        await page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(3).click();
        await page.locator('[role="listbox"] [data-value="CAMERA_STREAM_RESOLUTION_LOW"]').click();
        await page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(2).click();
        await page.locator('[role="listbox"] [data-value="CAMERA_STREAM_RESOLUTION_HIGH"]').click();
        //Удаляем вторую камеру с раскладки
        await page.locator('[role="gridcell"][tabindex="1"]').hover();
        await page.locator('[role="gridcell"][tabindex="1"] button').last().click(); // СДЕЛАТЬ ЛОКАТОРЫ
        //Добавляем столбец справа и камеры туда
        await page.locator('.layout > div:last-child > button').nth(2).click(); // СДЕЛАТЬ ЛОКАТОРЫ
        await page.getByRole('button', { name: 'Hardware'}).click();
        await page.locator('[role="gridcell"][tabindex="4"]').click();
        await page.locator('[data-testid="at-camera-list-item"]').nth(9).click();
        await page.locator('[role="gridcell"][tabindex="5"]').click();
        await page.locator('[data-testid="at-camera-list-item"]').nth(10).click();
        //Слушаем запросы, чтобы при отмене не отсылался запрос на изменение раскладки
        let requestNotSent = true;
        page.on("request", request => {
            if(request.url().includes(`/v1/layouts?`)) {
                requestNotSent = false;
            }
        });
        await page.getByRole('button', { name: 'Cancel', exact: true }).click();
        //Проверяем количество активных ячеек
        expect (await page.locator('[data-testid="at-camera-title"]').count()).toEqual(4);
        //Проверяем потоки ячеек
        await expect (page.locator('[role="gridcell"][tabindex="0"]')).toContainText("Auto");
        await expect (page.locator('[role="gridcell"][tabindex="1"]')).toContainText("Auto");
        await expect (page.locator('[role="gridcell"][tabindex="2"]')).toContainText("Auto");
        await expect (page.locator('[role="gridcell"][tabindex="3"]')).toContainText("Auto");
        //Проверяем, что запрос на раскладки не был отправлен
        expect(requestNotSent).toBeTruthy();
    });

    test('Cancel layout rename (CLOUD-T406)', async ({ page }) => {
        
        // await page.pause();
        await page.locator('#at-layout-item-0').waitFor({state: 'visible', timeout: 30000});
        //Активируем поле для изменения названия, но сразу отменяем действие
        await page.locator('#at-layout-item-0').dblclick({force: true});
        let requestNotSent = true;
        page.on("request", request => {
            if(request.url().includes(`/v1/layouts?`)) {
                requestNotSent = false;
            }
        });
        await page.getByRole('button', { name: 'Cancel', exact: true }).click();
        //Проверяем, что запрос на раскладки не был отправлен
        expect(requestNotSent).toBeTruthy();
        await expect(page.locator('#at-layout-item-0')).toHaveText('Test Layout');
        //Редактируем название раскладки и отменяем изменения
        await page.locator('#at-layout-item-0').dblclick({force: true});
        await page.locator('#at-layout-item-0 input').fill('Red Square', {force: true});
        await page.getByRole('button', { name: 'Cancel', exact: true }).click();
        //Проверяем, что запрос на раскладки не был отправлен
        expect(requestNotSent).toBeTruthy();
        await expect(page.locator('#at-layout-item-0')).toHaveText('Test Layout');
    });
})

test.describe("Tests with different users", () => {
    let layoutChangingForbid = {
        "feature_access": [
            "FEATURE_ACCESS_DEVICES_SETUP",
            "FEATURE_ACCESS_ARCHIVES_SETUP",
            "FEATURE_ACCESS_DETECTORS_SETUP",
            "FEATURE_ACCESS_SETTINGS_SETUP",
            "FEATURE_ACCESS_PROGRAMMING_SETUP",
            "FEATURE_ACCESS_REALTIME_RECOGNITION_SETUP",
            "FEATURE_ACCESS_WEB_UI_LOGIN",
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
    };

    let layoutForbid = {
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
    };

    test.beforeAll(async () => {
        await getHostName();
        await configurationCollector();
        await layoutAnnihilator("all");
        await roleAnnihilator("all");
        await userAnnihilator("all");
        cameras = Configuration.cameras.map(item => { return ({
            id: item.displayId,
            name: item.displayName  
        })});
        await createRole("Layouts");
        await setRolePermissions("Layouts");
        await createUser("Layout User");
        await assignUserRole("Layouts", "Layout User");
        await setUserPassword("Layout User", "Admin1234");
    });
    
    test.beforeEach(async ({ page }) => {
        await configurationCollector("layouts");
        await layoutAnnihilator("all");
        await page.goto(currentURL);
        await page.getByLabel('Login').fill('root');
        await page.getByLabel('Password').fill('root');
        await page.getByLabel('Password').press('Enter');
    });

    test('Full layout sharing (CLOUD-T410)', async ({ page }) => {
        
        // await page.pause();
        //Создаем полную x9 раскладку в UI
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
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Меняем название и сохраняем
        await page.locator('#at-layout-item-0').dblclick({force: true});
        await page.locator('#at-layout-item-0 input').fill('Shared full', {force: true});
        requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Переходим в меню редактирования раскладки
        await page.locator('#at-layout-menu').click();
        await page.getByRole('menuitem', { name: 'Edit layout', exact: true }).click();
        //Получаем координаты кнопки Save, понадобится чтобы закрыть меню раскладки
        await waitAnimationEnds(page.locator('header [role="group"]'));
        let saveButton = await page.getByRole('button', { name: 'Save', exact: true }).boundingBox();
        //Раздаем раскладку роли Layouts
        await page.locator('#at-layout-menu').click();
        await page.getByRole('menuitem', { name: 'Share with', exact: true }).hover();
        await page.getByRole('menuitem', { name: 'Layouts', exact: true }).click();
        //Закрываем меню таким образом, так как aria-hidden="true"
        await page.mouse.click(saveButton!.x + saveButton!.width / 2, saveButton!.y + saveButton!.height / 2);
        //Сохраняем изменения
        requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Авторизуемся пользователем Layout User
        await page.locator('#at-top-menu-btn').click();
        await page.getByRole('menuitem', { name: 'Change user' }).click();
        await page.getByLabel('Login').fill('Layout User');
        await page.getByLabel('Password').fill('Admin1234');
        await page.getByLabel('Password').press('Enter');
        //Раскладка не всегда успевает создасться у пользователя, поэтому иногда приходится перезагружаться
        let layoutRequest = await page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        let body = await layoutRequest.json();
        if (body?.items.length == 0) {
            await page.waitForTimeout(3000);
            await page.reload();
        }
        //Проверяем количество ячеек
        await expect( page.locator('[data-testid="at-camera-title"]')).toHaveCount(9);
        //Проверяем название раскладки
        await expect(page.locator('#at-layout-item-0')).toHaveText('Shared full');
        //Проверяем наличие иконки расшаренности
        await expect(page.locator('#at-layout-item-0 svg').nth(1)).toBeVisible();
        //Проверяем что все камеры имеют нужный поток и видео в них идет
        for (let i = 0; i < 9; i++) {
            if (i < 3) {
                await expect(page.locator(`[role="gridcell"][tabindex="${i}"]`)).toContainText("High");
            } else if (i < 6) {
                await expect(page.locator(`[role="gridcell"][tabindex="${i}"]`)).toContainText("Low");
            } else if (i < 9) {
                await expect(page.locator(`[role="gridcell"][tabindex="${i}"]`)).toContainText("Auto");
            }
            await expect(page.locator(`[role="gridcell"][tabindex="${i}"] video`)).toBeVisible();
        }
    });

    test('Layout sharing without one cell (CLOUD-T411)', async ({ page }) => {
        
        // await page.pause();
        //Создаем полную x9 раскладку в UI
        await page.locator('#at-layout-menu').click();
        await page.locator('[title="3\u00D73"]').click();
        //Удаляем последнюю камеру
        await page.locator('[role="gridcell"][tabindex="8"]').hover();
        await page.locator('[role="gridcell"][tabindex="8"] button').last().click(); // СДЕЛАТЬ ЛОКАТОРЫ
        //Сохраняем раскладку
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Меняем название и сохраняем
        await page.locator('#at-layout-item-0').dblclick({force: true});
        await page.locator('#at-layout-item-0 input').fill('Deleted cell', {force: true});
        requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Переходим в меню редактирования раскладки
        await page.locator('#at-layout-menu').click();
        await page.getByRole('menuitem', { name: 'Edit layout', exact: true }).click();
        //Получаем координаты кнопки Save, понадобится чтобы закрыть меню раскладки
        await waitAnimationEnds(page.locator('header [role="group"]'));
        let saveButton = await page.getByRole('button', { name: 'Save', exact: true }).boundingBox();
        //Раздаем раскладку роли Layouts
        await page.locator('#at-layout-menu').click();
        await page.getByRole('menuitem', { name: 'Share with', exact: true }).hover();
        await page.getByRole('menuitem', { name: 'Layouts', exact: true }).click();
        //Закрываем меню таким образом, так как aria-hidden="true"
        await page.mouse.click(saveButton!.x + saveButton!.width / 2, saveButton!.y + saveButton!.height / 2);
        //Сохраняем изменения
        requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Авторизуемся пользователем Layout User
        await page.locator('#at-top-menu-btn').click();
        await page.getByRole('menuitem', { name: 'Change user' }).click();
        await page.getByLabel('Login').fill('Layout User');
        await page.getByLabel('Password').fill('Admin1234');
        await page.getByLabel('Password').press('Enter');
        //Раскладка не всегда успевает создасться у пользователя, поэтому иногда приходится перезагружаться
        let layoutRequest = await page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        let body = await layoutRequest.json();
        if (body?.items.length == 0) {
            await page.waitForTimeout(3000);
            await page.reload();
        }
        //Проверяем количество ячеек
        await expect ( page.locator('[data-testid="at-camera-title"]')).toHaveCount(8);
        //Проверяем что видео в ячейках идет
        for (let i = 0; i < 9; i++) {
            if (i == 8) {
                await expect(page.locator(`[role="gridcell"][tabindex="${i}"] video`)).toBeHidden();
            } else {
                await expect(page.locator(`[role="gridcell"][tabindex="${i}"] video`)).toBeVisible();
            }
        }
        //Проверяем название раскладки
        await expect(page.locator('#at-layout-item-0')).toHaveText('Deleted cell');
        //Проверяем наличие иконки расшаренности
        await expect(page.locator('#at-layout-item-0 svg').nth(1)).toBeVisible();
    });

    test('Positions in shared layout menu (CLOUD-T412)', async ({ page }) => {
        
        // await page.pause();
        //Создаем полную x4 раскладку в UI
        await page.locator('#at-layout-menu').click();
        await page.locator('[title="2\u00D72"]').click();
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Меняем название и сохраняем
        await page.locator('#at-layout-item-0').dblclick({force: true});
        await page.locator('#at-layout-item-0 input').fill('Shared 2', {force: true});
        requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Переходим в меню редактирования раскладки
        await page.locator('#at-layout-menu').click();
        await page.getByRole('menuitem', { name: 'Edit layout', exact: true }).click();
        //Получаем координаты кнопки Save, понадобится чтобы закрыть меню раскладки
        await waitAnimationEnds(page.locator('header [role="group"]'));
        let saveButton = await page.getByRole('button', { name: 'Save', exact: true }).boundingBox();
        //Раздаем раскладку роли Layouts
        await page.locator('#at-layout-menu').click();
        await page.getByRole('menuitem', { name: 'Share with', exact: true }).hover();
        await page.getByRole('menuitem', { name: 'Layouts', exact: true }).click();
        //Закрываем меню таким образом, так как aria-hidden="true"
        await page.mouse.click(saveButton!.x + saveButton!.width / 2, saveButton!.y + saveButton!.height / 2);
        //Сохраняем изменения
        requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Авторизуемся пользователем Layout User
        await page.locator('#at-top-menu-btn').click();
        await page.getByRole('menuitem', { name: 'Change user' }).click();
        await page.getByLabel('Login').fill('Layout User');
        await page.getByLabel('Password').fill('Admin1234');
        await page.getByLabel('Password').press('Enter');
        //Раскладка не всегда успевает создасться у пользователя, поэтому иногда приходится перезагружаться
        let layoutRequest = await page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        let body = await layoutRequest.json();
        if (body?.items.length == 0) {
            await page.waitForTimeout(3000);
            await page.reload();
        }
        //Проверяем количество ячеек
        await expect ( page.locator('[data-testid="at-camera-title"]')).toHaveCount(4);
        //Проверяем пункты в меню раскладки
        await page.locator('#at-layout-menu').click();
        await expect (page.locator('[tabindex="-1"][role="menuitem"]').nth(1)).toHaveText('Delete/Reorder layouts');
        await expect (page.locator('[tabindex="-1"][role="menuitem"]').nth(2)).toHaveText('Copy layout');
        await expect (page.locator('[tabindex="-1"][role="menuitem"]').nth(3)).toHaveText('Use by default');
    });

    test('Delete shared layout (CLOUD-T413)', async ({ page }) => {
        
        // await page.pause();
        //Создаем полную x4 раскладку в UI
        await page.locator('#at-layout-menu').click();
        await page.locator('[title="2\u00D72"]').click();
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Меняем название и сохраняем
        await page.locator('#at-layout-item-0').dblclick({force: true});
        await page.locator('#at-layout-item-0 input').fill('Shared 3', {force: true});
        requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Переходим в меню редактирования раскладки
        await page.locator('#at-layout-menu').click();
        await page.getByRole('menuitem', { name: 'Edit layout', exact: true }).click();
        //Получаем координаты кнопки Save, понадобится чтобы закрыть меню раскладки
        await waitAnimationEnds(page.locator('header [role="group"]'));
        let saveButton = await page.getByRole('button', { name: 'Save', exact: true }).boundingBox();
        //Раздаем раскладку роли Layouts
        await page.locator('#at-layout-menu').click();
        await page.getByRole('menuitem', { name: 'Share with', exact: true }).hover();
        await page.getByRole('menuitem', { name: 'Layouts', exact: true }).click();
        //Закрываем меню таким образом, так как aria-hidden="true"
        await page.mouse.click(saveButton!.x + saveButton!.width / 2, saveButton!.y + saveButton!.height / 2);
        //Сохраняем изменения
        requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Авторизуемся пользователем Layout User
        await page.locator('#at-top-menu-btn').click();
        await page.getByRole('menuitem', { name: 'Change user' }).click();
        await page.getByLabel('Login').fill('Layout User');
        await page.getByLabel('Password').fill('Admin1234');
        await page.getByLabel('Password').press('Enter');
        //Раскладка не всегда успевает создасться у пользователя, поэтому иногда приходится перезагружаться
        let layoutRequest = await page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        let body = await layoutRequest.json();
        if (body?.items.length == 0) {
            await page.waitForTimeout(3000);
            await page.reload();
        }
        //Проверяем количество ячеек
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(4);
        //Удаляем раскладку
        await page.locator('#at-layout-menu').click();
        await page.getByRole('menuitem', { name: 'Delete/Reorder layouts', exact: true }).click();
        await page.locator('#at-layout-item-0 button:last-child').click();
        await waitAnimationEnds(page.locator('#at-layout-items'));
        expect(await page.locator('#at-layout-items li').count()).toEqual(0);
        //Сохраняем изменения
        requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Проверям количество раскладок
        expect(await page.locator('#at-layout-items li').count()).toEqual(0);
        //Авторизуемся пользователем root
        await page.locator('#at-top-menu-btn').click();
        await page.getByRole('menuitem', { name: 'Change user' }).click();
        await page.getByLabel('Login').fill('root');
        await page.getByLabel('Password').fill('root');
        await page.getByLabel('Password').press('Enter');
        //Ждем запрос раскладок и проверяем их количество
        layoutRequest = await page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        expect(await page.locator('#at-layout-items li').count()).toEqual(1);
        //Проверяем видео в них
        for (let i = 0; i < 4; i++) {
            await expect(page.locator(`[role="gridcell"][tabindex="${i}"] video`)).toBeVisible();
        }
    });

    test('Layout changing access (CLOUD-T414)', async ({ page }) => {
        
        // await page.pause();
        //Авторизуемся пользователем Layout User
        await page.locator('#at-top-menu-btn').click();
        await page.getByRole('menuitem', { name: 'Change user' }).click();
        await page.getByLabel('Login').fill('Layout User');
        await page.getByLabel('Password').fill('Admin1234');
        await page.getByLabel('Password').press('Enter');
        //Создаем полную x4 раскладку в UI
        await page.locator('#at-layout-menu').click();
        await page.locator('[title="2\u00D72"]').click();
        let requestPromise = page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        await requestPromise;
        //Меняем права роли
        await setRolePermissions("Layouts", layoutChangingForbid);
        //Проверяем количество раскладок
        await page.reload();
        await page.waitForResponse(request => request.url().includes(`/v1/layouts?`));
        expect(await page.locator('#at-layout-items li').count()).toEqual(1);
        //Проверяем пункты в меню раскладки
        await page.locator('#at-layout-menu').click();
        await expect(page.locator('[role="menu"]').last().locator('li')).toHaveCount(1);//сделать локатор для меню раскладок
        await expect(page.getByRole('menuitem', { name: 'Use by default', exact: true })).toBeVisible();
    });

    test('Layout access forbid (CLOUD-T415)', async ({ page }) => {
        
        // await page.pause();
        await setRolePermissions("Layouts", layoutForbid);
        //Авторизуемся пользователем Layout User
        await page.locator('#at-top-menu-btn').click();
        await page.getByRole('menuitem', { name: 'Change user' }).click();
        await page.getByLabel('Login').fill('Layout User');
        await page.getByLabel('Password').fill('Admin1234');
        await page.getByLabel('Password').press('Enter');
        //Проверяем количество раскладок
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(1);
        expect(await page.locator('#at-layout-items li').count()).toEqual(0);
        //Проверяем что меню раскладок скрыто
        await expect(page.locator('#at-layout-menu')).toBeHidden();
    });
});