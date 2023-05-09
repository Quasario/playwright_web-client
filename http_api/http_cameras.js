import {currentURL, createdUnits, videoFolder} from '../global_variables';

export async function getCamerasEndpoints() {
    let request = await fetch(`${currentURL}/camera/lits`, {
        headers: {
            "Authorization": "Basic cm9vdDpyb290",
        }
    });

    let hosts = await request.json();
    return hosts[0];
}