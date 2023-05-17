import { getCamerasEndpoints } from "../http_api/http_cameras";
import { getLayoutList } from "../http_api/http_layouts"
import { deleteCameras } from "../grpc_api/cameras"
import { deleteLayouts } from "../grpc_api/layouts"




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

export async function cameraAnnihilator(cameras = getCameraList()) {
    let cameraList = await cameras;
    let cameraEndpoints = [];
    for (let camera of cameraList) {
        if (!cameraEndpoints.includes(camera.cameraBinding)) {
            cameraEndpoints.push(camera.cameraBinding);
        }
    }

    console.log(cameraEndpoints);
    if (cameraEndpoints.length != 0) {
        await deleteCameras(cameraEndpoints);
    }
    
};

export async function layoutAnnihilator(layouts = getLayoutList()) {
    let layoutList = await layouts;
    let layoutIDs = [];
    for (let layout of layoutList) {
        if (!layoutIDs.includes(layout?.meta?.layout_id)) {
            layoutIDs.push(layout.meta.layout_id);
        }
    }

    console.log(layoutIDs);
    if (layoutIDs.length != 0) {
        await deleteLayouts(layoutIDs);
    }
    
};