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
import { isCameraListOpen, getCameraList, cameraAnnihilator, layoutAnnihilator, groupAnnihilator, configurationCollector, userAnnihilator, roleAnnihilator, waitAnimationEnds, timeToSeconds, authorization } from "../utils/utils.js";


test.describe("Common block", () => {

    test.beforeAll(async () => {
        await getHostName();
        await configurationCollector();
        // await cameraAnnihilator("all");
        // await layoutAnnihilator("all");
        // await roleAnnihilator("all");
        // await userAnnihilator("all");
        // await deleteArchive('Black');
        // await createCamera(4, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "80", "1", "Camera", 0);
        // await addVirtualVideo(Configuration.cameras, "lprusa", "tracker");
        // await createLayout([Configuration.cameras[1], Configuration.cameras[2]], 2, 1, "Test Layout");
        // await createArchive("Black");
        // await createArchiveVolume("Black", 20);
        // await createArchiveContext("Black", [Configuration.cameras[0]], true, "High");
        // await createArchiveContext("Black", [Configuration.cameras[1]], false, "High");
        // await createArchiveContext("Black", [Configuration.cameras[2]], true, "Low");
        // await createArchiveContext("Black", [Configuration.cameras[3]], false, "Low");
    });

    // test.beforeEach(async ({ page }) => {

    // });
    
    
    test('Camera list without layouts (CLOUD-T113)', async ({ page }) => {
        
        await authorization(page, "root", "root");
        //Получаем веб-сокет объект видеостримов
        const WS = await page.waitForEvent("websocket", ws => ws.url().includes("/ws?") && !ws.isClosed());
        console.log(WS.url());
        // await page.pause();
        //Переходим в архив
        await page.getByRole('button', { name: 'Hardware' }).click();
        await page.locator('[data-testid="at-camera-list-item"]').first().click();
        await page.getByRole('button', { name: 'Single-camera archive'}).click(); //СДЕЛАТЬ СЕЛЕКТОРЫ
        //Кликаем на центр последнего записанного интервала
        const lastInterval = page.locator('.intervals').last().locator('rect').last(); //ПОМЕТИТЬ СЕЛЕКТОРАМИ ИНТЕРВАЛЫ АРХИВА СПРАВА
        await clickToInterval(lastInterval, 0.5);
        //Сохраняем время поинтера перед воспроизведением
        let startPointerTime = await page.locator('.control [role="none"] span').first().innerText(); //СДЕЛАТЬ СЕЛЕКТОРЫ
        //Кликаем на кнопку воспроизведения ждем сообщение о старте потока со скоростью 1
        let startCommand = WS.waitForEvent("framesent", data => data.payload.includes('"speed":1'));
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
        let stopCommand = WS.waitForEvent("framesent", data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId));
        startCommand = WS.waitForEvent("framesent", data => data.payload.includes('"speed":4'));
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
        stopCommand = WS.waitForEvent("framesent", data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId));
        await page.locator('#at-archive-control-play-pause').click();
        await stopCommand;
        //Ждем 2 секунды так как сообщения не прерываются мгновенно
        await page.waitForTimeout(2000);
        //Проверяем, что сообщения в WS остановлены
        await isMessagesStop(page, WS);

        //Перемещаем поинтер и переключаем воспроизведение на скорость x2 и воспроизводим
        await clickToInterval(lastInterval, 0.3);
        startPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        startCommand = WS.waitForEvent("framesent", data => data.payload.includes('"speed":2'));
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
        stopCommand = WS.waitForEvent("framesent", data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId));
        startCommand = WS.waitForEvent("framesent", data => data.payload.includes('"speed":-2'));
        await page.locator('#at-archive-controls [data-index="1"]').first().click();
        await expect(page.locator('.VideoCell--playing video').nth(0)).toBeVisible();
        await stopCommand;
        wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(lastPointerTime, startPointerTime);
        startPointerTime = lastPointerTime;

        //Переключаем восрпоизведение на скорость -x1 и проверяем, что предыдущий поток остановлен и инициирован новый
        stopCommand = WS.waitForEvent("framesent", data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId));
        startCommand = WS.waitForEvent("framesent", data => data.payload.includes('"speed":-1'));
        await page.locator('#at-archive-controls [data-index="2"]').first().click();
        await expect(page.locator('.VideoCell--playing video').nth(0)).toBeVisible();
        await stopCommand;
        wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(lastPointerTime, startPointerTime);

        //Перемещаем поинтер и проверяем что поток остановлен
        stopCommand = WS.waitForEvent("framesent", data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId));
        await clickToInterval(lastInterval, 0.7);
        await stopCommand;
        await page.waitForTimeout(2000);
        await isMessagesStop(page, WS);

        //Переключаем воспроизведение на скорость -x4 и воспроизводим
        startPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        startCommand = WS.waitForEvent("framesent", data => data.payload.includes('"speed":-4'));
        await page.locator('#at-archive-controls [data-index="0"]').first().click();
        await page.locator('#at-archive-control-play-pause').click();
        wsFrame = JSON.parse((await startCommand).payload.toString());
        await expect(page.locator('.VideoCell--playing video').nth(0)).toBeVisible();
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(lastPointerTime, startPointerTime);

        //Останавливаем видео и проверяем что отправилось соответсвующее сообщение в WS
        stopCommand = WS.waitForEvent("framesent", data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId));
        await page.locator('#at-archive-control-play-pause').click();
        await stopCommand;
        //Ждем 2 секунды так как сообщения не прерываются мгновенно
        await page.waitForTimeout(2000);
        //Проверяем, что сообщения в WS остановлены
        await isMessagesStop(page, WS);
        
        //Проверяем что веб-клиент не упал
        await expect(page.locator("body")).not.toHaveClass(/.*error.*/);
    });

});

async function isMessagesStop(page: Page, ws: WebSocket) {
    //Добавляем обработчик чтобы проверить останавку сообщений в WS и ждем 2 секунды
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

async function comparePointerPositions(startPos: string, lastPos: string) {
    console.log(`Начало воспроизведения: ${startPos}`);
    console.log(`Конец воспроизведения: ${lastPos}`);
    expect(timeToSeconds(startPos) < timeToSeconds(lastPos)).toBeTruthy();
}

async function clickToInterval(locator: Locator, height: number) {
   const h = await locator.getAttribute("height");
   const w = await locator.getAttribute("width");

   await locator.click( {position: {x: Number(w)/2, y: Number(h)*height}});
}
//Сделать функцию openCameraList
//Доработать функцию authorization