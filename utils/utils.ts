import { test, expect, type Page, Locator} from '@playwright/test';
import { getCamerasEndpoints } from "../http_api/http_cameras";
import { getLayoutList } from "../http_api/http_layouts";
import { deleteCameras } from "../grpc_api/cameras";
import { deleteLayouts } from "../grpc_api/layouts";
import { getRolesAndUsers, deleteRoles } from "../grpc_api/roles";
import { deleteUsers } from "../grpc_api/users";
import { Configuration, currentURL } from "../global_variables";
import { deleteGroup, getGroups } from "../grpc_api/groups";
import { getArchiveList } from "../grpc_api/archives";


export async function authorization(page: Page, userName: string, userPassword: string) {
    await page.getByLabel('Login').fill(userName);
    await page.getByLabel('Password').fill(userPassword);
    await page.getByLabel('Password').press('Enter');
};

export async function logout(page: Page) {
    await page.locator('#at-top-menu-btn').click();
    await page.getByRole('menuitem', { name: 'Change user' }).click();
};

export async function isCameraListOpen(page: Page) {
    await page.waitForTimeout(500); //list close/open animation timeout
    let isVisible = await page.locator('.camera-list [type="checkbox"]').last().isVisible(); //favorite button is visible
    return isVisible;
};

export async function openCameraList(page: Page) {
    // await page.waitForTimeout(500);
    await waitAnimationEnds(page, page.getByRole('button', { name: 'Hardware'}));
    let panelSize = await page.locator('.camera-list').boundingBox();
    // console.log(panelSize);
    if (panelSize!.width < 50) {
        await page.getByRole('button', { name: 'Hardware'}).click();
    };
};

export async function closeCameraList(page: Page) {
    // await page.waitForTimeout(500);
    await waitAnimationEnds(page, page.getByRole('button', { name: 'Hardware'}));
    let panelSize = await page.locator('.camera-list').boundingBox();
    // console.log(panelSize);
    if (panelSize!.width > 50) {
        await page.getByRole('button', { name: 'Hardware'}).click();
    };
};

export async function getCameraList() {
    let cameras = await getCamerasEndpoints();
    let newArr: { [key: string]: any, 'videochannelID': string, 'cameraBinding': string, 'accessPointChanged': string,  "isIpServer": boolean }[] = [];
    for (let camera of cameras) {
        let cameraVideochannel = camera.accessPoint.replace("SourceEndpoint.video:", "VideoChannel.").replace(/:\w*/, "");
        let cameraBinding = camera.accessPoint.replace(/\/SourceEndpoint.video:.*/, "");
        let accessPointChanged = camera.accessPoint.replace("hosts/", "");
        let isIpServer = false;
        if (camera.displayId.includes('.')) {
            isIpServer = true;
        };

        camera['videochannelID'] = cameraVideochannel;
        camera['cameraBinding'] = cameraBinding;
        camera['accessPointChanged'] = accessPointChanged;
        camera['isIpServer'] = isIpServer;
        
        newArr.push(camera);
    }
    return(newArr);
};

export async function cameraAnnihilator(cameras: 'all' | { [key: string]: any, "cameraBinding": string }[]) {
    let cameraList: { [key: string]: any, cameraBinding: string }[];

    if (cameras == "all") {
        cameraList = await getCameraList();
    } else cameraList = cameras;

    let cameraEndpoints: string[] = [];
    for (let camera of cameraList) {
        if (!cameraEndpoints.includes(camera.cameraBinding)) {
            cameraEndpoints.push(camera.cameraBinding);
        }
    }

    if (cameraEndpoints.length != 0) {
        await deleteCameras(cameraEndpoints);
    }    
};

export async function layoutAnnihilator(layouts: 'all' | { [key: string]: any }[]) {
    let layoutList: { [key: string]: any }[] = [];
    
    if (layouts == "all") {
        layoutList = await getLayoutList();
    } else layoutList = layouts;
    
    let layoutIDs: string[] = [];
    for (let layout of layoutList) {
        if (!layoutIDs.includes(layout?.meta?.layout_id)) {
            layoutIDs.push(layout.meta.layout_id);
        }
    }

    if (layoutIDs.length != 0) {
        await deleteLayouts(layoutIDs);
    } 
};

