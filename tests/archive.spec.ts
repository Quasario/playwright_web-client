import { test, expect, type WebSocket, type Page, Locator} from '@playwright/test';
import { currentURL, Configuration, hostName } from '../global_variables';
import { createRole, setRolePermissions, deleteRoles, setObjectPermissions } from '../grpc_api/roles';
import { createUser, setUserPassword, assignUserRole, deleteUsers } from '../grpc_api/users';
import { createArchive, createArchiveVolume, createArchiveContext, deleteArchive, getArchiveList, getArchiveContext, changeArchiveContext } from '../grpc_api/archives';
import { createGroup, setGroup, addCameraToGroup } from '../grpc_api/groups';
import { createCamera, deleteCameras, addVirtualVideo, changeSingleCameraActiveStatus, changeIPServerCameraActiveStatus, changeSingleCameraID, changeSingleCameraName, changeIPServerCameraID, changeIPServerCameraName, changeMicrophoneStatus} from '../grpc_api/cameras';
import { createLayout, deleteLayouts, } from '../grpc_api/layouts';
import { randomUUID } from 'node:crypto';
import { getHostName } from '../http_api/http_host';
import { getArchiveIntervals, transformISOtime } from '../http_api/http_archives';
import { isCameraListOpen, getCameraList, cameraAnnihilator, layoutAnnihilator, groupAnnihilator, configurationCollector, userAnnihilator, roleAnnihilator, waitAnimationEnds, timeToSeconds, authorization, openCameraList } from "../utils/utils.js";
let h264Cameras: any[], h265Cameras: any[], mjpegCameras:  any[];
let recordGenerated = false; //переменная показывает достаточен ли размер записи для начала теста

