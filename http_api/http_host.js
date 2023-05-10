import {currentURL} from '../global_variables';

export async function getHostName() {
    let request = await fetch(`${currentURL}/hosts`, {
        headers: {
            "Authorization": "Basic cm9vdDpyb290",
        }
    });

    let hosts = await request.json();
    return hosts[0];
}