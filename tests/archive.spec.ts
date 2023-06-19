import { test, expect, type WebSocket, type Page, Locator} from '@playwright/test';
import { currentURL, Configuration, hostName } from '../global_variables';
import { createRole, setRolePermissions, deleteRoles, setObjectPermissions } from '../grpc_api/roles';
import { createUser, setUserPassword, assignUserRole, deleteUsers } from '../grpc_api/users';
import { createArchive, createArchiveVolume, createArchiveContext, deleteArchive, getArchiveList } from '../grpc_api/archives';
import { createGroup, setGroup, addCameraToGroup } from '../grpc_api/groups';
import { createCamera, deleteCameras, addVirtualVideo, changeSingleCameraActiveStatus, changeIPServerCameraActiveStatus, changeSingleCameraID, changeSingleCameraName, changeIPServerCameraID, changeIPServerCameraName} from '../grpc_api/cameras';
import { createLayout, deleteLayouts, } from '../grpc_api/layouts';
import { randomUUID } from 'node:crypto';
import { getHostName } from '../http_api/http_host';
import { isCameraListOpen, getCameraList, cameraAnnihilator, layoutAnnihilator, groupAnnihilator, configurationCollector, userAnnihilator, roleAnnihilator, waitAnimationEnds, timeToSeconds, authorization, openCameraList } from "../utils/utils.js";
let h264Cameras: any[], h265Cameras: any[], mjpegCameras:  any[];
let recordGenerated = false; //переменная показывает достаточен ли размер записи для начала теста

