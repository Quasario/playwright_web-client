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
import { isCameraListOpen, getCameraList, cameraAnnihilator, layoutAnnihilator, groupAnnihilator, configurationCollector, userAnnihilator, roleAnnihilator, waitAnimationEnds, timeToSeconds, authorization, openCameraList, closeCameraList } from "../utils/utils.js";
let activeAlerts = Array();

test.describe("Common block", () => {

    test.beforeAll(async () => {
        await getHostName();
        await configurationCollector();
        await cameraAnnihilator("all");
        await layoutAnnihilator("all");
        await roleAnnihilator("all");
        await userAnnihilator("all");
        await deleteArchive('Black');
        await createCamera(4, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "80", "1", "Camera", 0);
        await addVirtualVideo(Configuration.cameras, "lprusa", "tracker");
        await createLayout([Configuration.cameras[1], Configuration.cameras[2]], 2, 1, "Test Layout");
        await createArchive("Black");
        await createArchiveVolume("Black", 20);
        await createArchiveContext("Black", [Configuration.cameras[0]], true, "High");
        await createArchiveContext("Black", [Configuration.cameras[1]], false, "High");
        await createArchiveContext("Black", [Configuration.cameras[2]], true, "Low");
        await createArchiveContext("Black", [Configuration.cameras[3]], false, "Low");
        await createRole("Alert_test");
        await setRolePermissions("Alert_test");
        await createUser("alert");
        await assignUserRole("Alert_test", "alert");
        await setUserPassword("alert", "alert");
    });
    
    test.beforeEach(async ({ page }) => {
        await page.goto(currentURL);
        await authorization(page, "root", "root");
    });

    test.afterEach(async () => {
        for (let alert of activeAlerts) {
            await completeAlert(alert);
        }
    });
    

    test('Alerts on solo camera (CLOUD-T110)', async ({ page }) => {
        const firstCamera = Configuration.cameras[0];
        const secondCamera = Configuration.cameras[1];
        const thirdCamera = Configuration.cameras[2];
        const alertContainer = page.locator('.alert-panel .MuiGrid-item');

        await openCameraList(page);
        await page.locator('[data-testid="at-camera-list-item"]').first().click();

        const firstCameraTime = await page.locator('[data-testid="at-camera-time"]').innerText();
        await raiseAlert(firstCamera.accessPoint);
        await page.getByRole('button', { name: 'Alarm panel' }).click();
        await expect(alertContainer).toHaveCount(1);
        await expect(alertContainer.nth(0).locator('div').first()).toHaveAttribute("style", /.*blob:.*/);
        await expect(alertContainer.nth(0).locator('p').first()).toHaveText(`${firstCamera.displayId}.${firstCamera.displayName}`);
        await expect(alertContainer.nth(0).locator('p').nth(1)).toHaveText("root");
        const firstAlertTime = await alertContainer.nth(0).locator('p').last().innerText(); 
        isTimeEquals(firstCameraTime, firstAlertTime, 2);
        
        await raiseAlert(secondCamera.accessPoint);
        await page.waitForTimeout(1000);
        await raiseAlert(thirdCamera.accessPoint);
        await expect(alertContainer).toHaveCount(3);
        await expect(alertContainer.nth(0).locator('div').first()).toHaveAttribute("style", /.*blob:.*/);
        await expect(alertContainer.nth(1).locator('div').first()).toHaveAttribute("style", /.*blob:.*/);
        await expect(alertContainer.nth(0).locator('p').first()).toHaveText(`${thirdCamera.displayId}.${thirdCamera.displayName}`);
        await expect(alertContainer.nth(1).locator('p').first()).toHaveText(`${secondCamera.displayId}.${secondCamera.displayName}`);
        await expect(alertContainer.nth(0).locator('p').nth(1)).toHaveText("root");
        await expect(alertContainer.nth(1).locator('p').nth(1)).toHaveText("root");
        await expect(alertContainer.nth(0).locator('p').last()).toContainText(/\d?\d:\d{2}:\d{2}/);
        await expect(alertContainer.nth(1).locator('p').last()).toContainText(/\d?\d:\d{2}:\d{2}/);

        await waitAnimationEnds(page, page.locator('.alert-panel'));
        const firstAlert = await alertContainer.nth(0).boundingBox();
        const secondAlert = await alertContainer.nth(1).boundingBox();
        expect(firstAlert?.width == 320).toBeTruthy();
        expect(secondAlert?.width == 320).toBeTruthy();

        //Проверяем что веб-клиент не упал
        await expect(page.locator("body")).not.toHaveClass(/.*error.*/);
    });

    test('Changing alert panel width (CLOUD-T111)', async ({ page }) => {
        const firstCamera = Configuration.cameras[0];
        const alertPanel = page.locator('.alert-panel');
        const cameraPanelButton = page.getByRole('button', { name: 'Hardware'});
        const alertContainer = page.locator('.alert-panel .MuiGrid-item');

        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(2);
        await raiseAlert(firstCamera.accessPoint);
        await page.getByRole('button', { name: 'Alarm panel' }).click();
        await waitAnimationEnds(page, alertPanel);
        const alertPanelSize = await alertPanel.boundingBox();
        console.log(alertPanelSize);

        await expect(alertContainer).toHaveCount(1);

        await cameraPanelButton.click();
        await waitAnimationEnds(page, cameraPanelButton);
        const alertPanelSizeCollapsed = await alertPanel.boundingBox();
        console.log(alertPanelSizeCollapsed);
        expect(alertPanelSize!.width > alertPanelSizeCollapsed!.width).toBeTruthy();
        await expect(alertContainer).toBeInViewport({ ratio: 1 });

        await cameraPanelButton.click();
        await waitAnimationEnds(page, cameraPanelButton);
        const alertPanelSizeExpanded = await alertPanel.boundingBox();
        console.log(alertPanelSizeExpanded);
        expect(alertPanelSize!.width == alertPanelSizeExpanded!.width).toBeTruthy();
        await expect(alertContainer).toBeInViewport({ ratio: 1 });
        
        //Проверяем что веб-клиент не упал
        await expect(page.locator("body")).not.toHaveClass(/.*error.*/);
    });

    test('Transition to alarms from a single camera (CLOUD-T112)', async ({ page }) => {
        const firstCamera = Configuration.cameras[0];
        const secondCamera = Configuration.cameras[1];
        const thirdCamera = Configuration.cameras[2];
        const archivePointer = page.locator('.control [role="none"] span').first();
        const cameraTimer = page.locator('[data-testid="at-camera-time"]');
        const alarmPanelButton = page.getByRole('button', { name: 'Alarm panel' });
        const alertContainer = page.locator('.alert-panel .MuiGrid-item');

        await page.locator('[data-testid="at-camera-title"]').nth(0).waitFor({ state: "attached", timeout: 10000 });

        await raiseAlert(firstCamera.accessPoint);
        await page.waitForTimeout(2000);
        await raiseAlert(secondCamera.accessPoint);
        await page.waitForTimeout(3000);
        await raiseAlert(thirdCamera.accessPoint);

        await alarmPanelButton.click();
        await expect(alertContainer).toHaveCount(3);

        const firstAlertTime = await alertContainer.nth(0).locator('p').last().innerText(); 
        await alertContainer.nth(0).click();
        await expect(page.locator('[role="gridcell"] img')).toBeVisible();
        let pointerTime = await archivePointer.innerText();
        isTimeEquals(firstAlertTime, pointerTime, 1);
        let cameraTime = await cameraTimer.innerText();
        isTimeEquals(pointerTime, cameraTime, 0);

        await alarmPanelButton.click();
        const secondAlertTime = await alertContainer.nth(1).locator('p').last().innerText(); 
        await alertContainer.nth(1).click();
        await expect(page.locator('[role="gridcell"] img')).toBeVisible();
        pointerTime = await archivePointer.innerText();
        isTimeEquals(secondAlertTime, pointerTime, 1);
        cameraTime = await cameraTimer.innerText();
        isTimeEquals(pointerTime, cameraTime, 0);

        await page.locator('#at-app-mode-live').click();
        await alarmPanelButton.click();
        const thirdAlertTime = await alertContainer.nth(2).locator('p').last().innerText(); 
        await alertContainer.nth(2).click();
        await expect(page.locator('[role="gridcell"] img')).toBeVisible();
        pointerTime = await archivePointer.innerText();
        isTimeEquals(thirdAlertTime, pointerTime, 1);
        cameraTime = await cameraTimer.innerText();
        isTimeEquals(pointerTime, cameraTime, 0);

        //Проверяем что веб-клиент не упал
        await expect(page.locator("body")).not.toHaveClass(/.*error.*/);
    });

    test('Change alert panel height (CLOUD-T114)', async ({ page }) => {
        const firstCamera = Configuration.cameras[0];
        const alertPanel = page.locator('.alert-panel');
        const layoutField = page.locator('.layout');
        const alarmPanelButton = page.getByRole('button', { name: 'Alarm panel' });
        const alertPanelDragline = page.locator('.alert-panel [role="none"]');

        await page.locator('[data-testid="at-camera-title"]').nth(0).waitFor({ state: "attached", timeout: 10000 });

        await raiseAlert(firstCamera.accessPoint);
        await alarmPanelButton.click();
        await waitAnimationEnds(page, alertPanel);
        const alertPanelSize = await alertPanel.boundingBox();
        const layoutFieldSize = await layoutField.boundingBox(); 
        console.log(`Alert panel size: ${alertPanelSize?.height}`);
        console.log(`Layout field size: ${layoutFieldSize?.height}`);

        await alertPanelDragline.hover();
        await page.mouse.down();
        await page.mouse.move(200, 200);
        await page.mouse.move(200, 250);
        await page.mouse.move(200, 300);
        await page.mouse.move(200, 350);
        await page.mouse.move(200, 400);
        await page.mouse.up();

        await waitAnimationEnds(page, alertPanel);
        const expandedAlertPanelSize = await alertPanel.boundingBox();
        const collapsedLayoutFieldSize = await layoutField.boundingBox();
        console.log(`Alert panel size: ${expandedAlertPanelSize?.height}`);
        console.log(`Layout field size: ${collapsedLayoutFieldSize?.height}`);
        const delta = expandedAlertPanelSize!.height - alertPanelSize!.height;
        expect(expandedAlertPanelSize!.height > alertPanelSize!.height).toBeTruthy();
        expect(layoutFieldSize!.height - delta == collapsedLayoutFieldSize!.height).toBeTruthy();

        await alarmPanelButton.click();
        await waitAnimationEnds(page, alertPanel);
        await alarmPanelButton.click();
        await waitAnimationEnds(page, alertPanel);
        expect((await alertPanel.boundingBox())!.height == expandedAlertPanelSize!.height).toBeTruthy();
        expect((await layoutField.boundingBox())!.height == collapsedLayoutFieldSize!.height).toBeTruthy();

        await alertPanelDragline.hover();
        await page.mouse.down();
        await page.mouse.move(200, 350);
        await page.mouse.move(200, 300);
        await page.mouse.move(200, 250);
        await page.mouse.move(200, 150);
        await page.mouse.move(200, 100);
        await page.mouse.up();

        await waitAnimationEnds(page, alertPanel);
        const collapsedAlertPanelSize = await alertPanel.boundingBox();
        const expandedLayoutFieldSize = await layoutField.boundingBox(); 
        console.log(`Alert panel size: ${collapsedAlertPanelSize?.height}`);
        console.log(`Layout field size: ${expandedLayoutFieldSize?.height}`);
        expect(collapsedAlertPanelSize!.height == alertPanelSize!.height).toBeTruthy();
        expect(expandedLayoutFieldSize!.height == layoutFieldSize!.height).toBeTruthy();

        //Проверяем что веб-клиент не упал
        await expect(page.locator("body")).not.toHaveClass(/.*error.*/);
    });

    test('Handling alerts via GUI (API) (CLOUD-T115)', async ({ page }) => {
        const firstCamera = Configuration.cameras[0];
        const secondCamera = Configuration.cameras[1];
        const thirdCamera = Configuration.cameras[2];
        const alarmPanelButton = page.getByRole('button', { name: 'Alarm panel' });
        const alertContainer = page.locator('.alert-panel .MuiGrid-item');

        await page.locator('[data-testid="at-camera-title"]').nth(0).waitFor({ state: "attached", timeout: 10000 });

        await raiseAlert(firstCamera.accessPoint);
        await page.waitForTimeout(2000);
        await raiseAlert(secondCamera.accessPoint);
        await page.waitForTimeout(3000);
        await raiseAlert(thirdCamera.accessPoint);

        await alarmPanelButton.click();
        await expect(alertContainer).toHaveCount(3);

        await completeAlert(activeAlerts[2]);
        await alertContainer.nth(2).waitFor({ state: "detached", timeout: 10000 });
        await expect(alertContainer).toHaveCount(2);

        await completeAlert(activeAlerts[1]);
        await completeAlert(activeAlerts[0]);
        await expect(alertContainer).toHaveCount(0);
        await expect(alarmPanelButton).toBeHidden();

        //Проверяем что веб-клиент не упал
        await expect(page.locator("body")).not.toHaveClass(/.*error.*/);
    });

    test('Transition to alarms from a layout (CLOUD-T116)', async ({ page }) => {
        const secondCamera = Configuration.cameras[1];
        const fourthCamera = Configuration.cameras[3];
        const archivePointer = page.locator('.control [role="none"] span').first();
        const cameraTimer = page.locator('[data-testid="at-camera-time"]');
        const alarmPanelButton = page.getByRole('button', { name: 'Alarm panel' });
        const alertContainer = page.locator('.alert-panel .MuiGrid-item');

        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(2);

        //Включаем "Открывать выбранную камеру на раскладке"
        await page.locator('#at-top-menu-btn').click();
        await page.getByRole('menuitem', { name: 'Preferences' }).click();
        await page.getByLabel('Open selected camera on layout').check();
        await page.locator('[role="dialog"] button:last-child').click();

        await raiseAlert(secondCamera.accessPoint);
        await alarmPanelButton.click();
        await expect(alertContainer).toHaveCount(1);

        await expect(alertContainer.nth(0).locator('div').first()).toHaveAttribute("style", /.*blob:.*/);
        await expect(alertContainer.nth(0).locator('p').first()).toHaveText(`${secondCamera.displayId}.${secondCamera.displayName}`);
        const firstAlertTime = await alertContainer.nth(0).locator('p').last().innerText(); 
        await alertContainer.nth(0).click();
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(2);
        await expect(page.locator('[role="gridcell"] img').nth(0)).toBeVisible();
        let pointerTime = await archivePointer.innerText();
        isTimeEquals(firstAlertTime, pointerTime, 1);
        let firstCellTime = await cameraTimer.nth(0).innerText();
        let secondCellTime = await cameraTimer.nth(1).innerText();
        isTimeEquals(pointerTime, firstCellTime, 1);
        isTimeEquals(secondCellTime, firstCellTime, 1);

        await page.locator('#at-app-mode-live').click();
        await raiseAlert(fourthCamera.accessPoint);
        await alarmPanelButton.click();
        await expect(alertContainer).toHaveCount(2);
        await expect(alertContainer.nth(0).locator('div').first()).toHaveAttribute("style", /.*blob:.*/);
        await expect(alertContainer.nth(0).locator('p').first()).toHaveText(`${fourthCamera.displayId}.${fourthCamera.displayName}`);
        const secondAlertTime = await alertContainer.nth(0).locator('p').last().innerText(); 
        await alertContainer.nth(0).click();
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(1);
        await expect(page.locator('[role="gridcell"] img')).toBeVisible();
        pointerTime = await archivePointer.innerText();
        isTimeEquals(secondAlertTime, pointerTime, 1);
        let cellTime = await cameraTimer.innerText();
        isTimeEquals(pointerTime, cellTime, 1);

        //Проверяем что веб-клиент не упал
        await expect(page.locator("body")).not.toHaveClass(/.*error.*/);
    });



    test('Alarm handling by icon (CLOUD-T571)', async ({ page }) => {
        const firstCamera = Configuration.cameras[0];
        const archivePointer = page.locator('.control [role="none"] span').first();
        const cameraTimer = page.locator('[data-testid="at-camera-time"]');
        const alarmPanelButton = page.getByRole('button', { name: 'Alarm panel' });
        const alertReviewIcon = page.locator('.VideoCell--alert-review');
        const alertContainer = page.locator('.alert-panel .MuiGrid-item');

        addAlertRequestListener(page);

        await openCameraList(page);
        await page.locator('[data-testid="at-camera-list-item"]').first().click();

        await alertReviewIcon.click();
        await expect(page.locator(".VideoCell")).toHaveClass(/.*VideoCell--alert.*/);

        await alarmPanelButton.click();
        await expect(alertContainer.nth(0).locator('div').first()).toHaveAttribute("style", /.*blob:.*/);
        await expect(alertContainer.nth(0).locator('p').first()).toHaveText(`${firstCamera.displayId}.${firstCamera.displayName}`);
        const alertTime = await alertContainer.nth(0).locator('p').last().innerText();
        await alarmPanelButton.click();

        await alertReviewIcon.click();

        await expect(page.locator('[role="gridcell"] img')).toBeVisible();
        const pointerTime = await archivePointer.innerText();
        isTimeEquals(alertTime, pointerTime, 1);
        const cellTime = await cameraTimer.nth(0).innerText();
        isTimeEquals(pointerTime, cellTime, 1);

        await expect(alertReviewIcon.locator('button')).toHaveCount(3);
        await alertReviewIcon.locator('button').nth(0).click();

        await alarmPanelButton.waitFor({ state: "detached", timeout: 10000 });
        await expect(page.locator(".VideoCell")).not.toHaveClass(/.*VideoCell--alert.*/);
        await page.locator('#at-app-mode-live').click();
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveText(`${firstCamera.displayId}.${firstCamera.displayName}`);
        await expect(alertReviewIcon).toBeVisible();

        //Проверяем что веб-клиент не упал
        await expect(page.locator("body")).not.toHaveClass(/.*error.*/);
    });

    test('Alarm handling by alert panel (CLOUD-T578)', async ({ page }) => {
        const firstCamera = Configuration.cameras[0];
        const archivePointer = page.locator('.control [role="none"] span').first();
        const cameraTimer = page.locator('[data-testid="at-camera-time"]');
        const alarmPanelButton = page.getByRole('button', { name: 'Alarm panel' });
        const alertReviewIcon = page.locator('.VideoCell--alert-review');
        const alertContainer = page.locator('.alert-panel .MuiGrid-item');

        addAlertRequestListener(page);

        await openCameraList(page);
        await page.locator('[data-testid="at-camera-list-item"]').first().click();

        await alertReviewIcon.click();
        await expect(page.locator(".VideoCell")).toHaveClass(/.*VideoCell--alert.*/);

        await alarmPanelButton.click();
        await expect(alertContainer.nth(0).locator('div').first()).toHaveAttribute("style", /.*blob:.*/);
        await expect(alertContainer.nth(0).locator('p').first()).toHaveText(`${firstCamera.displayId}.${firstCamera.displayName}`);
        const alertTime = await alertContainer.nth(0).locator('p').last().innerText();
        await alertContainer.click();

        await expect(page.locator('[role="gridcell"] img')).toBeVisible();
        let pointerTime = await archivePointer.innerText();
        isTimeEquals(alertTime, pointerTime, 1);
        let cellTime = await cameraTimer.nth(0).innerText();
        isTimeEquals(pointerTime, cellTime, 1);
        
        await expect(alertReviewIcon.locator('button')).toHaveCount(1);
        await alertReviewIcon.click();
        await expect(alertReviewIcon.locator('button')).toHaveCount(3);
        pointerTime = await archivePointer.innerText();
        isTimeEquals(alertTime, pointerTime, 1);
        cellTime = await cameraTimer.nth(0).innerText();
        isTimeEquals(pointerTime, cellTime, 1);
        await alertReviewIcon.locator('button').nth(0).click();
        
        await alarmPanelButton.waitFor({ state: "detached", timeout: 10000 });
        await expect(page.locator(".VideoCell")).not.toHaveClass(/.*VideoCell--alert.*/);
        await page.locator('#at-app-mode-live').click();
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveText(`${firstCamera.displayId}.${firstCamera.displayName}`);
        await expect(alertReviewIcon).toBeVisible();

        //Проверяем что веб-клиент не упал
        await expect(page.locator("body")).not.toHaveClass(/.*error.*/);
    });

    test('Alarm handling from archive section (CLOUD-T579)', async ({ page }) => {
        const firstCamera = Configuration.cameras[0];
        const archivePointer = page.locator('.control [role="none"] span').first();
        const cameraTimer = page.locator('[data-testid="at-camera-time"]');
        const alarmPanelButton = page.getByRole('button', { name: 'Alarm panel' });
        const alertReviewIcon = page.locator('.VideoCell--alert-review');
        const alertContainer = page.locator('.alert-panel .MuiGrid-item');

        addAlertRequestListener(page);

        await openCameraList(page);
        await page.locator('[data-testid="at-camera-list-item"]').first().click();

        await alertReviewIcon.click();
        await expect(page.locator(".VideoCell")).toHaveClass(/.*VideoCell--alert.*/);

        await alarmPanelButton.click();
        await expect(alertContainer.nth(0).locator('div').first()).toHaveAttribute("style", /.*blob:.*/);
        await expect(alertContainer.nth(0).locator('p').first()).toHaveText(`${firstCamera.displayId}.${firstCamera.displayName}`);
        const alertTime = await alertContainer.nth(0).locator('p').last().innerText();
        await alarmPanelButton.click();

        await page.getByRole('button', { name: 'Single-camera archive' }).click();

        await expect(alertReviewIcon.locator('button')).toHaveCount(1);
        await alertReviewIcon.click();
        await expect(alertReviewIcon.locator('button')).toHaveCount(3);
        let pointerTime = await archivePointer.innerText();
        isTimeEquals(alertTime, pointerTime, 1);
        let cellTime = await cameraTimer.nth(0).innerText();
        isTimeEquals(pointerTime, cellTime, 1);
        await alertReviewIcon.locator('button').nth(2).click();
        
        await alarmPanelButton.waitFor({ state: "detached", timeout: 10000 });
        await expect(page.locator(".VideoCell")).not.toHaveClass(/.*VideoCell--alert.*/);
        await page.locator('#at-app-mode-live').click();
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveText(`${firstCamera.displayId}.${firstCamera.displayName}`);
        await expect(alertReviewIcon).toBeVisible();

        //Проверяем что веб-клиент не упал
        await expect(page.locator("body")).not.toHaveClass(/.*error.*/);
    });

    test('Cancel alarm handling by transition to live (CLOUD-T618)', async ({ page }) => {
        const alertReviewIcon = page.locator('.VideoCell--alert-review');
        const videoCell = page.locator(".VideoCell");

        addAlertRequestListener(page);

        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(2);
        await alertReviewIcon.nth(0).click();
        await expect(videoCell.nth(0)).toHaveClass(/.*VideoCell--alert.*/);

        await alertReviewIcon.nth(0).click();

        await expect(alertReviewIcon.locator('button')).toHaveCount(3);
        let responsePromice = page.waitForResponse(request => request.url().includes('cancelalert'));
        await page.locator('#at-app-mode-live').click();
        await responsePromice;
        await expect(videoCell.nth(0)).toHaveClass(/.*VideoCell--alert.*/);

        await expect(alertReviewIcon.locator('button')).toHaveCount(1);
        await alertReviewIcon.click();
        await expect(alertReviewIcon.locator('button')).toHaveCount(3);

        responsePromice = page.waitForResponse(request => request.url().includes('cancelalert'));
        await page.locator('#at-layout-item-0').click({ force: true });
        await responsePromice;

        //Проверяем что веб-клиент не упал
        await expect(page.locator("body")).not.toHaveClass(/.*error.*/);
    });

    test('Cancel alarm handling by picking another camera (CLOUD-T619)', async ({ page }) => {
        const alertReviewIcon = page.locator('.VideoCell--alert-review');
        const videoCell = page.locator(".VideoCell");

        addAlertRequestListener(page);

        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(2);
        await alertReviewIcon.nth(0).click();
        await alertReviewIcon.nth(1).click();
        await expect(videoCell.nth(0)).toHaveClass(/.*VideoCell--alert.*/);
        await expect(videoCell.nth(1)).toHaveClass(/.*VideoCell--alert.*/);

        await openCameraList(page);

        await alertReviewIcon.nth(0).click();

        await expect(alertReviewIcon.locator('button')).toHaveCount(3);
        let responsePromice = page.waitForResponse(request => request.url().includes('cancelalert'));
        await page.locator('[data-testid="at-camera-list-item"]').nth(2).click();
        await responsePromice;
        await expect(videoCell).toHaveClass(/.*VideoCell--alert.*/);

        //Проверяем что веб-клиент не упал
        await expect(page.locator("body")).not.toHaveClass(/.*error.*/);
    });

    test('Cancel alarm handling by clicking outside the menu (CLOUD-T620)', async ({ page }) => {
        const alertReviewIcon = page.locator('.VideoCell--alert-review');
        const videoCell = page.locator(".VideoCell");
        
        addAlertRequestListener(page);

        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(2);
        await alertReviewIcon.nth(0).click();
        await expect(videoCell.nth(0)).toHaveClass(/.*VideoCell--alert.*/);
        await alertReviewIcon.nth(0).click();

        await expect(alertReviewIcon.locator('button')).toHaveCount(3);
        let responsePromice = page.waitForResponse(request => request.url().includes('cancelalert'));
        await videoCell.click();
        await responsePromice;
        await expect(alertReviewIcon.locator('button')).toHaveCount(1);
        await expect(videoCell).toHaveClass(/.*VideoCell--alert.*/);

        //Проверяем что веб-клиент не упал
        await expect(page.locator("body")).not.toHaveClass(/.*error.*/);
    });

    test('Repeat transition via alert panel (CLOUD-T892)', async ({ page }) => {
        const secondCamera = Configuration.cameras[1];
        const archivePointer = page.locator('.control [role="none"] span').first();
        const cameraTimer = page.locator('[data-testid="at-camera-time"]');
        const alarmPanelButton = page.getByRole('button', { name: 'Alarm panel' });
        const alertReviewIcon = page.locator('.VideoCell--alert-review');
        const alertContainer = page.locator('.alert-panel .MuiGrid-item');

        addAlertRequestListener(page);

        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(2);

        await alertReviewIcon.nth(0).click();

        await alarmPanelButton.click();
        await expect(alertContainer).toHaveCount(1);
        await expect(alertContainer.nth(0).locator('div').first()).toHaveAttribute("style", /.*blob:.*/);
        await expect(alertContainer.nth(0).locator('p').first()).toHaveText(`${secondCamera.displayId}.${secondCamera.displayName}`);
        const alertTime = await alertContainer.nth(0).locator('p').last().innerText(); 
        await alertContainer.nth(0).click();
        await expect(page.locator('[role="gridcell"] img').nth(0)).toBeVisible();
        let pointerTime = await archivePointer.innerText();
        isTimeEquals(alertTime, pointerTime, 1);
        let cellTime = await cameraTimer.nth(0).innerText();
        isTimeEquals(pointerTime, cellTime, 1);

        await page.locator('#at-app-mode-live').click();
        await alarmPanelButton.click();
        await alertContainer.nth(0).click();
        await expect(page.locator('[role="gridcell"] img')).toBeVisible();
        pointerTime = await archivePointer.innerText();
        isTimeEquals(alertTime, pointerTime, 1);
        cellTime = await cameraTimer.innerText();
        isTimeEquals(pointerTime, cellTime, 1);

        //Проверяем что веб-клиент не упал
        await expect(page.locator("body")).not.toHaveClass(/.*error.*/);
    });

    test('Repeat transition via alert icon (CLOUD-T893)', async ({ page }) => {
        const secondCamera = Configuration.cameras[1];
        const archivePointer = page.locator('.control [role="none"] span').first();
        const cameraTimer = page.locator('[data-testid="at-camera-time"]');
        const alarmPanelButton = page.getByRole('button', { name: 'Alarm panel' });
        const alertReviewIcon = page.locator('.VideoCell--alert-review');
        const alertContainer = page.locator('.alert-panel .MuiGrid-item');

        addAlertRequestListener(page);

        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(2);

        await alertReviewIcon.nth(0).click();

        await alarmPanelButton.click();
        await expect(alertContainer).toHaveCount(1);
        await expect(alertContainer.nth(0).locator('div').first()).toHaveAttribute("style", /.*blob:.*/);
        await expect(alertContainer.nth(0).locator('p').first()).toHaveText(`${secondCamera.displayId}.${secondCamera.displayName}`);
        const alertTime = await alertContainer.nth(0).locator('p').last().innerText(); 
        await alarmPanelButton.click();

        await alertReviewIcon.nth(0).click();
        await expect(page.locator('[role="gridcell"] img').nth(0)).toBeVisible();
        let pointerTime = await archivePointer.innerText();
        isTimeEquals(alertTime, pointerTime, 1);
        let cellTime = await cameraTimer.nth(0).innerText();
        isTimeEquals(pointerTime, cellTime, 1);

        await page.locator('#at-app-mode-live').click();
        await alertReviewIcon.click();
        await expect(page.locator('[role="gridcell"] img')).toBeVisible();
        pointerTime = await archivePointer.innerText();
        isTimeEquals(alertTime, pointerTime, 1);
        cellTime = await cameraTimer.innerText();
        isTimeEquals(pointerTime, cellTime, 1);

        await alertReviewIcon.locator('button').nth(2).click();   
        await alarmPanelButton.waitFor({ state: "detached", timeout: 10000 });
        await expect(page.locator(".VideoCell")).not.toHaveClass(/.*VideoCell--alert.*/);

        //Проверяем что веб-клиент не упал
        await expect(page.locator("body")).not.toHaveClass(/.*error.*/);
    });

    test('Alarm handling by alert panel, layout auto-select off (CLOUD-T617)', async ({ page }) => {
        const secondCamera = Configuration.cameras[1];
        const archivePointer = page.locator('.control [role="none"] span').first();
        const cameraTimer = page.locator('[data-testid="at-camera-time"]');
        const alarmPanelButton = page.getByRole('button', { name: 'Alarm panel' });
        const alertReviewIcon = page.locator('.VideoCell--alert-review');
        const alertContainer = page.locator('.alert-panel .MuiGrid-item');
        const scaleTimestamps = page.locator('.tick');
        const playerPointer = page.locator('#timeLine_center');
        const alertsOnScale = page.locator('.alerts').first();

        addAlertRequestListener(page);

        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(2);

        await alertReviewIcon.nth(0).click();

        await alarmPanelButton.click();
        await expect(alertContainer).toHaveCount(1);
        await expect(alertContainer.nth(0).locator('div').first()).toHaveAttribute("style", /.*blob:.*/);
        await expect(alertContainer.nth(0).locator('p').first()).toHaveText(`${secondCamera.displayId}.${secondCamera.displayName}`);
        const alertTime = await alertContainer.nth(0).locator('p').last().innerText(); 
        await alarmPanelButton.click();

        await alertReviewIcon.nth(0).click();
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(1);
        await expect(page.locator('[role="gridcell"] img')).toBeVisible();
        let pointerTime = await archivePointer.innerText();
        isTimeEquals(alertTime, pointerTime, 1);
        let cellTime = await cameraTimer.nth(0).innerText();
        isTimeEquals(pointerTime, cellTime, 1);

        //Вычисляем цену деления, то есть сколько пикселей в одной секунде на плеере
        const secondStep = await scaleTimestamps.nth(1).boundingBox();
        const thirdStep = await scaleTimestamps.nth(2).boundingBox();
        const divisionValue = Math.floor((thirdStep!.x - secondStep!.x) / 15);
        console.log(divisionValue);
        //Вычисляем растояние между поинтером плеера и засечкой последней тревоги
        const playerPointerPosition = await playerPointer.locator('rect').last().boundingBox();
        const lastAlertPosition = await alertsOnScale.locator('rect').last().boundingBox();
        const distance = Math.floor(Math.abs(playerPointerPosition!.x - lastAlertPosition!.x));
        console.log(distance);
        expect(distance <= divisionValue).toBeTruthy();

        await expect(alertReviewIcon.locator('button')).toHaveCount(3);
        await alertReviewIcon.locator('button').nth(0).click();   
        await alarmPanelButton.waitFor({ state: "detached", timeout: 10000 });
        await expect(page.locator(".VideoCell")).not.toHaveClass(/.*VideoCell--alert.*/);

        //Проверяем что веб-клиент не упал
        await expect(page.locator("body")).not.toHaveClass(/.*error.*/);
    });

    test('Alarm handling by alert panel, layout auto-select on (CLOUD-T943)', async ({ page }) => {
        const secondCamera = Configuration.cameras[1];
        const archivePointer = page.locator('.control [role="none"] span').first();
        const cameraTimer = page.locator('[data-testid="at-camera-time"]');
        const alarmPanelButton = page.getByRole('button', { name: 'Alarm panel' });
        const alertReviewIcon = page.locator('.VideoCell--alert-review');
        const alertContainer = page.locator('.alert-panel .MuiGrid-item');
        const scaleTimestamps = page.locator('.tick');
        const playerPointer = page.locator('#timeLine_center');
        const alertsOnScale = page.locator('.alerts').first();

        addAlertRequestListener(page);

        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(2);

        //Включаем "Открывать выбранную камеру на раскладке"
        await page.locator('#at-top-menu-btn').click();
        await page.getByRole('menuitem', { name: 'Preferences' }).click();
        await page.getByLabel('Open selected camera on layout').check();
        await page.locator('[role="dialog"] button:last-child').click();

        await alertReviewIcon.nth(0).click();

        await alarmPanelButton.click();
        await expect(alertContainer).toHaveCount(1);
        await expect(alertContainer.nth(0).locator('div').first()).toHaveAttribute("style", /.*blob:.*/);
        await expect(alertContainer.nth(0).locator('p').first()).toHaveText(`${secondCamera.displayId}.${secondCamera.displayName}`);
        const alertTime = await alertContainer.nth(0).locator('p').last().innerText(); 
        await alarmPanelButton.click();

        await alertReviewIcon.nth(0).click();
        await expect(page.locator('[data-testid="at-camera-title"]')).toHaveCount(2);
        await expect(page.locator('[role="gridcell"] img').nth(0)).toBeVisible();
        let pointerTime = await archivePointer.innerText();
        isTimeEquals(alertTime, pointerTime, 1);
        let firstCellTime = await cameraTimer.nth(0).innerText();
        let secondCellTime = await cameraTimer.nth(1).innerText();
        isTimeEquals(pointerTime, firstCellTime, 1);
        isTimeEquals(secondCellTime, firstCellTime, 1);

        //Вычисляем цену деления, то есть сколько пикселей в одной секунде на плеере
        const secondStep = await scaleTimestamps.nth(1).boundingBox();
        const thirdStep = await scaleTimestamps.nth(2).boundingBox();
        const divisionValue = Math.floor((thirdStep!.x - secondStep!.x) / 15);
        console.log(divisionValue);
        //Вычисляем растояние между поинтером плеера и засечкой последней тревоги
        const playerPointerPosition = await playerPointer.locator('rect').last().boundingBox();
        const lastAlertPosition = await alertsOnScale.locator('rect').last().boundingBox();
        const distance = Math.floor(Math.abs(playerPointerPosition!.x - lastAlertPosition!.x));
        console.log(distance);
        expect(distance <= divisionValue).toBeTruthy();

        await expect(alertReviewIcon.locator('button')).toHaveCount(3);
        await alertReviewIcon.locator('button').nth(0).click();   
        await alarmPanelButton.waitFor({ state: "detached", timeout: 10000 });
        await expect(page.locator(".VideoCell").nth(0)).not.toHaveClass(/.*VideoCell--alert.*/);

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
   
            let response = await request.response();
            expect(response).not.toBeNull();
            alertObject.alert_id = (await response!.json()).alert_id;

            activeAlerts.push(alertObject);
            console.log(activeAlerts);
        }

        if (request.url().includes(`complete`)) {
            let requestBody = request.postData();
            expect(requestBody).not.toBeNull();
            let alertID = JSON.parse(requestBody!).alert_id;
   
            let response = await request.response();
            expect(response).not.toBeNull();
            if ((await response!.json()).result) {
                activeAlerts = activeAlerts.filter(element => element.alert_id != alertID);
                console.log(activeAlerts);
            };
        }
    });
}

export async function completeAlert( activeAlert: { camera_ap: string, alert_id: string, } ) {
    await startAlertHandle(activeAlert)
    if (await handleAlert(activeAlert)) {
        activeAlerts = activeAlerts.filter(element => element.alert_id != activeAlert.alert_id);
    };
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

