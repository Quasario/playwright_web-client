import {currentURL, videoFolder} from '../global_variables';
import { green, blue, yellow, red } from 'colors';

export async function getCamerasEndpoints() {
    let request = await fetch(`${currentURL}/camera/list`, {
        headers: {
            "Authorization": "Basic cm9vdDpyb290",
        }
    });

    let camerasList = await request.json();


    if (request.ok) {  
        return camerasList.cameras;
    } else console.log(`Error: could not pull cameras list. Code: ${request.status}`.red);
};