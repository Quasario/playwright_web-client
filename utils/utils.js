import { getCamerasEndpoints } from "../http_api/http_cameras";


export async function isCameraListOpen(page) {
    await page.waitForTimeout(500); //list close animation timeout
    let isVisible = await page.locator('.camera-list [type="checkbox"]').last().isVisible(); //favorite button is visible
    return isVisible;
};

export async function getCurrentConfiguration() {
    let cameras = await getCamerasEndpoints();
    let newArr = [];
    for (let camera of cameras) {
        let cameraVideochannel = camera.accessPoint.replace("SourceEndpoint.video:", "VideoChannel.").replace(/:\w*/, "");
        let cameraBinding = camera.accessPoint.replace(/\/SourceEndpoint.video:.*/, "");

        camera['videochannelID'] = cameraVideochannel;
        camera['cameraBinding'] = cameraBinding;
        
        newArr.push(camera);
    }
    return(newArr);
};