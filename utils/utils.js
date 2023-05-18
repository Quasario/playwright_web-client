import { getCamerasEndpoints } from "../http_api/http_cameras";
import { getLayoutList } from "../http_api/http_layouts"
import { deleteCameras } from "../grpc_api/cameras"
import { deleteLayouts } from "../grpc_api/layouts"
import { getRolesAndUsers, deleteRoles } from "../grpc_api/roles"
import { deleteUsers } from "../grpc_api/users"
import { Configuration } from "../global_variables"




export async function isCameraListOpen(page) {
    await page.waitForTimeout(500); //list close/open animation timeout
    let isVisible = await page.locator('.camera-list [type="checkbox"]').last().isVisible(); //favorite button is visible
    return isVisible;
};

export async function getCameraList() {
    let cameras = await getCamerasEndpoints();
    let newArr = [];
    for (let camera of cameras) {
        let cameraVideochannel = camera.accessPoint.replace("SourceEndpoint.video:", "VideoChannel.").replace(/:\w*/, "");
        let cameraBinding = camera.accessPoint.replace(/\/SourceEndpoint.video:.*/, "");
        let isIpServer = false;
        if (camera.displayId.includes('.')) {
            isIpServer = true;
        };

        camera['videochannelID'] = cameraVideochannel;
        camera['cameraBinding'] = cameraBinding;
        camera['isIpServer'] = isIpServer;
        
        newArr.push(camera);
    }
    return(newArr);
};

export async function cameraAnnihilator(cameras = []) {
    let cameraList;

    if (cameras.length == 0){
        cameraList = await getCameraList();
    } else cameraList = cameras;

    let cameraEndpoints = [];
    for (let camera of cameraList) {
        if (!cameraEndpoints.includes(camera.cameraBinding)) {
            cameraEndpoints.push(camera.cameraBinding);
        }
    }

    // console.log(cameraEndpoints);
    if (cameraEndpoints.length != 0) {
        await deleteCameras(cameraEndpoints);
    }
    
};

export async function layoutAnnihilator(layouts = []) {
    let layoutList;
    
    if (layouts.length == 0){
        layoutList = await getLayoutList();
    } else layoutList = layouts;
    
    let layoutIDs = [];
    for (let layout of layoutList) {
        if (!layoutIDs.includes(layout?.meta?.layout_id)) {
            layoutIDs.push(layout.meta.layout_id);
        }
    }

    // console.log(layoutIDs);
    if (layoutIDs.length != 0) {
        await deleteLayouts(layoutIDs);
    }
    
};

export async function userAnnihilator(users = []) {
    let userList;
    
    if (users.length == 0){
        userList = await getRolesAndUsers();
    } else userList = users;
    
    let userIDs = [];
    for (let user of userList.users) {
        if (!userIDs.includes(user?.index) && user.name != "root") {
            userIDs.push(user.index);
        }
    }

    // console.log(userIDs);
    if (userIDs.length != 0) {
        await deleteUsers(userIDs);
    }
    
};

export async function roleAnnihilator(roles = []) {
    let roleList;
    
    if (roles.length == 0){
        roleList = await getRolesAndUsers();
    } else roleList = roles;
    
    let roleIDs = [];
    for (let role of roleList.roles) {
        if (!roleIDs.includes(role?.index) && role.name != "admin") {
            roleIDs.push(role.index);
        }
    }

    // console.log(roleIDs);
    if (roleIDs.length != 0) {
        await deleteRoles(roleIDs);
    }
    
};

export async function configurationCollector(type = "all") {
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
}