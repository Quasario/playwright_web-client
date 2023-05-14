import {currentURL, createdUnits, videoFolder} from '../global_variables';

export async function getCamerasEndpoints() {
    let request = await fetch(`${currentURL}/camera/list`, {
        headers: {
            "Authorization": "Basic cm9vdDpyb290",
        }
    });

    let camerasList = await request.json();
    return camerasList.cameras;
};