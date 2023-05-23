import { test, expect, } from '@playwright/test';
import { currentURL, Configuration, hostName } from '../global_variables';
import { createRole, setRolePermissions, deleteRoles, setObjectPermissions } from '../grpc_api/roles';
import { createUser, setUserPassword, assingUserRole, deleteUsers } from '../grpc_api/users';
import { createArchive, createArchiveVolume, createArchiveContext, deleteArchive, getArchiveList } from '../grpc_api/archives';
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
    await getArchiveList();
    // await deleteArchive('Black');
    // await cameraAnnihilator();
    // await layoutAnnihilator();
    // await createCamera(1, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "80", "1", "Camera");
    // await createCamera(1, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "80", "2", "Camera");
    // await createCamera(1, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "80", "3", "Camera");
    // await createCamera(1, "AxxonSoft", "Virtual several streams", "admin123", "admin", "0.0.0.0", "80", "4", "Camera");
    // await createCamera(1, "AxxonSoft", "Virtual IP server", "admin123", "admin", "0.0.0.0", "80", "5", "Camera");
    // await createArchive("Black");
    // await createArchiveVolume("Black", 20);
    // await createArchiveContext("Black", [Configuration.cameras[0].accessPoint, Configuration.cameras[1].accessPoint, Configuration.cameras[6].accessPoint, Configuration.cameras[7].accessPoint,]);
    // await createLayout(Configuration.cameras, 2, 2, "Test Layout");
    // await createRole("New_Role");
    // await setRolePermissions("New_Role");
    // await createUser("User_1");
    // await assingUserRole("New_Role", "User_1");
    // await setUserPassword("User_1", "123");
    // console.log(Configuration);
    // await addVirtualVideo(Configuration.cameras, "lprusa", "tracker");
    // await changeSingleCameraActiveStatus(Configuration.cameras[2].cameraBinding, false);
    // await changeIPServerCameraActiveStatus(Configuration.cameras[5].videochannelID, false);
    // await changeIPServerCameraActiveStatus(Configuration.cameras[6].videochannelID, false);
    // for (let camera of Configuration.cameras) {
    //     if (camera.isIpServer){
    //         await changeIPServerCameraName(camera.videochannelID, "Camera");
    //     }
    // }
});
  
// test.afterAll(async () => {
//     await cameraAnnihilator();
//     await layoutAnnihilator();
//     await layoutAnnihilator();
//     await groupAnnihilator();
//     await roleAnnihilator();
//     await userAnnihilator();
// });

test.beforeEach(async ({ page }) => {
    // await page.goto(currentURL);
    // await page.getByLabel('Login').fill('root');
    // await page.getByLabel('Password').fill('root');
    // await page.getByLabel('Password').press('Enter');
});


test('Creation of x1 layout (CLOUD-T229)', async ({ page }) => {
    // await page.pause();
    await page.goto(currentURL);
    //Авторизация к юзеру без раскладок
    // await page.locator('#at-top-menu-btn').click();
    // await page.getByRole('menuitem', { name: 'Change user' }).click();
    // await page.getByLabel('Login').fill('User_1');
    // await page.getByLabel('Password').fill('123');
    // await page.getByLabel('Password').press('Enter');
    // //Проверяем что камеры на месте
    // await expect(page.getByRole('button', { name: '1.Camera', exact: true })).toBeVisible();
    // await expect(page.getByRole('button', { name: '2.Camera', exact: true })).toBeVisible();
    // await expect(page.getByRole('button', { name: '3.Camera', exact: true })).toBeVisible();
    // await expect(page.getByRole('button', { name: '4.Camera', exact: true })).toBeVisible();
    // await expect(page.getByRole('button', { name: '5.0.Camera', exact: true })).toBeVisible();
    // await expect(page.getByRole('button', { name: '5.1.Camera', exact: true })).toBeVisible();
    // await expect(page.getByRole('button', { name: '5.2.Camera', exact: true })).toBeVisible();
    // await expect(page.getByRole('button', { name: '5.3.Camera', exact: true })).toBeVisible();
    // //Проверяем цвета камер в списке, чтобы включенные камеры были белыми, а выключенные нет
    // await expect(page.locator("xpath=//*/p/span[text()='1.Camera']")).toHaveCSS("color", "rgb(250, 250, 250)");
    // await expect(page.locator("xpath=//*/p/span[text()='3.Camera']")).not.toHaveCSS("color", "rgb(250, 250, 250)");
    // await expect(page.locator("xpath=//*/p/span[text()='5.0.Camera']")).toHaveCSS("color", "rgb(250, 250, 250)");
    // await expect(page.locator("xpath=//*/p/span[text()='5.1.Camera']")).not.toHaveCSS("color", "rgb(250, 250, 250)");
    // await expect(page.locator("xpath=//*/p/span[text()='5.2.Camera']")).not.toHaveCSS("color", "rgb(250, 250, 250)");
});



