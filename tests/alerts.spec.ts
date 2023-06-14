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
import { isCameraListOpen, getCameraList, cameraAnnihilator, layoutAnnihilator, groupAnnihilator, configurationCollector, userAnnihilator, roleAnnihilator, waitAnimationEnds, timeToSeconds } from "../utils/utils.js";


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
        await page.getByLabel('Login').fill('root');
        await page.getByLabel('Password').fill('root');
        await page.getByLabel('Password').press('Enter');
    });
    
    
    test('Camera list without layouts (CLOUD-T113)', async ({ page }) => {
        await page.pause();
        await page.getByRole('button', { name: 'Hardware' }).click();
        await page.locator('[data-testid="at-camera-list-item"]').first().click();
        let cameraTime = await page.locator('[data-testid="at-camera-time"]').innerText();
        await page.locator('.VideoCell--alert-review').click();
        await page.getByRole('button', { name: 'Alarm panel' }).click();
        let alertTime = await page.locator('.alert-panel p').last().innerText();
        console.log(cameraTime, timeToSeconds(cameraTime));
        console.log(alertTime, timeToSeconds(alertTime));
        expect(timeToSeconds(cameraTime, -1) <= timeToSeconds(alertTime) <= timeToSeconds(cameraTime, 1)).toBeTruthy();
        
        //Проверяем что веб-клиент не упал
        await expect(page.locator("body")).not.toHaveClass(/.*error.*/);
    });

});