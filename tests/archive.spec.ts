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
import { isCameraListOpen, getCameraList, cameraAnnihilator, layoutAnnihilator, groupAnnihilator, configurationCollector, userAnnihilator, roleAnnihilator, waitAnimationEnds, timeToSeconds, authorization } from "../utils/utils.js";
let websockets = {
	events: {},
	video: {}
};

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
        let WS = await page.waitForEvent("websocket", ws => ws.url().includes("/ws?") && !ws.isClosed());
        console.log(WS.url());
        // await page.pause();
        //Переходим в архив
        await page.getByRole('button', { name: 'Hardware' }).click();
        await page.locator('[data-testid="at-camera-list-item"]').first().click();
        await page.getByRole('button', { name: 'Single-camera archive'}).click();
        //Кликаем на центр последнего записанного интервала
        const lastInterval = page.locator('.intervals').last().locator('rect').last();
        await lastInterval.click();
        //Сохраняем время поинтера перед воспроизведением
        let pointerTime = await page.locator('.control [role="none"] span').first().innerText();
        console.log(pointerTime, timeToSeconds(pointerTime));
        //Кликаем на кнопку воспроизведения ждем сообщение о старте потока со скоростью 1
        let startCommand = WS.waitForEvent("framesent", data => data.payload.includes('"speed":1'));
        await page.locator('#at-archive-control-play-pause').click();
        await expect(page.locator('.VideoCell--playing video').nth(0)).toBeVisible();
        //Преобразуем сообщение в объект, чтобы дальше извлечь из него streamId
        let wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Сравниваем время в начале воспроизведения и в конце
        let newPointerTime = await page.locator('.control [role="none"] span').first().innerText();
        console.log(newPointerTime, timeToSeconds(newPointerTime));
        expect(timeToSeconds(pointerTime) < timeToSeconds(newPointerTime)).toBeTruthy();
        
        //Останавливаем видео и проверяем что отправилось соответсвующее сообщение в WS
        let stopCommand = WS.waitForEvent("framesent", data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId));
        startCommand = WS.waitForEvent("framesent", data => data.payload.includes('"speed":4'));

        await page.locator('[data-index="5"]').first().click();

        await stopCommand;
        wsFrame = JSON.parse((await startCommand).payload.toString());
        //Играем видео 5 секунд
        await page.waitForTimeout(5000);
        //Останавливаем видео и проверяем что отправилось соответсвующее сообщение в WS
        stopCommand = WS.waitForEvent("framesent", data => data.payload.includes('stop') && data.payload.includes(wsFrame.streamId));
        await page.locator('#at-archive-control-play-pause').click();
        await stopCommand;
        //Ждем 2 секунды так как сообщения не прерываются мгновенно
        await page.waitForTimeout(2000);
        //Добавляем обработчик чтобы проверить останавку сообщений в WS и ждем 2 секунды
        let recivedFrame = false;
        WS.on('framereceived', data => {
            console.log(data.payload);
            recivedFrame = true;
        });
        await page.waitForTimeout(2000);
        expect(recivedFrame).toBeFalsy();
        //Удаляем обработчик
        WS.removeListener('framereceived', data => {
            console.log(data.payload);
            recivedFrame = true;
        });

        
        //Проверяем что веб-клиент не упал
        await expect(page.locator("body")).not.toHaveClass(/.*error.*/);
    });

});