test.describe("Common block", () => {

    test.beforeAll(async () => {
        await getHostName();
        await configurationCollector();
        await cameraAnnihilator("all");
        await layoutAnnihilator("all");
        await roleAnnihilator("all");
        await userAnnihilator("all");
        await deleteArchive('Black');
        await createCamera(12, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "80", "1", "H264", 0);
        h264Cameras = Configuration.cameras.slice(0, 12);
        await addVirtualVideo(h264Cameras, "tracker", "tracker");
        await createCamera(9, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "80", "1", "H265", 12);
        h265Cameras = Configuration.cameras.slice(12, 21);
        await addVirtualVideo(h265Cameras, "H265-2K", "H265-2K");
        await createCamera(2, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "80", "1", "MJPEG", 21);
        mjpegCameras = Configuration.cameras.slice(21, 23);
        await addVirtualVideo(mjpegCameras, "witcher_mjpeg", "witcher_mjpeg");
        await createArchive("Black");
        await createArchiveVolume("Black", 30);
        await createArchiveContext("Black", Configuration.cameras, true, "High");
    });

    test.beforeEach(async ({ page }) => {
        await layoutAnnihilator("all");
    });
    
    
    test('X1 layout h264 play (CLOUD-T300)', async ({ page }) => {
        await createLayout(h264Cameras, 1, 1, "X1-H264");
        if (!recordGenerated) {
            await page.waitForTimeout(30000);
            recordGenerated = true;
        }
        await page.goto(currentURL);
        await authorization(page, "root", "root");
        //Получаем веб-сокет объект видеостримов
        const WS = await page.waitForEvent("websocket", ws => ws.url().includes("/ws?") && !ws.isClosed());
        console.log(WS.url());
        // await page.pause();
        //Переходим в архив
        await page.getByRole('button', { name: 'Single-camera archive'}).click(); //СДЕЛАТЬ СЕЛЕКТОРЫ
        await waitAnimationEnds(page, page.getByRole('tabpanel').nth(1)); ////СДЕЛАТЬ СЕЛЕКТОРЫ
        //Проверяем, что камера одна и с нужным кодеком/названием
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(1);
        await expect(page.locator('[data-testid="at-camera-title"]')).toContainText("H264");
        //Приближаем шкалу
        await page.locator('.intervals').last().locator('rect').last().hover()
        await page.mouse.wheel(0, -4000);
        //Кликаем на центр последнего записанного интервала
        const lastInterval = page.locator('.intervals').last().locator('rect').last();//ПОМЕТИТЬ СЕЛЕКТОРАМИ ИНТЕРВАЛЫ АРХИВА СПРАВА
        await clickToInterval(lastInterval, 0.5);
        //Сохраняем время поинтера перед воспроизведением
        let startPointerTime = await page.locator('.control [role="none"] span').first().innerText(); //СДЕЛАТЬ СЕЛЕКТОРЫ
        //Кликаем на кнопку воспроизведения и ждем сообщение о старте потока со скоростью 1
        let startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":1'), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await expect(page.locator('.VideoCell--playing video').nth(0)).toBeVisible();
        //Преобразуем сообщение в объект, чтобы дальше извлечь из него streamId
        let wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        let lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        startPointerTime = lastPointerTime;

        //Переключаем восрпоизведение на скорость x4 и проверяем, что предыдущий поток остановлен и инициирован новый
        let stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":4'), timeout: 10000 });
        await page.locator('#at-archive-controls [data-index="5"]').first().click();
        await expect(page.locator('.VideoCell--playing video').nth(0)).toBeVisible();
        await stopCommand;
        wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        //Останавливаем видео и проверяем что отправилось соответсвующее сообщение в WS
        stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 } );
        await page.locator('#at-archive-control-play-pause').click();
        await stopCommand;
        //Ждем 2 секунды так как сообщения не прерываются мгновенно
        await page.waitForTimeout(2000);
        //Проверяем, что сообщения в WS остановлены
        await isMessagesStop(page, WS);

        //Перемещаем поинтер, переключаем воспроизведение на скорость x2 и воспроизводим
        await clickToInterval(lastInterval, 0.3);
        startPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":2'), timeout: 10000 });
        await page.locator('#at-archive-controls [data-index="4"]').first().click();
        await page.locator('#at-archive-control-play-pause').click();
        wsFrame = JSON.parse((await startCommand).payload.toString());
        await expect(page.locator('.VideoCell--playing video').nth(0)).toBeVisible();
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        startPointerTime = lastPointerTime;

        //Переключаем восрпоизведение на скорость -x2 и проверяем, что предыдущий поток остановлен и инициирован новый
        stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":-2'), timeout: 10000 });
        await page.locator('#at-archive-controls [data-index="1"]').first().click();
        await expect(page.locator('.VideoCell--playing video').nth(0)).toBeVisible();
        await stopCommand;
        wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime, true);
        startPointerTime = lastPointerTime;

        //Переключаем восрпоизведение на скорость -x1 и проверяем, что предыдущий поток остановлен и инициирован новый
        stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":-1'), timeout: 10000 });
        await page.locator('#at-archive-controls [data-index="2"]').first().click();
        await expect(page.locator('.VideoCell--playing video').nth(0)).toBeVisible();
        await stopCommand;
        wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime, true);

        //Перемещаем поинтер и проверяем что поток остановлен
        stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        await clickToInterval(lastInterval, 0.7);
        await stopCommand;
        await page.waitForTimeout(2000);
        await isMessagesStop(page, WS);

        //Переключаем воспроизведение на скорость -x4 и воспроизводим
        startPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":-4'), timeout: 10000 });
        await page.locator('#at-archive-controls [data-index="0"]').first().click();
        await page.locator('#at-archive-control-play-pause').click();
        wsFrame = JSON.parse((await startCommand).payload.toString());
        await expect(page.locator('.VideoCell--playing video').nth(0)).toBeVisible();
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime, true);

        //Останавливаем видео и проверяем что отправилось соответсвующее сообщение в WS
        stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await stopCommand;
        //Ждем 2 секунды так как сообщения не прерываются мгновенно
        await page.waitForTimeout(2000);
        //Проверяем, что сообщения в WS остановлены
        await isMessagesStop(page, WS);
        
        //Проверяем что веб-клиент не упал
        await expect(page.locator("body")).not.toHaveClass(/.*error.*/);
    });

    test('X1 layout H265 play (CLOUD-T301)', async ({ page }) => {
        await createLayout(h265Cameras, 1, 1, "X1-H265");
        if (!recordGenerated) {
            await page.waitForTimeout(30000);
            recordGenerated = true;
        }
        await page.goto(currentURL);
        await authorization(page, "root", "root");
        //Получаем веб-сокет объект видеостримов
        const WS = await page.waitForEvent("websocket", ws => ws.url().includes("/ws?") && !ws.isClosed());
        console.log(WS.url());
        // await page.pause();
        //Переходим в архив
        await page.getByRole('button', { name: 'Single-camera archive'}).click(); //СДЕЛАТЬ СЕЛЕКТОРЫ
        await waitAnimationEnds(page, page.getByRole('tabpanel').nth(1)); ////СДЕЛАТЬ СЕЛЕКТОРЫ
        //Проверяем, что камера одна и с нужным кодеком/названием
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(1);
        await expect(page.locator('[data-testid="at-camera-title"]')).toContainText("H265");
        //Приближаем шкалу
        await page.locator('.intervals').last().locator('rect').last().hover()
        await page.mouse.wheel(0, -4000);
        //Кликаем на центр последнего записанного интервала
        const lastInterval = page.locator('.intervals').last().locator('rect').last();//ПОМЕТИТЬ СЕЛЕКТОРАМИ ИНТЕРВАЛЫ АРХИВА СПРАВА
        await clickToInterval(lastInterval, 0.5);
        //Сохраняем время поинтера перед воспроизведением
        let startPointerTime = await page.locator('.control [role="none"] span').first().innerText(); //СДЕЛАТЬ СЕЛЕКТОРЫ
        //Кликаем на кнопку воспроизведения и ждем сообщение о старте потока со скоростью 1
        let startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":1'), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await expect(page.locator('.VideoCell--playing video').nth(0)).toBeVisible();
        //Преобразуем сообщение в объект, чтобы дальше извлечь из него streamId
        let wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        let lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        startPointerTime = lastPointerTime;

        //Переключаем восрпоизведение на скорость x4 и проверяем, что предыдущий поток остановлен и инициирован новый
        let stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":4'), timeout: 10000 });
        await page.locator('#at-archive-controls [data-index="5"]').first().click();
        await expect(page.locator('.VideoCell--playing video').nth(0)).toBeVisible();
        await stopCommand;
        wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        //Останавливаем видео и проверяем что отправилось соответсвующее сообщение в WS
        stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 } );
        await page.locator('#at-archive-control-play-pause').click();
        await stopCommand;
        //Ждем 2 секунды так как сообщения не прерываются мгновенно
        await page.waitForTimeout(2000);
        //Проверяем, что сообщения в WS остановлены
        await isMessagesStop(page, WS);

        //Перемещаем поинтер, переключаем воспроизведение на скорость x2 и воспроизводим
        await clickToInterval(lastInterval, 0.3);
        startPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":2'), timeout: 10000 });
        await page.locator('#at-archive-controls [data-index="4"]').first().click();
        await page.locator('#at-archive-control-play-pause').click();
        wsFrame = JSON.parse((await startCommand).payload.toString());
        await expect(page.locator('.VideoCell--playing video').nth(0)).toBeVisible();
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        startPointerTime = lastPointerTime;

        //Переключаем восрпоизведение на скорость -x2 и проверяем, что предыдущий поток остановлен и инициирован новый
        stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":-2'), timeout: 10000 });
        await page.locator('#at-archive-controls [data-index="1"]').first().click();
        await expect(page.locator('.VideoCell--playing video').nth(0)).toBeVisible();
        await stopCommand;
        wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime, true);
        startPointerTime = lastPointerTime;

        //Переключаем восрпоизведение на скорость -x1 и проверяем, что предыдущий поток остановлен и инициирован новый
        stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":-1'), timeout: 10000 });
        await page.locator('#at-archive-controls [data-index="2"]').first().click();
        await expect(page.locator('.VideoCell--playing video').nth(0)).toBeVisible();
        await stopCommand;
        wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime, true);

        //Перемещаем поинтер и проверяем что поток остановлен
        stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        await clickToInterval(lastInterval, 0.7);
        await stopCommand;
        await page.waitForTimeout(2000);
        await isMessagesStop(page, WS);

        //Переключаем воспроизведение на скорость -x4 и воспроизводим
        startPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":-4'), timeout: 10000 });
        await page.locator('#at-archive-controls [data-index="0"]').first().click();
        await page.locator('#at-archive-control-play-pause').click();
        wsFrame = JSON.parse((await startCommand).payload.toString());
        await expect(page.locator('.VideoCell--playing video').nth(0)).toBeVisible();
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime, true);

        //Останавливаем видео и проверяем что отправилось соответсвующее сообщение в WS
        stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await stopCommand;
        //Ждем 2 секунды так как сообщения не прерываются мгновенно
        await page.waitForTimeout(2000);
        //Проверяем, что сообщения в WS остановлены
        await isMessagesStop(page, WS);
        
        //Проверяем что веб-клиент не упал
        await expect(page.locator("body")).not.toHaveClass(/.*error.*/);
    });

    test('X12 layout H264 play (CLOUD-T302)', async ({ page }) => {
        await createLayout(h264Cameras, 4, 3, "X12-H264");
        if (!recordGenerated) {
            await page.waitForTimeout(30000);
            recordGenerated = true;
        }
        await page.goto(currentURL);
        await authorization(page, "root", "root");
        //Получаем веб-сокет объект видеостримов
        const WS = await page.waitForEvent("websocket", ws => ws.url().includes("/ws?") && !ws.isClosed());
        console.log(WS.url());
        // await page.pause();
        //Переходим в архив
        await page.getByRole('button', { name: 'Multi-camera archive'}).click(); //СДЕЛАТЬ СЕЛЕКТОРЫ
        await waitAnimationEnds(page, page.getByRole('tabpanel').nth(1)); ////СДЕЛАТЬ СЕЛЕКТОРЫ
        //Проверяем, что камер 12 и с нужными кодеком/названием
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(12);
        for (let cameraName of await page.locator('[data-testid="at-camera-title"]').all()) {
            await expect(cameraName).toContainText("H264");
        }
        //Приближаем шкалу
        await page.locator('.intervals').last().locator('rect').last().hover()
        await page.mouse.wheel(0, -4000);
        //Кликаем на центр последнего записанного интервала
        const lastInterval = page.locator('.intervals').last().locator('rect').last();//ПОМЕТИТЬ СЕЛЕКТОРАМИ ИНТЕРВАЛЫ АРХИВА СПРАВА
        await clickToInterval(lastInterval, 0.5);
        //Сохраняем время поинтера перед воспроизведением
        let startPointerTime = await page.locator('.control [role="none"] span').first().innerText(); //СДЕЛАТЬ СЕЛЕКТОРЫ
        //Кликаем на кнопку воспроизведения и ждем сообщение о старте потока со скоростью 1
        let startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":1'), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(12);
        //Преобразуем сообщение в объект, чтобы дальше извлечь из него streamId
        let wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        let lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        startPointerTime = lastPointerTime;

        //Переключаем восрпоизведение на скорость x4 и проверяем, что предыдущий поток остановлен и инициирован новый
        let stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":4'), timeout: 10000 });
        await page.locator('#at-archive-controls [data-index="5"]').first().click();
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(12);
        await stopCommand;
        wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        //Останавливаем видео и проверяем что отправилось соответсвующее сообщение в WS
        stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 } );
        await page.locator('#at-archive-control-play-pause').click();
        await stopCommand;
        //Ждем 2 секунды так как сообщения не прерываются мгновенно
        await page.waitForTimeout(2000);
        //Проверяем, что сообщения в WS остановлены
        await isMessagesStop(page, WS);

        //Перемещаем поинтер, переключаем воспроизведение на скорость x2 и воспроизводим
        await clickToInterval(lastInterval, 0.3);
        startPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":2'), timeout: 10000 });
        await page.locator('#at-archive-controls [data-index="4"]').first().click();
        await page.locator('#at-archive-control-play-pause').click();
        wsFrame = JSON.parse((await startCommand).payload.toString());
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(12);
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        startPointerTime = lastPointerTime;

        //Переключаем восрпоизведение на скорость -x2 и проверяем, что предыдущий поток остановлен и инициирован новый
        stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":-2'), timeout: 10000 });
        await page.locator('#at-archive-controls [data-index="1"]').first().click();
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(12);
        await stopCommand;
        wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime, true);
        startPointerTime = lastPointerTime;

        //Переключаем восрпоизведение на скорость -x1 и проверяем, что предыдущий поток остановлен и инициирован новый
        stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":-1'), timeout: 10000 });
        await page.locator('#at-archive-controls [data-index="2"]').first().click();
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(12);
        await stopCommand;
        wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime, true);

        //Перемещаем поинтер и проверяем что поток остановлен
        stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        await clickToInterval(lastInterval, 0.7);
        await stopCommand;
        await page.waitForTimeout(2000);
        await isMessagesStop(page, WS);

        //Переключаем воспроизведение на скорость -x4 и воспроизводим
        startPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":-4'), timeout: 10000 });
        await page.locator('#at-archive-controls [data-index="0"]').first().click();
        await page.locator('#at-archive-control-play-pause').click();
        wsFrame = JSON.parse((await startCommand).payload.toString());
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(12);
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime, true);

        //Останавливаем видео и проверяем что отправилось соответсвующее сообщение в WS
        stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await stopCommand;
        //Ждем 2 секунды так как сообщения не прерываются мгновенно
        await page.waitForTimeout(2000);
        //Проверяем, что сообщения в WS остановлены
        await isMessagesStop(page, WS);
        
        //Проверяем что веб-клиент не упал
        await expect(page.locator("body")).not.toHaveClass(/.*error.*/);
    });

    test('X9 layout H265 play (CLOUD-T303)', async ({ page }) => {
        await createLayout(h265Cameras, 3, 3, "X9-H265");
        if (!recordGenerated) {
            await page.waitForTimeout(30000);
            recordGenerated = true;
        }
        await page.goto(currentURL);
        await authorization(page, "root", "root");
        //Получаем веб-сокет объект видеостримов
        const WS = await page.waitForEvent("websocket", ws => ws.url().includes("/ws?") && !ws.isClosed());
        console.log(WS.url());
        // await page.pause();
        //Переходим в архив
        await page.getByRole('button', { name: 'Multi-camera archive'}).click(); //СДЕЛАТЬ СЕЛЕКТОРЫ
        await waitAnimationEnds(page, page.getByRole('tabpanel').nth(1)); ////СДЕЛАТЬ СЕЛЕКТОРЫ
        //Проверяем, что камер 9 и с нужными кодеком/названием
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(9);
        for (let cameraName of await page.locator('[data-testid="at-camera-title"]').all()) {
            await expect(cameraName).toContainText("H265");
        }
        //Приближаем шкалу
        await page.locator('.intervals').last().locator('rect').last().hover()
        await page.mouse.wheel(0, -4000);
        //Кликаем на центр последнего записанного интервала
        const lastInterval = page.locator('.intervals').last().locator('rect').last();//ПОМЕТИТЬ СЕЛЕКТОРАМИ ИНТЕРВАЛЫ АРХИВА СПРАВА
        await clickToInterval(lastInterval, 0.5);
        //Сохраняем время поинтера перед воспроизведением
        let startPointerTime = await page.locator('.control [role="none"] span').first().innerText(); //СДЕЛАТЬ СЕЛЕКТОРЫ
        //Кликаем на кнопку воспроизведения и ждем сообщение о старте потока со скоростью 1
        let startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":1'), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(9);
        //Преобразуем сообщение в объект, чтобы дальше извлечь из него streamId
        let wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        let lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        startPointerTime = lastPointerTime;

        //Переключаем восрпоизведение на скорость x4 и проверяем, что предыдущий поток остановлен и инициирован новый
        let stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":4'), timeout: 10000 });
        await page.locator('#at-archive-controls [data-index="5"]').first().click();
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(9);
        await stopCommand;
        wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        //Останавливаем видео и проверяем что отправилось соответсвующее сообщение в WS
        stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 } );
        await page.locator('#at-archive-control-play-pause').click();
        await stopCommand;
        //Ждем 2 секунды так как сообщения не прерываются мгновенно
        await page.waitForTimeout(2000);
        //Проверяем, что сообщения в WS остановлены
        await isMessagesStop(page, WS);

        //Перемещаем поинтер, переключаем воспроизведение на скорость x2 и воспроизводим
        await clickToInterval(lastInterval, 0.3);
        startPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":2'), timeout: 10000 });
        await page.locator('#at-archive-controls [data-index="4"]').first().click();
        await page.locator('#at-archive-control-play-pause').click();
        wsFrame = JSON.parse((await startCommand).payload.toString());
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(9);
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        startPointerTime = lastPointerTime;

        //Переключаем восрпоизведение на скорость -x2 и проверяем, что предыдущий поток остановлен и инициирован новый
        stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":-2'), timeout: 10000 });
        await page.locator('#at-archive-controls [data-index="1"]').first().click();
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(9);
        await stopCommand;
        wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime, true);
        startPointerTime = lastPointerTime;

        //Переключаем восрпоизведение на скорость -x1 и проверяем, что предыдущий поток остановлен и инициирован новый
        stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":-1'), timeout: 10000 });
        await page.locator('#at-archive-controls [data-index="2"]').first().click();
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(9);
        await stopCommand;
        wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime, true);

        //Перемещаем поинтер и проверяем что поток остановлен
        stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        await clickToInterval(lastInterval, 0.7);
        await stopCommand;
        await page.waitForTimeout(2000);
        await isMessagesStop(page, WS);

        //Переключаем воспроизведение на скорость -x4 и воспроизводим
        startPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":-4'), timeout: 10000 });
        await page.locator('#at-archive-controls [data-index="0"]').first().click();
        await page.locator('#at-archive-control-play-pause').click();
        wsFrame = JSON.parse((await startCommand).payload.toString());
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(9);
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime, true);

        //Останавливаем видео и проверяем что отправилось соответсвующее сообщение в WS
        stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await stopCommand;
        //Ждем 2 секунды так как сообщения не прерываются мгновенно
        await page.waitForTimeout(2000);
        //Проверяем, что сообщения в WS остановлены
        await isMessagesStop(page, WS);
        
        //Проверяем что веб-клиент не упал
        await expect(page.locator("body")).not.toHaveClass(/.*error.*/);
    });

    test('X16 layout H264/H265/MJPEG play (CLOUD-T304)', async ({ page }) => {
        let mixedArr = Array();
        for (let i = 0; i < 16; i++) {
            if (i < 8) {
                mixedArr.push(h264Cameras[i]);
            } else if (i < 14) {
                mixedArr.push(h265Cameras[i-8]);
            } else if (i < 16) {
                mixedArr.push(mjpegCameras[i-14]);
            }
        }
        console.log(mixedArr);
        await createLayout(mixedArr, 4, 4, "X16-MIXED");
        if (!recordGenerated) {
            await page.waitForTimeout(30000);
            recordGenerated = true;
        }
        await page.goto(currentURL);
        await authorization(page, "root", "root");
        //Получаем веб-сокет объект видеостримов
        const WS = await page.waitForEvent("websocket", ws => ws.url().includes("/ws?") && !ws.isClosed());
        console.log(WS.url());
        // await page.pause();
        //Переходим в архив
        await page.getByRole('button', { name: 'Multi-camera archive'}).click(); //СДЕЛАТЬ СЕЛЕКТОРЫ
        await waitAnimationEnds(page, page.getByRole('tabpanel').nth(1)); ////СДЕЛАТЬ СЕЛЕКТОРЫ
        //Проверяем, что камер 16 и с нужными кодеком/названием
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(16);
        for (let i = 0; i < 16; i++) {
            if (i < 8) {
                await expect(page.locator('[data-testid="at-camera-title"]').nth(i)).toContainText("H264");
            } else if (i < 14) {
                await expect(page.locator('[data-testid="at-camera-title"]').nth(i)).toContainText("H265");
            } else if (i < 16) {
                await expect(page.locator('[data-testid="at-camera-title"]').nth(i)).toContainText("MJPEG");
            }
        }
        
        //Приближаем шкалу
        await page.locator('.intervals').last().locator('rect').last().hover()
        await page.mouse.wheel(0, -4000);
        //Кликаем на центр последнего записанного интервала
        const lastInterval = page.locator('.intervals').last().locator('rect').last();//ПОМЕТИТЬ СЕЛЕКТОРАМИ ИНТЕРВАЛЫ АРХИВА СПРАВА
        await clickToInterval(lastInterval, 0.5);
        //Сохраняем время поинтера перед воспроизведением
        let startPointerTime = await page.locator('.control [role="none"] span').first().innerText(); //СДЕЛАТЬ СЕЛЕКТОРЫ
        //Кликаем на кнопку воспроизведения и ждем сообщение о старте потоков со скоростью 1
        let mp4StartCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":1') && data.payload.includes('mp4'), timeout: 10000 });
        let mjpegStartCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":1') && data.payload.includes('jpeg'), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(14);
        await expect(page.locator('.VideoCell--playing img')).toHaveCount(2);
        //Преобразуем сообщения в объект, чтобы дальше извлечь из них streamId
        let wsFrameMP4 = JSON.parse((await mp4StartCommand).payload.toString());
        let wsFrameMJPEG = JSON.parse((await mjpegStartCommand).payload.toString());
        //Проверяем количество камер в каждом массиве воспроизведения
        expect(wsFrameMP4.entities.length).toEqual(14);
        expect(wsFrameMJPEG.entities.length).toEqual(2);
        //Играем видео 10 секунд
        await page.waitForTimeout(10000);
        //Сравниваем время в начале воспроизведения и в конце
        let lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        startPointerTime = lastPointerTime;

        //Переключаем восрпоизведение на скорость x2 и проверяем, что предыдущие потоки остановлены и инициированы новые
        let mp4StopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrameMP4.streamId), timeout: 10000 });
        let mjpegStopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrameMJPEG.streamId), timeout: 10000 });
        mp4StartCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":2') && data.payload.includes('mp4'), timeout: 10000 });
        mjpegStartCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":2') && data.payload.includes('jpeg'), timeout: 10000 });
        await page.locator('#at-archive-controls [data-index="4"]').first().click();
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(14);
        await expect(page.locator('.VideoCell--playing img')).toHaveCount(2);
        await mp4StopCommand;
        await mjpegStopCommand;
        wsFrameMP4 = JSON.parse((await mp4StartCommand).payload.toString());
        wsFrameMJPEG = JSON.parse((await mjpegStartCommand).payload.toString());
        //Проверяем количество камер в каждом массиве воспроизведения
        expect(wsFrameMP4.entities.length).toEqual(14);
        expect(wsFrameMJPEG.entities.length).toEqual(2);
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        //Останавливаем видео и проверяем что отправилось соответсвующее сообщение в WS
        mp4StopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrameMP4.streamId), timeout: 10000 });
        mjpegStopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrameMJPEG.streamId), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await mp4StopCommand;
        await mjpegStopCommand;
        //Ждем 2 секунды так как сообщения не прерываются мгновенно
        await page.waitForTimeout(2000);
        //Проверяем, что сообщения в WS остановлены
        await isMessagesStop(page, WS);

        //Перемещаем поинтер, переключаем воспроизведение на скорость -x2 и воспроизводим
        await clickToInterval(lastInterval, 0.7);
        startPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        mp4StartCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":-2') && data.payload.includes('mp4'), timeout: 10000 });
        mjpegStartCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":-2') && data.payload.includes('jpeg'), timeout: 10000 });
        await page.locator('#at-archive-controls [data-index="1"]').first().click();
        await page.locator('#at-archive-control-play-pause').click();
        wsFrameMP4 = JSON.parse((await mp4StartCommand).payload.toString());
        wsFrameMJPEG = JSON.parse((await mjpegStartCommand).payload.toString());
        //Проверяем количество камер в каждом массиве воспроизведения
        expect(wsFrameMP4.entities.length).toEqual(14);
        expect(wsFrameMJPEG.entities.length).toEqual(2);
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(14);
        await expect(page.locator('.VideoCell--playing img')).toHaveCount(2);
        //Играем видео 10 секунд
        await page.waitForTimeout(10000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime, true);
        startPointerTime = lastPointerTime;

        //Переключаем восрпоизведение на скорость -x1 и проверяем, что предыдущий поток остановлен и инициирован новый
        mp4StopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrameMP4.streamId), timeout: 10000 });
        mjpegStopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrameMJPEG.streamId), timeout: 10000 });
        mp4StartCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":-1') && data.payload.includes('mp4'), timeout: 10000 });
        mjpegStartCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":-1') && data.payload.includes('jpeg'), timeout: 10000 });
        await page.locator('#at-archive-controls [data-index="2"]').first().click();
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(14);
        await expect(page.locator('.VideoCell--playing img')).toHaveCount(2);
        await mp4StopCommand;
        await mjpegStopCommand;
        wsFrameMP4 = JSON.parse((await mp4StartCommand).payload.toString());
        wsFrameMJPEG = JSON.parse((await mjpegStartCommand).payload.toString());
        //Проверяем количество камер в каждом массиве воспроизведения
        expect(wsFrameMP4.entities.length).toEqual(14);
        expect(wsFrameMJPEG.entities.length).toEqual(2);
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime, true);
        startPointerTime = lastPointerTime;

        //Останавливаем видео и проверяем что отправилось соответсвующее сообщение в WS
        mp4StopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrameMP4.streamId), timeout: 10000 });
        mjpegStopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrameMJPEG.streamId), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await mp4StopCommand;
        await mjpegStopCommand;
        //Ждем 2 секунды так как сообщения не прерываются мгновенно
        await page.waitForTimeout(2000);
        //Проверяем, что сообщения в WS остановлены
        await isMessagesStop(page, WS);
        
        //Проверяем что веб-клиент не упал
        await expect(page.locator("body")).not.toHaveClass(/.*error.*/);
    });
});

async function isMessagesStop(page: Page, ws: WebSocket) {
    //Добавляем обработчик, чтобы проверить останавку сообщений в WS и ждем 2 секунды
    let recivedFrame = false;

    function handler(wsEvent) {
        console.log(wsEvent.payload);
        recivedFrame = true;
    }

    ws.on('framereceived', handler);

    await page.waitForTimeout(2000);
    expect(recivedFrame).toBeFalsy();

    ws.removeListener('framereceived', handler);
}

async function comparePointerPositions(startPos: string, lastPos: string, reversePlay = false) {
    if (reversePlay) {
        console.log(`Pointer start time: ${startPos}`);
        console.log(`Pointer stop time: ${lastPos}`);
        expect(timeToSeconds(startPos) > timeToSeconds(lastPos)).toBeTruthy();
    } else {
        console.log(`Pointer start time: ${startPos}`);
        console.log(`Pointer stop time: ${lastPos}`);
        expect(timeToSeconds(startPos) < timeToSeconds(lastPos)).toBeTruthy();
    }
    
}

async function clickToInterval(locator: Locator, height: number) {
    const h = await locator.getAttribute("height");
    const w = await locator.getAttribute("width");
    await locator.click({position: {x: Number(w)/2, y: Number(h)*height}});
}