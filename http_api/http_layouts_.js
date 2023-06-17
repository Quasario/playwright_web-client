import {currentURL, createdUnits, videoFolder} from '../global_variables';
import { green, blue, yellow, red } from 'colors';

export async function getLayoutList() {
    let request = await fetch(`${currentURL}/v1/layouts`, {
        headers: {
            "Authorization": "Basic cm9vdDpyb290",
        }
    });

    let layoutList = await request.json();
    
    if (request.ok) {
        return layoutList.items;
    } else console.log(`Error: could not pull layouts list. Code: ${request.status}`.red);
};