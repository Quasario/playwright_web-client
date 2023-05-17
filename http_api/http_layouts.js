import {currentURL, createdUnits, videoFolder} from '../global_variables';

export async function getLayoutList() {
    let request = await fetch(`${currentURL}/v1/layouts`, {
        headers: {
            "Authorization": "Basic cm9vdDpyb290",
        }
    });

    let layoutList = await request.json();
    return layoutList.items;
};