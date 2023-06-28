import {currentURL, videoFolder, hostName} from '../global_variables';
import { green, blue, yellow, red } from 'colors';

export async function getArchiveIntervals(archiveName: string, camera: { [key: string]: any, 'accessPointChanged': string }, endTime: string, startTime: string) {
    let request = await fetch(`${currentURL}/archive/contents/intervals/${camera.accessPointChanged}/${endTime}/${startTime}?archive=hosts/${hostName}/MultimediaStorage.${archiveName}/MultimediaStorage&limit=1024&offset=0&scale=1`, {
        headers: {
            "Authorization": "Basic cm9vdDpyb290",
        }
    });

    let intervalsList = await request.json();

    if (request.ok) {
        console.log(intervalsList.intervals);
        return intervalsList.intervals;
        
    } else console.log(`Error: could not pull cameras list. Code: ${request.status}`.red);
};