test.describe("Common block", () => {

    test.beforeAll(async () => {
        await getHostName();
        await configurationCollector();
        // await cameraAnnihilator("all");
        // await layoutAnnihilator("all");
        // await roleAnnihilator("all");
        // await userAnnihilator("all");
        // await deleteArchive('Black');
        // await createCamera(12, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "80", "", "H264", 0);
        // await createCamera(9, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "80", "", "H265", 12);
        // await createCamera(2, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "80", "", "MJPEG", 21);
        h264Cameras = Configuration.cameras.slice(0, 12);
        h265Cameras = Configuration.cameras.slice(12, 21);
        mjpegCameras = Configuration.cameras.slice(21, 23);
        // await addVirtualVideo(h264Cameras, "tracker", "tracker");
        // await addVirtualVideo(h265Cameras, "H265-2K", "H265-2K");
        // await addVirtualVideo(mjpegCameras, "witcher_mjpeg", "witcher_mjpeg");
        // await createArchive("Black");
        // await createArchiveVolume("Black", 30);
        // await createArchiveContext("Black", Configuration.cameras, true, "High");
    });

    test.beforeEach(async ({ page }) => {
        await layoutAnnihilator("all");
    });
    
    
    test('X1 layout h264 playback (CLOUD-T300)', async ({ page }) => {
        await createLayout(h264Cameras, 1, 1, "X1-H264");
        //Проверяем, что записи достаточно
        await isRecordEnough(page);
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

        //Устанавливаем видимый интервал в центр архивной шкалы и скролим (приближаем)
        await scrollLastInterval(page);
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

    test('X1 layout H265 playback (CLOUD-T301)', async ({ page }) => {
        await createLayout(h265Cameras, 1, 1, "X1-H265");
        //Проверяем, что записи достаточно
        await isRecordEnough(page);
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

        //Устанавливаем видимый интервал в центр архивной шкалы и скролим (приближаем)
        await scrollLastInterval(page);
        //Кликаем на центр последнего записанного интервала
        await waitAnimationEnds(page, page.getByRole('tabpanel').nth(1));
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
        //Проверяем, что записи достаточно
        await isRecordEnough(page);
        await page.goto(currentURL);
        await authorization(page, "root", "root");
        //Получаем веб-сокет объект видеостримов
        const WS = await page.waitForEvent("websocket", ws => ws.url().includes("/ws?") && !ws.isClosed());
        console.log(WS.url());
        // await page.pause();

        //Переходим в архив
        await page.getByRole('button', { name: 'Multi-camera archive'}).click(); //СДЕЛАТЬ СЕЛЕКТОРЫ
        await waitAnimationEnds(page, page.getByRole('tabpanel').nth(1)); ////СДЕЛАТЬ СЕЛЕКТОРЫ
        //Проверяем, что камер 12 и с нужными кодеками/названиями
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(12);
        for (let cameraName of await page.locator('[data-testid="at-camera-title"]').all()) {
            await expect(cameraName).toContainText("H264");
        }

        //Устанавливаем видимый интервал в центр архивной шкалы и скролим (приближаем)
        await scrollLastInterval(page);
        //Кликаем на центр последнего записанного интервала
        await waitAnimationEnds(page, page.getByRole('tabpanel').nth(1));
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

    test('X9 layout H265 playback (CLOUD-T303)', async ({ page }) => {
        await createLayout(h265Cameras, 3, 3, "X9-H265");
        //Проверяем, что записи достаточно
        await isRecordEnough(page);
        await page.goto(currentURL);
        await authorization(page, "root", "root");
        //Получаем веб-сокет объект видеостримов
        const WS = await page.waitForEvent("websocket", ws => ws.url().includes("/ws?") && !ws.isClosed());
        console.log(WS.url());
        // await page.pause();

        //Переходим в архив
        await page.getByRole('button', { name: 'Multi-camera archive'}).click(); //СДЕЛАТЬ СЕЛЕКТОРЫ
        await waitAnimationEnds(page, page.getByRole('tabpanel').nth(1)); ////СДЕЛАТЬ СЕЛЕКТОРЫ
        //Проверяем, что камер 9 и с нужными кодеками/названиями
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(9);
        for (let cameraName of await page.locator('[data-testid="at-camera-title"]').all()) {
            await expect(cameraName).toContainText("H265");
        }

        //Устанавливаем видимый интервал в центр архивной шкалы и скролим (приближаем)
        await scrollLastInterval(page);
        //Кликаем на центр последнего записанного интервала
        await waitAnimationEnds(page, page.getByRole('tabpanel').nth(1));
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

    test('X16 layout H264/H265/MJPEG playback (CLOUD-T304)', async ({ page }) => {

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

        await createLayout(mixedArr, 4, 4, "X16-MIXED");
        //Проверяем, что записи достаточно
        await isRecordEnough(page);
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
        
        //Устанавливаем видимый интервал в центр архивной шкалы и скролим (приближаем)
        await scrollLastInterval(page);
        //Кликаем на центр последнего записанного интервала
        await waitAnimationEnds(page, page.getByRole('tabpanel').nth(1));
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

    test('Layout playback with camera recording disabled (CLOUD-T306)', async ({ page }) => {

        await createCamera(1, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "80", "", "H264 Empty", -1);
        const lastCamera = Configuration.cameras[Configuration.cameras.length - 1];
        await addVirtualVideo([lastCamera], "tracker", "tracker");
        await createArchiveContext("Black", [lastCamera], false, "High");
        await createLayout([h264Cameras[0], h264Cameras[1], h265Cameras[0], lastCamera], 2, 2, "Without record");
        //Проверяем, что записи достаточно
        await isRecordEnough(page);
        await page.goto(currentURL);
        await authorization(page, "root", "root");
        //Получаем веб-сокет объект видеостримов
        const WS = await page.waitForEvent("websocket", ws => ws.url().includes("/ws?") && !ws.isClosed());
        console.log(WS.url());
        // await page.pause();

        //Переходим в архив
        await page.getByRole('button', { name: 'Multi-camera archive'}).click(); //СДЕЛАТЬ СЕЛЕКТОРЫ
        await waitAnimationEnds(page, page.getByRole('tabpanel').nth(1)); ////СДЕЛАТЬ СЕЛЕКТОРЫ
        //Проверяем, что камер 4 и с нужными кодеком/названием
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(4);
        await expect(page.locator('[data-testid="at-camera-title"]').nth(0)).toContainText("H264");
        await expect(page.locator('[data-testid="at-camera-title"]').nth(1)).toContainText("H264");
        await expect(page.locator('[data-testid="at-camera-title"]').nth(2)).toContainText("H265");
        await expect(page.locator('[data-testid="at-camera-title"]').nth(3)).toContainText("H264 Empty");
        //Проверяем, что на последней камере есть баннер про пустой орхив
        await expect(page.locator('.VideoCell__info-container').last()).toHaveText("No records in archive", { ignoreCase: false });
        await expect(page.locator('.VideoCell__info-container svg').last()).toBeVisible();

        //Устанавливаем видимый интервал в центр архивной шкалы и скролим (приближаем)
        await scrollLastInterval(page);
        //Кликаем на центр последнего записанного интервала
        await waitAnimationEnds(page, page.getByRole('tabpanel').nth(1));
        const lastInterval = page.locator('.intervals').last().locator('rect').last();//ПОМЕТИТЬ СЕЛЕКТОРАМИ ИНТЕРВАЛЫ АРХИВА СПРАВА
        await clickToInterval(lastInterval, 0.3);
        // await page.pause();

        //Сохраняем время поинтера перед воспроизведением
        let startPointerTime = await page.locator('.control [role="none"] span').first().innerText(); //СДЕЛАТЬ СЕЛЕКТОРЫ
        //Кликаем на кнопку воспроизведения и ждем сообщение о старте потоков со скоростью 1
        let startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":1'), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(3);
        await expect(page.locator('.VideoCell__info-container').last()).toHaveText("No records in archive", { ignoreCase: false });
        await expect(page.locator('.VideoCell__info-container svg').last()).toBeVisible();
        //Преобразуем сообщения в объект, чтобы дальше извлечь из них streamId
        let wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        let lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        startPointerTime = lastPointerTime;

        //Выбираем вторую камеру
        await page.locator('[role="gridcell"]').nth(1).click();
        //Проверяем, что видео не останавилось и сообщение о пустом архиве присутсвует
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(3);
        await expect(page.locator('.VideoCell__info-container').last()).toHaveText("No records in archive", { ignoreCase: false });
        await expect(page.locator('.VideoCell__info-container svg').last()).toBeVisible();
        //Играем видео 3 секунды
        await page.waitForTimeout(3000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        startPointerTime = lastPointerTime;

        //Ставим архив на паузу и проверяем, что поток команд прекратился
        let stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await stopCommand;
        //Ждем 2 секунды так как сообщения не прерываются мгновенно
        await page.waitForTimeout(2000);
        //Проверяем, что сообщения в WS остановлены
        await isMessagesStop(page, WS);

        //Кликаем на кнопку воспроизведения и ждем сообщение о старте потоков со скоростью 1
        startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":1'), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(3);
        await expect(page.locator('.VideoCell__info-container').last()).toHaveText("No records in archive", { ignoreCase: false });
        await expect(page.locator('.VideoCell__info-container svg').last()).toBeVisible();
        //Преобразуем сообщения в объект, чтобы дальше извлечь из них streamId
        wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        startPointerTime = lastPointerTime;

        //Выбираем третью камеру
        await page.locator('[role="gridcell"]').nth(2).click();
        //Проверяем, что видео не останавилось и сообщение о пустом архиве присутсвует
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(3);
        await expect(page.locator('.VideoCell__info-container').last()).toHaveText("No records in archive", { ignoreCase: false });
        await expect(page.locator('.VideoCell__info-container svg').last()).toBeVisible();
        //Играем видео 3 секунды
        await page.waitForTimeout(3000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        startPointerTime = lastPointerTime;

        //Ставим архив на паузу и проверяем, что поток команд прекратился
        stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await stopCommand;
        //Ждем 2 секунды так как сообщения не прерываются мгновенно
        await page.waitForTimeout(2000);
        //Проверяем, что сообщения в WS остановлены
        await isMessagesStop(page, WS);

        //Кликаем на кнопку воспроизведения и ждем сообщение о старте потоков со скоростью 1
        startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":1'), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(3);
        await expect(page.locator('.VideoCell__info-container').last()).toHaveText("No records in archive", { ignoreCase: false });
        await expect(page.locator('.VideoCell__info-container svg').last()).toBeVisible();
        //Преобразуем сообщения в объект, чтобы дальше извлечь из них streamId
        wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        startPointerTime = lastPointerTime;

        //Выбираем четвертую камеру
        await page.locator('[role="gridcell"]').nth(3).click();
        //Проверяем, что видео не останавилось и сообщение о пустом архиве присутсвует
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(3);
        await expect(page.locator('.VideoCell__info-container').last()).toHaveText("No records in archive", { ignoreCase: false });
        await expect(page.locator('.VideoCell__info-container svg').last()).toBeVisible();
        //Играем видео 3 секунды
        await page.waitForTimeout(3000);

        //Ставим архив на паузу и проверяем, что поток команд прекратился
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

    test('Layout playback with no camera archive (CLOUD-T307)', async ({ page }) => {

        await createCamera(1, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "80", "", "H264 No Archive", -1);
        const lastCamera = Configuration.cameras[Configuration.cameras.length - 1];
        await addVirtualVideo([lastCamera], "tracker", "tracker");
        await createLayout([h264Cameras[0], h264Cameras[1], h265Cameras[0], lastCamera], 2, 2, "Without archive");
        //Проверяем, что записи достаточно
        await isRecordEnough(page);

        await page.goto(currentURL);
        await authorization(page, "root", "root");
        //Получаем веб-сокет объект видеостримов
        const WS = await page.waitForEvent("websocket", ws => ws.url().includes("/ws?") && !ws.isClosed());
        console.log(WS.url());
        // await page.pause();

        //Переходим в архив
        await page.getByRole('button', { name: 'Multi-camera archive'}).click(); //СДЕЛАТЬ СЕЛЕКТОРЫ
        await waitAnimationEnds(page, page.getByRole('tabpanel').nth(1)); ////СДЕЛАТЬ СЕЛЕКТОРЫ
        //Проверяем, что камер 4 и с нужными кодеком/названием
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(4);
        await expect(page.locator('[data-testid="at-camera-title"]').nth(0)).toContainText("H264");
        await expect(page.locator('[data-testid="at-camera-title"]').nth(1)).toContainText("H264");
        await expect(page.locator('[data-testid="at-camera-title"]').nth(2)).toContainText("H265");
        await expect(page.locator('[data-testid="at-camera-title"]').nth(3)).toContainText("H264 No Archive");
        //Проверяем, что на последней камере есть баннер про пустой орхив
        await expect(page.locator('.VideoCell__info-container').last()).toHaveText("No records in archive", { ignoreCase: false });
        await expect(page.locator('.VideoCell__info-container svg').last()).toBeVisible();

        //Устанавливаем видимый интервал в центр архивной шкалы и скролим (приближаем)
        await scrollLastInterval(page);
        //Кликаем на центр последнего записанного интервала
        await waitAnimationEnds(page, page.getByRole('tabpanel').nth(1));
        const lastInterval = page.locator('.intervals').last().locator('rect').last();//ПОМЕТИТЬ СЕЛЕКТОРАМИ ИНТЕРВАЛЫ АРХИВА СПРАВА
        await clickToInterval(lastInterval, 0.3);
        // await page.pause();

        //Сохраняем время поинтера перед воспроизведением
        let startPointerTime = await page.locator('.control [role="none"] span').first().innerText(); //СДЕЛАТЬ СЕЛЕКТОРЫ
        //Кликаем на кнопку воспроизведения и ждем сообщение о старте потоков со скоростью 1
        let startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":1'), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(3);
        await expect(page.locator('.VideoCell__info-container').last()).toHaveText("No records in archive", { ignoreCase: false });
        await expect(page.locator('.VideoCell__info-container svg').last()).toBeVisible();
        //Преобразуем сообщения в объект, чтобы дальше извлечь из них streamId
        let wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        let lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        startPointerTime = lastPointerTime;

        //Выбираем вторую камеру
        await page.locator('[role="gridcell"]').nth(1).click();
        //Проверяем, что видео не останавилось и сообщение о пустом архиве присутсвует
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(3);
        await expect(page.locator('.VideoCell__info-container').last()).toHaveText("No records in archive", { ignoreCase: false });
        await expect(page.locator('.VideoCell__info-container svg').last()).toBeVisible();
        //Играем видео 3 секунды
        await page.waitForTimeout(3000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        startPointerTime = lastPointerTime;

        //Ставим архив на паузу и проверяем, что поток команд прекратился
        let stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await stopCommand;
        //Ждем 2 секунды так как сообщения не прерываются мгновенно
        await page.waitForTimeout(2000);
        //Проверяем, что сообщения в WS остановлены
        await isMessagesStop(page, WS);

        //Кликаем на кнопку воспроизведения и ждем сообщение о старте потоков со скоростью 1
        startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":1'), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(3);
        await expect(page.locator('.VideoCell__info-container').last()).toHaveText("No records in archive", { ignoreCase: false });
        await expect(page.locator('.VideoCell__info-container svg').last()).toBeVisible();
        //Преобразуем сообщения в объект, чтобы дальше извлечь из них streamId
        wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        startPointerTime = lastPointerTime;

        //Выбираем третью камеру
        await page.locator('[role="gridcell"]').nth(2).click();
        //Проверяем, что видео не останавилось и сообщение о пустом архиве присутсвует
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(3);
        await expect(page.locator('.VideoCell__info-container').last()).toHaveText("No records in archive", { ignoreCase: false });
        await expect(page.locator('.VideoCell__info-container svg').last()).toBeVisible();
        //Играем видео 3 секунды
        await page.waitForTimeout(3000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        startPointerTime = lastPointerTime;

        //Ставим архив на паузу и проверяем, что поток команд прекратился
        stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await stopCommand;
        //Ждем 2 секунды так как сообщения не прерываются мгновенно
        await page.waitForTimeout(2000);
        //Проверяем, что сообщения в WS остановлены
        await isMessagesStop(page, WS);

        //Кликаем на кнопку воспроизведения и ждем сообщение о старте потоков со скоростью 1
        startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":1'), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(3);
        await expect(page.locator('.VideoCell__info-container').last()).toHaveText("No records in archive", { ignoreCase: false });
        await expect(page.locator('.VideoCell__info-container svg').last()).toBeVisible();
        //Преобразуем сообщения в объект, чтобы дальше извлечь из них streamId
        wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        startPointerTime = lastPointerTime;

        //Выбираем четвертую камеру
        await page.locator('[role="gridcell"]').nth(3).click();
        //Проверяем, что видео не останавилось и сообщение о пустом архиве присутсвует
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(3);
        await expect(page.locator('.VideoCell__info-container').last()).toHaveText("No records in archive", { ignoreCase: false });
        await expect(page.locator('.VideoCell__info-container svg').last()).toBeVisible();
        //Играем видео 3 секунды
        await page.waitForTimeout(3000);

        //Ставим архив на паузу и проверяем, что поток команд прекратился
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

    test('Layout playback with duplicate camera (CLOUD-T307)', async ({ page }) => {

        await createLayout([h264Cameras[0], h264Cameras[1], h265Cameras[0], h264Cameras[0]], 2, 2, "Duplicate camera");
        //Проверяем, что записи достаточно
        await isRecordEnough(page);

        await page.goto(currentURL);
        await authorization(page, "root", "root");
        //Получаем веб-сокет объект видеостримов
        const WS = await page.waitForEvent("websocket", ws => ws.url().includes("/ws?") && !ws.isClosed());
        console.log(WS.url());
        // await page.pause();
        
        //Переходим в архив
        await page.getByRole('button', { name: 'Multi-camera archive'}).click(); //СДЕЛАТЬ СЕЛЕКТОРЫ
        await waitAnimationEnds(page, page.getByRole('tabpanel').nth(1)); ////СДЕЛАТЬ СЕЛЕКТОРЫ
        //Проверяем, что камер 4 и с нужными кодеком/названием
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(4);
        await expect(page.locator('[data-testid="at-camera-title"]').nth(0)).toContainText("H264");
        await expect(page.locator('[data-testid="at-camera-title"]').nth(1)).toContainText("H264");
        await expect(page.locator('[data-testid="at-camera-title"]').nth(2)).toContainText("H265");
        await expect(page.locator('[data-testid="at-camera-title"]').nth(3)).toContainText("H264");
        //Проверяем, что активны 2 камеры сразу
        await expect(page.locator('.VideoCell--active')).toHaveCount(2);

        //Устанавливаем видимый интервал в центр шкалы и скролим (приближаем)
        await scrollLastInterval(page);
        //Кликаем на центр последнего записанного интервала
        await waitAnimationEnds(page, page.getByRole('tabpanel').nth(1));
        const lastInterval = page.locator('.intervals').last().locator('rect').last();//ПОМЕТИТЬ СЕЛЕКТОРАМИ ИНТЕРВАЛЫ АРХИВА СПРАВА
        await clickToInterval(lastInterval, 0.3);
        // await page.pause();

        //Сохраняем время поинтера перед воспроизведением
        let startPointerTime = await page.locator('.control [role="none"] span').first().innerText(); //СДЕЛАТЬ СЕЛЕКТОРЫ
        //Кликаем на кнопку воспроизведения и ждем сообщение о старте потоков со скоростью 1
        let startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":1'), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(4);
        //Преобразуем сообщения в объект, чтобы дальше извлечь из них streamId
        let wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        let lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        startPointerTime = lastPointerTime;

        //Ставим архив на паузу и проверяем, что поток команд прекратился
        let stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await stopCommand;
        //Ждем 2 секунды так как сообщения не прерываются мгновенно
        await page.waitForTimeout(2000);
        //Проверяем, что сообщения в WS остановлены
        await isMessagesStop(page, WS);

        //Сохраняем время поинтера перед воспроизведением
        startPointerTime = await page.locator('.control [role="none"] span').first().innerText(); //СДЕЛАТЬ СЕЛЕКТОРЫ
        //Кликаем на кнопку воспроизведения и ждем сообщение о старте потоков со скоростью 1
        startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":1'), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(4);
        //Преобразуем сообщения в объект, чтобы дальше извлечь из них streamId
        wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 3 секунды
        await page.waitForTimeout(3000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        startPointerTime = lastPointerTime;

        //Переключаем восрпоизведение на скорость x2 и проверяем, что предыдущий поток остановлен и инициирован новый
        stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":2'), timeout: 10000 });
        await page.locator('#at-archive-controls [data-index="4"]').first().click();
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(4);
        await stopCommand;
        wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        startPointerTime = lastPointerTime;

        //Выбираем вторую камеру
        await page.locator('[role="gridcell"]').nth(1).click();
        //Проверяем, что видео не останавилось
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(4);
        //Играем видео 3 секунды
        await page.waitForTimeout(3000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        startPointerTime = lastPointerTime;

        //Ставим архив на паузу и проверяем, что поток команд прекратился
        stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await stopCommand;
        //Ждем 2 секунды так как сообщения не прерываются мгновенно
        await page.waitForTimeout(2000);
        //Проверяем, что сообщения в WS остановлены
        await isMessagesStop(page, WS);

        //Выбираем третью камеру
        await page.locator('[role="gridcell"]').nth(2).click();
        //Переключаем восрпоизведение на скорость x1 и воспроизводим
        await page.locator('#at-archive-controls [data-index="3"]').first().click();
        startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":1'), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(4);
        wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        startPointerTime = lastPointerTime;

        //Выбираем четвертую камеру
        await page.locator('[role="gridcell"]').nth(3).click();
        //Проверяем, что видео не останавилось
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(4);
        //Играем видео 3 секунды
        await page.waitForTimeout(3000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        startPointerTime = lastPointerTime;

        //Ставим архив на паузу и проверяем, что поток команд прекратился
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

    test('Switching between solo and layout playback (CLOUD-T308)', async ({ page }) => {

        await createLayout([h264Cameras[0], h264Cameras[1], h265Cameras[0], h265Cameras[1]], 2, 2, "Transition");
        //Проверяем, что записи достаточно
        await isRecordEnough(page);

        await page.goto(currentURL);
        await authorization(page, "root", "root");
        //Получаем веб-сокет объект видеостримов
        const WS = await page.waitForEvent("websocket", ws => ws.url().includes("/ws?") && !ws.isClosed());
        console.log(WS.url());
        // await page.pause();
        //Переходим в архив
        await page.getByRole('button', { name: 'Multi-camera archive'}).click(); //СДЕЛАТЬ СЕЛЕКТОРЫ
        await waitAnimationEnds(page, page.getByRole('tabpanel').nth(1)); ////СДЕЛАТЬ СЕЛЕКТОРЫ
        //Проверяем, что камер 4 и с нужными кодеком/названием
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(4);
        await expect(page.locator('[data-testid="at-camera-title"]').nth(0)).toContainText("H264");
        await expect(page.locator('[data-testid="at-camera-title"]').nth(1)).toContainText("H264");
        await expect(page.locator('[data-testid="at-camera-title"]').nth(2)).toContainText("H265");
        await expect(page.locator('[data-testid="at-camera-title"]').nth(3)).toContainText("H265");

        //Устанавливаем видимый интервал в центр шкалы и скролим (приближаем)
        await scrollLastInterval(page);
        //Кликаем на центр последнего записанного интервала
        await waitAnimationEnds(page, page.getByRole('tabpanel').nth(1));
        const lastInterval = page.locator('.intervals').last().locator('rect').last();//ПОМЕТИТЬ СЕЛЕКТОРАМИ ИНТЕРВАЛЫ АРХИВА СПРАВА
        await clickToInterval(lastInterval, 0.3);
        // await page.pause();

        //Сохраняем время поинтера перед воспроизведением
        let startPointerTime = await page.locator('.control [role="none"] span').first().innerText(); //СДЕЛАТЬ СЕЛЕКТОРЫ
        //Кликаем на кнопку воспроизведения и ждем сообщение о старте потоков со скоростью 1
        let startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":1') && data.payload.includes('entities'), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(4);
        //Преобразуем сообщения в объект, чтобы дальше извлечь из них streamId
        let wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        let lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        startPointerTime = lastPointerTime;

        //Дважды кликаем на первую камеру и проверяем, что видео остановлено
        let stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        await page.locator('[role="gridcell"]').nth(0).dblclick();
        await stopCommand;
        //Ждем 2 секунды так как сообщения не прерываются мгновенно
        await page.waitForTimeout(2000);
        //Проверяем, что сообщения в WS остановлены
        await isMessagesStop(page, WS);
        //Проверяем что на экране нужный однократор
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(1);
        await expect(page.locator('[data-testid="at-camera-title"]').nth(0)).toContainText("H264");

        //Кликаем на кнопку воспроизведения и ждем сообщение о старте потоков со скоростью 1 и в режиме однократера (нет entities)
        startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":1') && !data.payload.includes('entities'), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(1);
        //Преобразуем сообщения в объект, чтобы дальше извлечь из них streamId
        wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        startPointerTime = lastPointerTime;

        //Дважды кликаем на первую камеру и проверяем, что видео остановлено
        stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        await page.locator('[role="gridcell"]').nth(0).dblclick();
        await stopCommand;
        //Ждем 2 секунды так как сообщения не прерываются мгновенно
        await page.waitForTimeout(2000);
        //Проверяем, что сообщения в WS остановлены
        await isMessagesStop(page, WS);
        //Проверяем что на экране раскладка
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(4);

        //Кликаем на кнопку воспроизведения и ждем сообщение о старте потоков со скоростью 1
        startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":1') && data.payload.includes('entities'), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(4);
        //Преобразуем сообщения в объект, чтобы дальше извлечь из них streamId
        wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        startPointerTime = lastPointerTime;
        
        //Дважды кликаем на последнюю камеру и проверяем, что видео остановлено
        stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        await page.locator('[role="gridcell"]').nth(3).dblclick();
        await stopCommand;
        //Ждем 2 секунды так как сообщения не прерываются мгновенно
        await page.waitForTimeout(2000);
        //Проверяем, что сообщения в WS остановлены
        await isMessagesStop(page, WS);
        //Проверяем что на экране нужный однократор
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(1);
        await expect(page.locator('[data-testid="at-camera-title"]').nth(0)).toContainText("H265");

        //Кликаем на кнопку воспроизведения и ждем сообщение о старте потоков со скоростью 1 и в режиме однократера (нет entities)
        startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":1') && !data.payload.includes('entities'), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(1);
        //Преобразуем сообщения в объект, чтобы дальше извлечь из них streamId
        wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        startPointerTime = lastPointerTime;

        //Ставим архив на паузу и проверяем, что поток команд прекратился
        stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await stopCommand;
        //Ждем 2 секунды так как сообщения не прерываются мгновенно
        await page.waitForTimeout(2000);
        //Проверяем, что сообщения в WS остановлены
        await isMessagesStop(page, WS);

        //Дважды кликаем на камеру 
        await page.locator('[role="gridcell"]').nth(0).dblclick();
        //Проверяем что на экране раскладка
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(4);

        //Кликаем на кнопку воспроизведения и ждем сообщение о старте потоков со скоростью 1
        startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":1') && data.payload.includes('entities'), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(4);
        //Преобразуем сообщения в объект, чтобы дальше извлечь из них streamId
        wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        startPointerTime = lastPointerTime;

        //Ставим архив на паузу и проверяем, что поток команд прекратился
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

    test('Switch layout while playing (CLOUD-T309)', async ({ page }) => {

        await createLayout([h264Cameras[0], h265Cameras[0], h264Cameras[1], h265Cameras[1]], 2, 2, "Full");
        await createLayout([h265Cameras[1], h264Cameras[1]], 2, 1, "Half 2");
        await createLayout([h264Cameras[0], h265Cameras[0]], 2, 1, "Half 1");
        //Проверяем, что записи достаточно
        await isRecordEnough(page);

        await page.goto(currentURL);
        await authorization(page, "root", "root");
        //Получаем веб-сокет объект видеостримов
        const WS = await page.waitForEvent("websocket", ws => ws.url().includes("/ws?") && !ws.isClosed());
        console.log(WS.url());
        // await page.pause();
        //Переходим в архив
        await page.getByRole('button', { name: 'Multi-camera archive'}).click(); //СДЕЛАТЬ СЕЛЕКТОРЫ
        await waitAnimationEnds(page, page.getByRole('tabpanel').nth(1)); ////СДЕЛАТЬ СЕЛЕКТОРЫ
        //Проверяем, что камер 2 и с нужными кодеком/названием
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(2);
        await expect(page.locator('[data-testid="at-camera-title"]').nth(0)).toContainText("H264");
        await expect(page.locator('[data-testid="at-camera-title"]').nth(1)).toContainText("H265");
        //Проверяем, что активна первая камера
        await expect(page.locator('.VideoCell').nth(0)).toHaveClass(/.*VideoCell--active.*/);

        //Устанавливаем видимый интервал в центр шкалы и скролим (приближаем)
        await scrollLastInterval(page);
        //Кликаем на центр последнего записанного интервала
        await waitAnimationEnds(page, page.getByRole('tabpanel').nth(1));
        const lastInterval = page.locator('.intervals').last().locator('rect').last();//ПОМЕТИТЬ СЕЛЕКТОРАМИ ИНТЕРВАЛЫ АРХИВА СПРАВА
        await clickToInterval(lastInterval, 0.3);
        // await page.pause();

        //Сохраняем время поинтера перед воспроизведением
        let startPointerTime = await page.locator('.control [role="none"] span').first().innerText(); //СДЕЛАТЬ СЕЛЕКТОРЫ
        //Кликаем на кнопку воспроизведения и ждем сообщение о старте потоков со скоростью 1
        let startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":1'), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(2);
        //Преобразуем сообщения в объект, чтобы дальше извлечь из них streamId
        let wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        let lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        startPointerTime = lastPointerTime;

        //Выбираем вторую раскладку и проверяем, что видео остановлено
        await page.locator('#at-layout-expand').click();
        await waitAnimationEnds(page, page.locator('#at-layout-items'));
        let stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        await page.locator('#at-layout-item-1').click({ force: true });
        await stopCommand;
        //Ждем 2 секунды так как сообщения не прерываются мгновенно
        await page.waitForTimeout(2000);
        //Проверяем, что сообщения в WS остановлены
        await isMessagesStop(page, WS);
        //Проверяем, что на экране нужная раскладка
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(2);
        await expect(page.locator('[data-testid="at-camera-title"]').nth(0)).toContainText("H265");
        await expect(page.locator('[data-testid="at-camera-title"]').nth(1)).toContainText("H264");
        //Проверяем, что активна первая камера
        await expect(page.locator('.VideoCell').nth(0)).toHaveClass(/.*VideoCell--active.*/);

        //Кликаем на кнопку воспроизведения и ждем сообщение о старте потоков со скоростью 1
        startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":1'), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(2);
        //Преобразуем сообщения в объект, чтобы дальше извлечь из них streamId
        wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        startPointerTime = lastPointerTime;

        //Ставим архив на паузу и проверяем, что поток команд прекратился
        stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await stopCommand;
        //Ждем 2 секунды так как сообщения не прерываются мгновенно
        await page.waitForTimeout(2000);
        //Проверяем, что сообщения в WS остановлены
        await isMessagesStop(page, WS);

        //Выбираем третью раскладку и проверяем, что видео остановлено
        await page.locator('#at-layout-expand').click();
        await waitAnimationEnds(page, page.locator('#at-layout-items'));
        await page.locator('#at-layout-item-2').click({ force: true });
        //Проверяем, что на экране нужная раскладка
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(4);
        await expect(page.locator('[data-testid="at-camera-title"]').nth(0)).toContainText("H264");
        await expect(page.locator('[data-testid="at-camera-title"]').nth(1)).toContainText("H265");
        await expect(page.locator('[data-testid="at-camera-title"]').nth(2)).toContainText("H264");
        await expect(page.locator('[data-testid="at-camera-title"]').nth(3)).toContainText("H265");
        //Проверяем, что активна последняя камера
        await expect(page.locator('.VideoCell').nth(3)).toHaveClass(/.*VideoCell--active.*/);

        //Кликаем на кнопку воспроизведения и ждем сообщение о старте потоков со скоростью 1
        startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":1'), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(4);
        //Преобразуем сообщения в объект, чтобы дальше извлечь из них streamId
        wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);
        startPointerTime = lastPointerTime;

        //Ставим архив на паузу и проверяем, что поток команд прекратился
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

    test('Switch archive while playing (CLOUD-T310)', async ({ page }) => {
        await deleteArchive("White");
        await createArchive("White");
        await createArchiveVolume("White", 1);
        await createArchiveContext("White", [h264Cameras[0], h264Cameras[1], h265Cameras[0], h265Cameras[1]], true, "High");
        await createLayout([h264Cameras[0], h264Cameras[1], h265Cameras[0], h265Cameras[1]], 2, 2, "Full");
        //Проверяем, что записи достаточно
        await isRecordEnough(page);

        await page.goto(currentURL);
        await authorization(page, "root", "root");
        //Получаем веб-сокет объект видеостримов
        const WS = await page.waitForEvent("websocket", ws => ws.url().includes("/ws?") && !ws.isClosed());
        console.log(WS.url());
        // await page.pause();
        //Переходим в архив
        await page.getByRole('button', { name: 'Multi-camera archive' }).click(); //СДЕЛАТЬ СЕЛЕКТОРЫ
        await waitAnimationEnds(page, page.getByRole('tabpanel').nth(1)); ////СДЕЛАТЬ СЕЛЕКТОРЫ
        //Проверяем, что камер 4 и с нужными кодеком/названием
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(4);
        await expect(page.locator('[data-testid="at-camera-title"]').nth(0)).toContainText("H264");
        await expect(page.locator('[data-testid="at-camera-title"]').nth(1)).toContainText("H264");
        await expect(page.locator('[data-testid="at-camera-title"]').nth(2)).toContainText("H265");
        await expect(page.locator('[data-testid="at-camera-title"]').nth(3)).toContainText("H265");
        
        //Устанавливаем видимый интервал в центр шкалы и скролим (приближаем)
        await scrollLastInterval(page);
        //Кликаем на центр последнего записанного интервала
        await waitAnimationEnds(page, page.getByRole('tabpanel').nth(1));
        const lastInterval = page.locator('.intervals').last().locator('rect').last();//ПОМЕТИТЬ СЕЛЕКТОРАМИ ИНТЕРВАЛЫ АРХИВА СПРАВА
        await clickToInterval(lastInterval, 0.3);
        // await page.pause();

        //Сохраняем время поинтера перед воспроизведением
        let startPointerTime = await page.locator('.control [role="none"] span').first().innerText(); //СДЕЛАТЬ СЕЛЕКТОРЫ
        //Кликаем на кнопку воспроизведения и ждем сообщение о старте потоков со скоростью 1
        let startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":1'), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(4);
        //Преобразуем сообщения в объект, чтобы дальше извлечь из них streamId
        let wsFrame = JSON.parse((await startCommand).payload.toString());
        //Проверяем, что у все камер воспроизводят Black архив
        expect(wsFrame.entities[0].archive.includes('Black')).toBeTruthy();
        expect(wsFrame.entities[1].archive.includes('Black')).toBeTruthy(); 
        expect(wsFrame.entities[2].archive.includes('Black')).toBeTruthy(); 
        expect(wsFrame.entities[3].archive.includes('Black')).toBeTruthy();
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        let lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);

        //Переключаем архив на первой камере
        await page.getByRole('button', { name: 'Black' }).nth(0).click();
        let stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        await page.getByRole('option', { name: 'White' }).click();
        await stopCommand;
        //Ждем 2 секунды так как сообщения не прерываются мгновенно
        await page.waitForTimeout(2000);
        //Проверяем, что сообщения в WS остановлены
        await isMessagesStop(page, WS);

        //Кликаем на кнопку воспроизведения и ждем сообщение о старте потоков со скоростью 1
        startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":1'), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(4);
        //Преобразуем сообщения в объект, чтобы дальше извлечь из них streamId
        wsFrame = JSON.parse((await startCommand).payload.toString());
        //Сохраняем время поинтера
        startPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        //Проверяем, что у первой камеры архив White, у остальных Black
        expect(wsFrame.entities[0].archive.includes('White')).toBeTruthy();
        expect(wsFrame.entities[1].archive.includes('Black')).toBeTruthy(); 
        expect(wsFrame.entities[2].archive.includes('Black')).toBeTruthy(); 
        expect(wsFrame.entities[3].archive.includes('Black')).toBeTruthy();
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);

        //Ставим архив на паузу и проверяем, что поток команд прекратился
        stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await stopCommand;
        //Ждем 2 секунды так как сообщения не прерываются мгновенно
        await page.waitForTimeout(2000);
        //Проверяем, что сообщения в WS остановлены
        await isMessagesStop(page, WS);

        //Переключаем архив на всех камерах
        await page.getByRole('button', { name: 'Black' }).nth(0).click();
        await page.getByRole('option', { name: 'White' }).click();
        await page.getByRole('button', { name: 'Black' }).nth(0).click();
        await page.getByRole('option', { name: 'White' }).click();
        await page.getByRole('button', { name: 'Black' }).nth(0).click();
        await page.getByRole('option', { name: 'White' }).click();

        //Кликаем на кнопку воспроизведения и ждем сообщение о старте потоков со скоростью 1
        startCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('"speed":1'), timeout: 10000 });
        await page.locator('#at-archive-control-play-pause').click();
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(4);
        //Преобразуем сообщения в объект, чтобы дальше извлечь из них streamId
        wsFrame = JSON.parse((await startCommand).payload.toString());
        startPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        //Проверяем, что все камеры воспроизводят архив White
        expect(wsFrame.entities[0].archive.includes('White')).toBeTruthy();
        expect(wsFrame.entities[1].archive.includes('White')).toBeTruthy(); 
        expect(wsFrame.entities[2].archive.includes('White')).toBeTruthy(); 
        expect(wsFrame.entities[3].archive.includes('White')).toBeTruthy();
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        lastPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        await comparePointerPositions(startPointerTime, lastPointerTime);

        //Переключаем архив на последней камере
        await page.getByRole('button', { name: 'White' }).nth(3).click();
        stopCommand = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId), timeout: 10000 });
        await page.getByRole('option', { name: 'Black' }).click();
        await stopCommand;
        //Ждем 2 секунды так как сообщения не прерываются мгновенно
        await page.waitForTimeout(2000);
        //Проверяем, что сообщения в WS остановлены
        await isMessagesStop(page, WS);

        //Проверяем что веб-клиент не упал
        await expect(page.locator("body")).not.toHaveClass(/.*error.*/);
    });

    test('Correct codec presentation (CLOUD-T311)', async ({ page }) => {
        await createCamera(1, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "80", "", "H265/H264 High", -1);
        await createCamera(1, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "80", "", "H265/H264 Low", -1);
        await createCamera(1, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "80", "", "H264/MJPEG High", -1);
        let addedCameras = [Configuration.cameras[Configuration.cameras.length - 3], Configuration.cameras[Configuration.cameras.length - 2], Configuration.cameras[Configuration.cameras.length - 1]]
        await addVirtualVideo([addedCameras[0]], "H265-2K", "tracker");
        await addVirtualVideo([addedCameras[1]], "H265-2K", "tracker");
        await addVirtualVideo([addedCameras[2]], "tracker", "witcher_mjpeg");
        await createArchiveContext("Black", [addedCameras[0]], true, "High");
        await createArchiveContext("Black", [addedCameras[1]], true, "Low");
        await createArchiveContext("Black", [addedCameras[2]], true, "High");
        await createLayout([addedCameras[0], addedCameras[1], addedCameras[2]], 3, 1, "Codecs representation");
        //Проверяем, что записи достаточно
        await isRecordEnough(page);

        await page.goto(currentURL);
        await authorization(page, "root", "root");
        //Получаем веб-сокет объект видеостримов
        const WS = await page.waitForEvent("websocket", ws => ws.url().includes("/ws?") && !ws.isClosed());
        console.log(WS.url());
        // await page.pause();
        //Активируем дебаг панель
        await page.locator('img').first().dblclick();
        //Переключаем все камеры на высокий поток
        await page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(0).click();
        await page.getByRole('option', { name: 'High' }).click();
        await page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(0).click();
        await page.getByRole('option', { name: 'High' }).click();
        await page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_AUTO"]').nth(0).click();
        await page.getByRole('option', { name: 'High' }).click();

        //Переходим в архив
        await page.getByRole('button', { name: 'Multi-camera archive' }).click(); //СДЕЛАТЬ СЕЛЕКТОРЫ
        await waitAnimationEnds(page, page.getByRole('tabpanel').nth(1)); ////СДЕЛАТЬ СЕЛЕКТОРЫ
        //Проверяем, что в ячейках указаны верные кодеки
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(3);
        await expect(page.locator('.VideoCell__debug').nth(0)).toContainText("H265");
        await expect(page.locator('.VideoCell__debug').nth(1)).toContainText("H264");
        await expect(page.locator('.VideoCell__debug').nth(2)).toContainText("H264");

        //Кликаем на кнопку воспроизведения
        await page.locator('#at-archive-control-play-pause').click();
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(3);
        //Играем видео 3 секунды
        await page.waitForTimeout(3000);
        //Проверяем, что в ячейках указаны верные кодеки
        await expect(page.locator('.VideoCell__debug').nth(0)).toContainText("H265");
        await expect(page.locator('.VideoCell__debug').nth(1)).toContainText("H264");
        await expect(page.locator('.VideoCell__debug').nth(2)).toContainText("H264");

        //Выходим в лайв режим
        await page.locator('#at-app-mode-live').click();

        //Переключаем все камеры на низкий поток
        await page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_HIGH"]').nth(0).click();
        await page.getByRole('option', { name: 'Low' }).click();
        await page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_HIGH"]').nth(0).click();
        await page.getByRole('option', { name: 'Low' }).click();
        await page.locator('[data-testid="at-camera-resolution-CAMERA_STREAM_RESOLUTION_HIGH"]').nth(0).click();
        await page.getByRole('option', { name: 'Low' }).click();

        //Переходим в архив
        await page.getByRole('button', { name: 'Multi-camera archive' }).click(); //СДЕЛАТЬ СЕЛЕКТОРЫ
        await waitAnimationEnds(page, page.getByRole('tabpanel').nth(1)); ////СДЕЛАТЬ СЕЛЕКТОРЫ
        //Проверяем, что в ячейках указаны верные кодеки
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(3);
        await expect(page.locator('.VideoCell__debug').nth(0)).toContainText("H265");
        await expect(page.locator('.VideoCell__debug').nth(1)).toContainText("H264");
        await expect(page.locator('.VideoCell__debug').nth(2)).toContainText("H264");

        //Кликаем на кнопку воспроизведения
        await page.locator('#at-archive-control-play-pause').click();
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(3);
        //Играем видео 3 секунды
        await page.waitForTimeout(3000);
        //Проверяем, что в ячейках указаны верные кодеки
        await expect(page.locator('.VideoCell__debug').nth(0)).toContainText("H265");
        await expect(page.locator('.VideoCell__debug').nth(1)).toContainText("H264");
        await expect(page.locator('.VideoCell__debug').nth(2)).toContainText("H264");

        //Проверяем что веб-клиент не упал
        await expect(page.locator("body")).not.toHaveClass(/.*error.*/);
    });

    test('Playback thru archive gap, when archive exists for other cameras (CLOUD-T312)', async ({ page }) => {
        //Проверяем, что записи достаточно
        await isRecordEnough(page);

        let contextList = await getArchiveContext("Black", [h264Cameras[0]]);
        await changeArchiveContext(contextList, false, "High");
        const archiveRecordOffTime = new Date();
        await page.waitForTimeout(10000);
        await changeArchiveContext(contextList, true, "High");
        await createLayout([h264Cameras[0], h264Cameras[1], h265Cameras[0], h265Cameras[1]], 2, 2, "Arhive Gap 1");

        await page.goto(currentURL);
        await authorization(page, "root", "root");
        //Получаем веб-сокет объект видеостримов
        const WS = await page.waitForEvent("websocket", ws => ws.url().includes("/ws?") && !ws.isClosed());
        console.log(WS.url());
        // await page.pause();

        //Переходим в архив
        await page.getByRole('button', { name: 'Multi-camera archive' }).click(); //СДЕЛАТЬ СЕЛЕКТОРЫ
        await waitAnimationEnds(page, page.getByRole('tabpanel').nth(1)); ////СДЕЛАТЬ СЕЛЕКТОРЫ
        //Проверяем, что в ячейках указаны верные кодеки
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(4);
        await expect(page.locator('[data-testid="at-camera-title"]').nth(0)).toContainText("H264");
        await expect(page.locator('[data-testid="at-camera-title"]').nth(1)).toContainText("H264");
        await expect(page.locator('[data-testid="at-camera-title"]').nth(2)).toContainText("H265");
        await expect(page.locator('[data-testid="at-camera-title"]').nth(3)).toContainText("H265");
        //Устанавливаем видимый интервал в центр шкалы и скролим (приближаем)
        await scrollLastInterval(page);
        //Выставляем время архива до пробела
        await page.locator('[data-testid="at-camera-time"]').nth(0).click();
        await page.locator('input[type="text"]').nth(0).fill(String(archiveRecordOffTime.getHours()));
        await page.locator('input[type="text"]').nth(1).fill(String(archiveRecordOffTime.getMinutes()));
        await page.locator('input[type="text"]').nth(2).fill(String(archiveRecordOffTime.getSeconds() - 3));
        await page.keyboard.press("Enter");

        //Кликаем на кнопку воспроизведения
        await page.locator('#at-archive-control-play-pause').click();
        //Ждем в течении 3 секунд, что видео нигде не останавилось
        let promice1 = videoIsPlaying(page, 0, 3);
        let promice2 = videoIsPlaying(page, 1, 3);
        let promice3 = videoIsPlaying(page, 2, 3);
        let promice4 = videoIsPlaying(page, 3, 3);
        expect(await promice1).toBeTruthy();
        expect(await promice2).toBeTruthy();
        expect(await promice3).toBeTruthy();
        expect(await promice4).toBeTruthy();

        //Ждем в течении 5 секунд, видео на первой ячейке должно было останавится
        promice1 = videoIsPlaying(page, 0, 5);
        promice2 = videoIsPlaying(page, 1, 5);
        promice3 = videoIsPlaying(page, 2, 5);
        promice4 = videoIsPlaying(page, 3, 5);
        expect(await promice1).toBeFalsy();
        expect(await promice2).toBeTruthy();
        expect(await promice3).toBeTruthy();
        expect(await promice4).toBeTruthy();

        //Ждем 10 секунд, чтобы перебраться через архивный пробел
        await page.waitForTimeout(10000);

        //Смотрим в течении 5 секунд, что видео везеде идет
        promice1 = videoIsPlaying(page, 0, 5);
        promice2 = videoIsPlaying(page, 1, 5);
        promice3 = videoIsPlaying(page, 2, 5);
        promice4 = videoIsPlaying(page, 3, 5);
        expect(await promice1).toBeTruthy();
        expect(await promice2).toBeTruthy();
        expect(await promice3).toBeTruthy();
        expect(await promice4).toBeTruthy();

        //Останваливаем воспроизведение
        await page.locator('#at-archive-control-play-pause').click();
        await page.waitForTimeout(2000);
        await isMessagesStop(page, WS);

        //Проверяем что веб-клиент не упал
        await expect(page.locator("body")).not.toHaveClass(/.*error.*/);
    });

    test('Playback thru archive gap, when archive not exists for other cameras (CLOUD-T313)', async ({ page }) => {
        //Проверяем, что записи достаточно
        await isRecordEnough(page);

        let contextList = await getArchiveContext("Black", [h264Cameras[2], h264Cameras[3], h265Cameras[2], h265Cameras[3]]);
        await changeArchiveContext(contextList, false, "High");
        const archiveRecordOffTime = new Date();
        await page.waitForTimeout(10000);
        await changeArchiveContext([contextList[3]], true, "High");
        await page.waitForTimeout(3000);
        await changeArchiveContext([contextList[2]], true, "High");
        await page.waitForTimeout(3000);
        await changeArchiveContext([contextList[0], contextList[1]], true, "High");
        await createLayout([h264Cameras[2], h264Cameras[3], h265Cameras[2], h265Cameras[3]], 2, 2, "Arhive Gap 2");

        await page.goto(currentURL);
        await authorization(page, "root", "root");
        //Получаем веб-сокет объект видеостримов
        const WS = await page.waitForEvent("websocket", ws => ws.url().includes("/ws?") && !ws.isClosed());
        console.log(WS.url());
        // await page.pause();

        //Переходим в архив
        await page.getByRole('button', { name: 'Multi-camera archive' }).click(); //СДЕЛАТЬ СЕЛЕКТОРЫ
        await waitAnimationEnds(page, page.getByRole('tabpanel').nth(1)); ////СДЕЛАТЬ СЕЛЕКТОРЫ
        //Проверяем, что в ячейках указаны верные кодеки
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(4);
        await expect(page.locator('[data-testid="at-camera-title"]').nth(0)).toContainText("H264");
        await expect(page.locator('[data-testid="at-camera-title"]').nth(1)).toContainText("H264");
        await expect(page.locator('[data-testid="at-camera-title"]').nth(2)).toContainText("H265");
        await expect(page.locator('[data-testid="at-camera-title"]').nth(3)).toContainText("H265");
        //Устанавливаем видимый интервал в центр шкалы и скролим (приближаем)
        await scrollLastInterval(page);
        //Выставляем время архива до пробела
        await page.locator('[data-testid="at-camera-time"]').nth(0).click();
        await page.locator('input[type="text"]').nth(0).fill(String(archiveRecordOffTime.getHours()));
        await page.locator('input[type="text"]').nth(1).fill(String(archiveRecordOffTime.getMinutes()));
        await page.locator('input[type="text"]').nth(2).fill(String(archiveRecordOffTime.getSeconds() - 3));
        await page.keyboard.press("Enter");

        //Кликаем на кнопку воспроизведения
        await page.locator('#at-archive-control-play-pause').click();
        //Ждем в течении 3 секунд, что видео нигде не останавилось
        let promice1 = videoIsPlaying(page, 0, 3);
        let promice2 = videoIsPlaying(page, 1, 3);
        let promice3 = videoIsPlaying(page, 2, 3);
        let promice4 = videoIsPlaying(page, 3, 3);
        expect(await promice1).toBeTruthy();
        expect(await promice2).toBeTruthy();
        expect(await promice3).toBeTruthy();
        expect(await promice4).toBeTruthy();

        //Ждем в течении 7 секунд, видео должно играть на последней камере
        promice1 = videoIsPlaying(page, 0, 7);
        promice2 = videoIsPlaying(page, 1, 7);
        promice3 = videoIsPlaying(page, 2, 7);
        promice4 = videoIsPlaying(page, 3, 7);
        expect(await promice1).toBeFalsy();
        expect(await promice2).toBeFalsy();
        expect(await promice3).toBeFalsy();
        expect(await promice4).toBeTruthy();

        //Смотрим в течении 7 секунд, видео должно идти на последних двух камерах
        promice1 = videoIsPlaying(page, 0, 7);
        promice2 = videoIsPlaying(page, 1, 7);
        promice3 = videoIsPlaying(page, 2, 7);
        promice4 = videoIsPlaying(page, 3, 7);
        expect(await promice1).toBeFalsy();
        expect(await promice2).toBeFalsy();
        expect(await promice3).toBeTruthy();
        expect(await promice4).toBeTruthy();

        //Смотрим в течении 7 секунд, видео должно идти на всех камерах
        promice1 = videoIsPlaying(page, 0, 7);
        promice2 = videoIsPlaying(page, 1, 7);
        promice3 = videoIsPlaying(page, 2, 7);
        promice4 = videoIsPlaying(page, 3, 7);
        expect(await promice1).toBeTruthy();
        expect(await promice2).toBeTruthy();
        expect(await promice3).toBeTruthy();
        expect(await promice4).toBeTruthy();

        //Останваливаем воспроизведение
        await page.locator('#at-archive-control-play-pause').click();
        await page.waitForTimeout(2000);
        await isMessagesStop(page, WS);

        //Проверяем что веб-клиент не упал
        await expect(page.locator("body")).not.toHaveClass(/.*error.*/);
    });

    test('Sound check (CLOUD-T314)', async ({ page }) => {

        await createCamera(2, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "80", "", "Sound Camera", -1);
        await createArchiveContext("Black", [Configuration.cameras[Configuration.cameras.length - 1], Configuration.cameras[Configuration.cameras.length - 2]], true, "High");
        await addVirtualVideo([Configuration.cameras[Configuration.cameras.length - 1], Configuration.cameras[Configuration.cameras.length - 2]], "witcher_640", "witcher_640");
        await changeMicrophoneStatus(Configuration.cameras[Configuration.cameras.length - 1], true);
        await changeMicrophoneStatus(Configuration.cameras[Configuration.cameras.length - 2], true);
        await createLayout([Configuration.cameras[Configuration.cameras.length - 1], Configuration.cameras[Configuration.cameras.length - 2]], 2, 1, "Sound test");

        await page.goto(currentURL);
        await authorization(page, "root", "root");

        //Получаем веб-сокет объект видеостримов
        const WS = await page.waitForEvent("websocket", ws => ws.url().includes("/ws?") && !ws.isClosed());
        console.log(WS.url());
        // await page.pause();

        //Проверяем, что микрофоны отображаются
        await expect(page.locator('[title="Microphone"]').nth(0)).toBeVisible();
        await expect(page.locator('[title="Microphone"]').nth(1)).toBeVisible();

        //Переходим в архив
        await page.getByRole('button', { name: 'Multi-camera archive' }).click(); //СДЕЛАТЬ СЕЛЕКТОРЫ
        await waitAnimationEnds(page, page.getByRole('tabpanel').nth(1)); ////СДЕЛАТЬ СЕЛЕКТОРЫ
        
        //Проверяем, что в ячейках указаны верные камеры
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(2);
        await expect(page.locator('[data-testid="at-camera-title"]').nth(0)).toContainText("Sound Camera");
        await expect(page.locator('[data-testid="at-camera-title"]').nth(1)).toContainText("Sound Camera");
        //Проверяем, что микрофоны не отображаются
        await expect(page.locator('[title="Microphone"]')).toBeHidden();

        //Устанавливаем видимый интервал в центр шкалы и скролим (приближаем)
        await scrollLastInterval(page);
        //Кликаем на центр последнего записанного интервала
        await waitAnimationEnds(page, page.getByRole('tabpanel').nth(1));
        const lastInterval = page.locator('.intervals').last().locator('rect').last();//ПОМЕТИТЬ СЕЛЕКТОРАМИ ИНТЕРВАЛЫ АРХИВА СПРАВА
        await clickToInterval(lastInterval, 0.3);

        //Переходим в одиночный режим двойным кликом по первой раскладке
        await page.locator('[role="gridcell"]').nth(0).dblclick();
        //Включаем микрофон
        await page.locator('[title="Microphone"]').click();

        //Кликаем на кнопку воспроизведения
        await page.locator('#at-archive-control-play-pause').click();
        //Проверяем, что звук включен и играем видео 5 секунд
        const isSoundOn = await page.evaluate(() => {
            const videoCell = document.querySelector('video');
            return !(videoCell!.muted);
        });
        expect(isSoundOn).toBeTruthy();
        await videoIsPlaying(page, 0, 10);

        //Возвращаемся на раскладку двойным кликом по камере
        await page.locator('[role="gridcell"]').dblclick();

        //Иконок звука быть не должно
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(2);
        await expect(page.locator('[title="Microphone"]')).toBeHidden();
        //Видео должно быть остановлено
        await page.waitForTimeout(2000);
        await isMessagesStop(page, WS);

        //Проверяем что веб-клиент не упал
        await expect(page.locator("body")).not.toHaveClass(/.*error.*/);
    });

    test('Pick layout from search tab (CLOUD-T315)', async ({ page }) => {
        await createLayout([h264Cameras[6], h264Cameras[7]], 2, 1, "Layout 2");
        await createLayout([h264Cameras[4], h264Cameras[5]], 2, 1, "Layout 1");

        await page.goto(currentURL);
        await authorization(page, "root", "root");

        //Получаем веб-сокет объект видеостримов
        const WS = await page.waitForEvent("websocket", ws => ws.url().includes("/ws?") && !ws.isClosed());
        console.log(WS.url());
        // await page.pause();

        //Выбираем первую камеру на раскладке и переходим в поиск
        await page.locator('[role="gridcell"]').nth(0).click();
        await page.locator('#at-app-mode-search').click();
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(1);
        await expect(page.locator('#at-app-mode-search')).toHaveClass(/.*jss22.*/);
        await expect(page.locator('.VideoCell--playing video')).toBeHidden();

        //Выбираем первую раскладку
        await page.locator('#at-layout-expand').click();
        await waitAnimationEnds(page, page.locator('#at-layout-items'));
        await page.locator('#at-layout-item-0').click({ force: true });
        
        //Проверяем, что попали в лайв режим и отображается две камеры с видео
        await expect(page.locator('#at-app-mode-live')).toHaveClass(/.*jss22.*/);
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(2);

        //Выбираем первую камеру на раскладке и переходим в поиск
        await page.locator('[role="gridcell"]').nth(0).click();
        await page.locator('#at-app-mode-search').click();
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(1);
        await expect(page.locator('#at-app-mode-search')).toHaveClass(/.*jss22.*/);
        await expect(page.locator('.VideoCell--playing video')).toBeHidden();

        //Выбираем вторую раскладку
        await page.locator('#at-layout-expand').click();
        await waitAnimationEnds(page, page.locator('#at-layout-items'));
        await page.locator('#at-layout-item-1').click({ force: true });
        
        //Проверяем, что попали в лайв режим и отображается две камеры с видео
        await expect(page.locator('#at-app-mode-live')).toHaveClass(/.*jss22.*/);
        await expect(page.locator('.VideoCell--playing video')).toHaveCount(2);

        //Проверяем что веб-клиент не упал
        await expect(page.locator("body")).not.toHaveClass(/.*error.*/);
    });

    test('Frame-by-frame rewinding (CLOUD-T316)', async ({ page }) => {
        const firstCamera = h264Cameras[4];
        const secondCamera = h265Cameras[4];
        await createLayout([firstCamera, secondCamera], 2, 1, "Frame-by-frame");
        
        await isRecordEnough(page);

        await page.goto(currentURL);
        await authorization(page, "root", "root");

        //Получаем веб-сокет объект видеостримов
        const WS = await page.waitForEvent("websocket", ws => ws.url().includes("/ws?") && !ws.isClosed());
        console.log(WS.url());
        // await page.pause();

        //Переходим в архив
        await page.getByRole('button', { name: 'Multi-camera archive' }).click(); //СДЕЛАТЬ СЕЛЕКТОРЫ
        await waitAnimationEnds(page, page.getByRole('tabpanel').nth(1)); ////СДЕЛАТЬ СЕЛЕКТОРЫ

        //Устанавливаем видимый интервал в центр шкалы и скролим (приближаем)
        await scrollLastInterval(page);
        //Кликаем на центр последнего записанного интервала
        await waitAnimationEnds(page, page.getByRole('tabpanel').nth(1));
        const lastInterval = page.locator('.intervals').last().locator('rect').last();//ПОМЕТИТЬ СЕЛЕКТОРАМИ ИНТЕРВАЛЫ АРХИВА СПРАВА
        await clickToInterval(lastInterval, 0.5);
        await WS.waitForEvent("framereceived");

        //Получаем список кадров и листаем архив назад
        let layoutRequest = page.waitForResponse(request => request.url().includes('archive/contents/frames'));
        await page.locator('#at-archive-control-next-frame').click();
        let body = await (await layoutRequest).json();
        console.log(body.frames);
        for (let i = 0; i < 5; i++) {
            let firstCameraPlay = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('play') && data.payload.includes(firstCamera.accessPointChanged), timeout: 10000 });
            let secondCameraPlay = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('play') && data.payload.includes(secondCamera.accessPointChanged), timeout: 10000 });
            await page.locator('#at-archive-control-next-frame').click();
            let firstFrame = JSON.parse((await firstCameraPlay).payload.toString());
            let secondFrame = JSON.parse((await secondCameraPlay).payload.toString());
            
            expect(firstFrame.speed == 0).toBeTruthy();
            expect(secondFrame.speed == 0).toBeTruthy();
            console.log(firstFrame.beginTime, secondFrame.beginTime);
            expect(body.frames.includes(firstFrame.beginTime + "000", i)).toBeTruthy();
            expect(body.frames.includes(secondFrame.beginTime + "000", i)).toBeTruthy();
            await page.waitForTimeout(500);
        }

        //Перемещаем поинтер 
        await clickToInterval(lastInterval, 0.7);
        await WS.waitForEvent("framereceived");

        //Получаем список кадров и листаем архив назад
        layoutRequest = page.waitForResponse(request => request.url().includes('archive/contents/frames'));
        await page.locator('#at-archive-control-prev-frame').click();
        body = await (await layoutRequest).json();
        console.log(body.frames);
        for (let i = 0; i < 5; i++) {
            let firstCameraPlay = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('play') && data.payload.includes(firstCamera.accessPointChanged), timeout: 10000 });
            let secondCameraPlay = WS.waitForEvent("framesent", { predicate: data => data.payload.includes('play') && data.payload.includes(secondCamera.accessPointChanged), timeout: 10000 });
            await page.locator('#at-archive-control-prev-frame').click();
            let firstFrame = JSON.parse((await firstCameraPlay).payload.toString());
            let secondFrame = JSON.parse((await secondCameraPlay).payload.toString());

            expect(firstFrame.speed == 0).toBeTruthy();
            expect(secondFrame.speed == 0).toBeTruthy();
            console.log(firstFrame.beginTime, secondFrame.beginTime);
            expect(body.frames.includes(firstFrame.beginTime + "000", i)).toBeTruthy();
            expect(body.frames.includes(secondFrame.beginTime + "000", i)).toBeTruthy();
            await page.waitForTimeout(500);
        }

        //Проверяем что веб-клиент не упал
        await expect(page.locator("body")).not.toHaveClass(/.*error.*/);
    });

    test.only('Interval rewinding (CLOUD-T317)', async ({ page }) => {
        //Проверяем, что записи достаточно
        recordGenerated = true
        await isRecordEnough(page);

        let contextList = await getArchiveContext("Black", [h264Cameras[0], h265Cameras[0]]);
        await changeArchiveContext(contextList, false, "High");
        const archiveRecordOffTime = new Date();
        await page.waitForTimeout(10000);
        await changeArchiveContext([contextList[1]], true, "High");
        await page.waitForTimeout(5000);
        await changeArchiveContext([contextList[0]], true, "High");
        await createLayout([h264Cameras[0], h265Cameras[0]], 1, 2, "Interval skip");

        await page.goto(currentURL);
        await authorization(page, "root", "root");
        //Получаем веб-сокет объект видеостримов
        const WS = await page.waitForEvent("websocket", ws => ws.url().includes("/ws?") && !ws.isClosed());
        console.log(WS.url());
        // await page.pause();
        const currentTime = new Date();
        let intervals = await getArchiveIntervals("Black", h264Cameras[0], timeToISO(currentTime), timeToISO(archiveRecordOffTime));
        await transformISOtime(intervals);
        //Переходим в архив
        await page.getByRole('button', { name: 'Multi-camera archive' }).click(); //СДЕЛАТЬ СЕЛЕКТОРЫ
        await waitAnimationEnds(page, page.getByRole('tabpanel').nth(1)); ////СДЕЛАТЬ СЕЛЕКТОРЫ
        //Проверяем, что в ячейках указаны верные кодеки
        // await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(4);
        // await expect(page.locator('[data-testid="at-camera-title"]').nth(0)).toContainText("H264");
        // await expect(page.locator('[data-testid="at-camera-title"]').nth(1)).toContainText("H264");
        // await expect(page.locator('[data-testid="at-camera-title"]').nth(2)).toContainText("H265");
        // await expect(page.locator('[data-testid="at-camera-title"]').nth(3)).toContainText("H265");
        //Устанавливаем видимый интервал в центр шкалы и скролим (приближаем)
        await scrollLastInterval(page);
        //Выставляем время архива до пробела
        await setCellTime(page, 0, archiveRecordOffTime.getHours(), archiveRecordOffTime.getMinutes(), archiveRecordOffTime.getSeconds() - 3);
        await page.pause();
        //Кликаем на кнопку воспроизведения
        await page.locator('#at-archive-control-play-pause').click();
        //Ждем в течении 3 секунд, что видео нигде не останавилось
        let promice1 = videoIsPlaying(page, 0, 3);
        let promice2 = videoIsPlaying(page, 1, 3);
        let promice3 = videoIsPlaying(page, 2, 3);
        let promice4 = videoIsPlaying(page, 3, 3);
        expect(await promice1).toBeTruthy();
        expect(await promice2).toBeTruthy();
        expect(await promice3).toBeTruthy();
        expect(await promice4).toBeTruthy();

        //Ждем в течении 5 секунд, видео на первой ячейке должно было останавится
        promice1 = videoIsPlaying(page, 0, 5);
        promice2 = videoIsPlaying(page, 1, 5);
        promice3 = videoIsPlaying(page, 2, 5);
        promice4 = videoIsPlaying(page, 3, 5);
        expect(await promice1).toBeFalsy();
        expect(await promice2).toBeTruthy();
        expect(await promice3).toBeTruthy();
        expect(await promice4).toBeTruthy();

        //Ждем 10 секунд, чтобы перебраться через архивный пробел
        await page.waitForTimeout(10000);

        //Смотрим в течении 5 секунд, что видео везеде идет
        promice1 = videoIsPlaying(page, 0, 5);
        promice2 = videoIsPlaying(page, 1, 5);
        promice3 = videoIsPlaying(page, 2, 5);
        promice4 = videoIsPlaying(page, 3, 5);
        expect(await promice1).toBeTruthy();
        expect(await promice2).toBeTruthy();
        expect(await promice3).toBeTruthy();
        expect(await promice4).toBeTruthy();

        //Останваливаем воспроизведение
        await page.locator('#at-archive-control-play-pause').click();
        await page.waitForTimeout(2000);
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
    // await waitAnimationEnds(page, page.getByRole('tabpanel').nth(1));
    const intervalSize = await locator.boundingBox();

    // console.log(intervalSize?.width);
    // console.log(intervalSize?.height);

    await locator.click({position: {x: intervalSize!.width / 2, y: intervalSize!.height * height}});
}

async function scrollLastInterval(page: Page) {
    let source = page.locator('.intervals').last().locator('rect').last();
    let target = page.locator('.data').last();
    await source.hover();
    await page.mouse.wheel(0, -1000);
    await page.waitForTimeout(1000);
    let sourceBox = await source.boundingBox();
    let targetBox = await target.boundingBox();
    // console.log(sourceBox);
    // console.log(targetBox);
    
    await source.dragTo(target, { 
        sourcePosition: { x: sourceBox!.width / 2, y: sourceBox!.height / 2}, 
        targetPosition: { x: targetBox!.width / 2, y: targetBox!.height / 2},
    });

    await page.mouse.wheel(0, -3000);
    await page.waitForTimeout(1000);
}

async function isRecordEnough(page:Page) {
    if (!recordGenerated) {
        await page.waitForTimeout(30000);
        recordGenerated = true;
    }
}

async function videoIsPlaying(page:Page, cellNumber: number, playSeconds: number) {

    const timer = page.locator('.VideoCell').nth(cellNumber).locator('[data-testid="at-camera-time"]');
    let previousTime = 0;
    let videoStoped = 0;
    for (let i = 0; i < playSeconds; i++) {
        await page.waitForTimeout(1000);

        let currentTime = timeToSeconds(await timer.innerHTML());
        console.log(cellNumber + ": " + currentTime);
        
        if (currentTime == previousTime){
            videoStoped++;
        } else {
            videoStoped = 0;
        }

        if (videoStoped >= 2) {
            return false;
        }

        previousTime = currentTime;
    }
    return true;
}

async function setCellTime(page: Page, cellNumber: number, hours: number | string, minutes: number | string, seconds: number | string) {

    await page.locator('[data-testid="at-camera-time"]').nth(cellNumber).click();
    await page.locator('input[type="text"]').nth(0).fill(String(hours));
    await page.locator('input[type="text"]').nth(1).fill(String(minutes));
    await page.locator('input[type="text"]').nth(2).fill(String(seconds));
    await page.keyboard.press("Enter");  
}

function timeToISO(date: Date) {
    let time = date.toISOString(); //"2023-01-01T00:00:00.000Z"
    console.log(time.replaceAll("-", "").replace(":", "").replace(/[Zz]/, ""));
    return time.replace("-", "").replace(":", "").replace(/[Zz]/, "");
}