export async function userAnnihilator(users: 'all' | { [key: string]: any, index: string }[]) {
    let userList: { [key: string]: any, index: string }[] = [];
    
    if (users == "all") {
        let rolesAndUsers = await getRolesAndUsers();
        userList = rolesAndUsers.users;
    } else userList = users;
    
    let userIDs: string[] = [];
    for (let user of userList) {
        if (!userIDs.includes(user?.index) && user.name != "root") {
            userIDs.push(user.index);
        }
    }

    if (userIDs.length != 0) {
        await deleteUsers(userIDs);
    }  
};

export async function roleAnnihilator(roles: 'all' | { [key: string]: any, index: string }[]) {
    let roleList: { [key: string]: any, index: string }[] = [];
    
    if (roles == "all") {
        let rolesAndUsers = await getRolesAndUsers();
        roleList = rolesAndUsers.roles;
    } else roleList = roles;
    
    let roleIDs: string[] = [];
    for (let role of roleList) {
        if (!roleIDs.includes(role?.index) && role.name != "admin") {
            roleIDs.push(role.index);
        }
    }

    if (roleIDs.length != 0) {
        await deleteRoles(roleIDs);
    }  
};

export async function groupAnnihilator(groups: 'all' | { [key: string]: any, group_id: string }[]) {
    let groupList: { [key: string]: any, group_id: string }[] = [];
    
    if (groups == "all"){
        groupList = await getGroups();
    } else groupList = groups;
    
    let groupIDs: string[] = [];
    for (let group of groupList) {
        if (!groupIDs.includes(group?.group_id) && group.name != "Default") {
            groupIDs.push(group.group_id);
        }
    }

    if (groupIDs.length != 0) {
        await deleteGroup(groupIDs);
    }  
};

export async function configurationCollector(type: "all" | "cameras" | "layouts" | "users" | "roles" | "groups" | "archives" = "all") {
    if (type == "all" || type  == "cameras") {
        let cameraList = await getCameraList();
        Configuration.cameras = cameraList;
    }

    if (type == "all" || type == "layouts") {
        let layoutList = await getLayoutList();
        Configuration.layouts = layoutList;
    }

    if (type == "all" || type == "users" || type == "roles") {

        let usersRoles = await getRolesAndUsers();

        let users = usersRoles.users.filter(element => {
            return element.name != "root";
        });
        Configuration.users = users;

        let roles = usersRoles.roles.filter(element => {
            return element.name != "admin";
        });
        Configuration.roles = roles;

    }

    if (type == "all" || type == "groups") {
        let groupList = await getGroups();
        Configuration.groups = groupList;
    }

    if (type == "all" || type == "archives") {
        let archiveList = await getArchiveList();
        Configuration.archives = archiveList;
    } 
}

export function getIdByUserName(userName: string) {
    for (let user of Configuration.users) {
        if (userName === user.login) { 
            return user.index;
        }
    }
};

export function getIdByRoleName(roleName: string) {
    for (let role of Configuration.roles) {
        if (roleName === role.name) { 
            return role.index;
        }
    }
};

export async function waitAnimationEnds(page: Page, locator: Locator) {
    // await locator.evaluate(e => Promise.all(e.getAnimations({ subtree: true }).map(animation => animation.finished)));
    let anime = await locator.evaluate(e => Promise.all(e.getAnimations({ subtree: true }).map(animation => animation.playState)));
    let i = 0;
    while (anime.length != 0) {
        i++;
        await page.waitForTimeout(100);
        anime = await locator.evaluate(e => Promise.all(e.getAnimations({ subtree: true }).map(animation => animation.playState)));
        console.log(`${anime.length} animations is processing`);

        if (i > 50) {
            //роняем тест
            expect(false).toBeTruthy();
        }
    }
}

export function timeToSeconds(time: string, accurancy = 0) {
    let timeArr = time.split(':');
    return (Number(timeArr[0])*60*60 + Number(timeArr[1])*60 + Number(timeArr[2]) + Number(accurancy));
}