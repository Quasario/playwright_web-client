import { test, expect, Page, } from '@playwright/test';
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
let activeAlerts = Array();

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
    
    test.beforeEach(async ({ page }) => {
        await page.goto(currentURL);
        await authorization(page, "root", "root");
        for (let alert of activeAlerts) {
            await completeAlert(alert);
        }
    });
    
    
    test('Camera list without layouts (CLOUD-T113)', async ({ page }) => {
        //await page.pause();
        await openCameraList(page);
        const firstCamera = page.locator('[data-testid="at-camera-list-item"]').first()
        await firstCamera.click();
        console.log(await firstCamera.innerText());
        addAlertRequestListener(page);
        
        let cameraTime = await page.locator('[data-testid="at-camera-time"]').innerText();
        await page.locator('.VideoCell--alert-review').click();
        await page.getByRole('button', { name: 'Alarm panel' }).click();
        let alertTime = await page.getByTitle(await firstCamera.innerText()).first().locator('p').last().innerText(); 
        isTimeEquals(cameraTime, alertTime, 1);
        await page.locator('.alert-panel .MuiGrid-item').click();
        let pointerTime = await page.locator('.control [role="none"] span').first().innerText();
        isTimeEquals(alertTime, pointerTime, 1);

        await raiseAlert(Configuration.cameras[1].accessPoint);
        await raiseAlert(Configuration.cameras[2].accessPoint);
        await raiseAlert(Configuration.cameras[3].accessPoint);

        // await page.locator('.VideoCell--alert-review').first().click();
        // await page.locator('[role="group"] button').first().click();
        // await page.getByRole('button', { name: 'Alarm panel' }).waitFor({ state: 'detached', timeout: 5000 });

        //Проверяем что веб-клиент не упал
        await expect(page.locator("body")).not.toHaveClass(/.*error.*/);
    });

    test('Camera list without layouts (CLOUD-T113) 2', async ({ page }) => {
        //await page.pause();
        await openCameraList(page);
        const firstCamera = page.locator('[data-testid="at-camera-list-item"]').first()
        await firstCamera.click();
        console.log(await firstCamera.innerText());
        addAlertRequestListener(page);
        
        let cameraTime = await page.locator('[data-testid="at-camera-time"]').innerText();
        await page.locator('.VideoCell--alert-review').click();
        await page.getByRole('button', { name: 'Alarm panel' }).click();
        let alertTime = await page.getByTitle(await firstCamera.innerText()).first().locator('p').last().innerText(); 
        isTimeEquals(cameraTime, alertTime, 1);
        await page.locator('.alert-panel .MuiGrid-item').click();
        let pointerTime = await page.locator('.control [role="none"] span').first().innerText();
        isTimeEquals(alertTime, pointerTime, 1);


        // await page.locator('.VideoCell--alert-review').first().click();
        // await page.locator('[role="group"] button').first().click();
        // await page.getByRole('button', { name: 'Alarm panel' }).waitFor({ state: 'detached', timeout: 5000 });

        //Проверяем что веб-клиент не упал
        await expect(page.locator("body")).not.toHaveClass(/.*error.*/);
    });

});


function isTimeEquals(expectedTime: string, recivedTime: string, imprecision = 0) {
    console.log(`Expected time interval: [${timeToSeconds(expectedTime, -imprecision)}, ${timeToSeconds(expectedTime, imprecision)}]`);
    console.log(`Recieved time: ${timeToSeconds(recivedTime)}`);
    expect(timeToSeconds(expectedTime, -imprecision) <= timeToSeconds(recivedTime) && timeToSeconds(recivedTime) <= timeToSeconds(expectedTime, imprecision)).toBeTruthy();
}

function addAlertRequestListener(page: Page) {

    page.on("request", async request => {
        if (request.url().includes(`raisealert`)) {
            let requestBody = request.postData();
            expect(requestBody).not.toBeNull();
            let alertObject = JSON.parse(requestBody!);
            // console.log(JSON.parse(requestBody!));
   
            let response = await request.response();
            expect(response).not.toBeNull();
            alertObject.alert_id = (await response!.json()).alert_id;

            activeAlerts.push(alertObject);
            console.log(activeAlerts);
        }
    });
}

export async function completeAlert( activeAlert: { camera_ap: string, alert_id: string, } ) {
    if (await startAlertHandle(activeAlert)){
        if (await handleAlert(activeAlert)) {
            activeAlerts = activeAlerts.filter(element => element.alert_id != activeAlert.alert_id);
        };
    }
};

export async function startAlertHandle( activeAlert: { camera_ap: string, alert_id: string, } ) {
    
    let request = await fetch(`${currentURL}/v1/logic_service/beginalert`, {
        headers: {
            "Authorization": "Basic cm9vdDpyb290",
        },
        method: "POST",
        body: JSON.stringify(activeAlert)
    });

    let alertHandleStart = await request.json();

    if (request.ok && alertHandleStart.result) {
        console.log(`Alert ${activeAlert.alert_id} handling is started.`);
        return true;
    } else console.log(`Error: could not start alert handling: ${activeAlert.camera_ap}/${activeAlert.alert_id}. Code: ${request.status}`);
};

export async function handleAlert( activeAlert: { [key: string]: any, camera_ap: string, alert_id: string } ) {
    activeAlert.severity = "SV_FALSE";

    let request = await fetch(`${currentURL}/v1/logic_service/completealert`, {
        headers: {
            "Authorization": "Basic cm9vdDpyb290",
        },
        method: "POST",
        body: JSON.stringify(activeAlert)
    });

    let alertHandle = await request.json();

    if (request.ok && alertHandle.result) {
        console.log(`Alert ${activeAlert.alert_id} has been handled.`);
        return true;
    } else console.log(`Error: could not handle alert: ${activeAlert.camera_ap}/${activeAlert.alert_id}. Code: ${request.status}`);
};

export async function raiseAlert( cameraRef: string ) {
    let refObject = { camera_ap: cameraRef };
    let request = await fetch(`${currentURL}/v1/logic_service/raisealert`, {
        headers: {
            "Authorization": "Basic cm9vdDpyb290",
        },
        method: "POST",
        body: JSON.stringify(refObject)
    });

    let alertHandle = await request.json();

    if (request.ok && alertHandle.result) {
        console.log(`Alert ${alertHandle.alert_id} has been initiated.`);
        activeAlerts.push({ camera_ap: cameraRef, alert_id: alertHandle.alert_id });
    } else console.log(`Error: could not initiate alert. Code: ${request.status}`);
};

