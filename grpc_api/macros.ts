import { currentURL, videoFolder, hostName } from '../global_variables';
import { green, blue, yellow, red } from 'colors';
import { configurationCollector } from "../utils/utils.js";
import { randomUUID } from 'node:crypto';


export async function createDetectorRecordingMacro(camera: { [key: string]: any }, detectorNumber: number, name = "Macro1", enabled = true, archiveName = "", timeout = 0 ) {
    let guid = randomUUID();

    let obj = {
        "guid": guid,
        "name": name,
        "mode": {
            "enabled": enabled,
            "user_role": "",
            "is_add_to_menu": false,
            "autorule": {
                "zone_ap": camera.accessPoint,
                "only_if_armed": false,
                "timezone_id": "00000000-0000-0000-0000-000000000000"
            }
        },
        "conditions": {
            "0": {
                "path": "",
                "detector": {
                    "event_type": camera.detectors[detectorNumber].events[0],
                    "source_ap": camera.detectors[detectorNumber].accessPoint,
                    "state": "BEGAN",
                    "details": []
                }
            }
        },
        "rules": {
            "0": {
                "path": "",
                "action": {
                    "timeout_ms": timeout,
                    "cancel_conditions": {
                        "0": {
                            "path": "",
                            "detector": {
                                "event_type": camera.detectors[detectorNumber].events[0],
                                "source_ap": camera.detectors[detectorNumber].accessPoint,
                                "state": "ENDED",
                                "details": []
                            }
                        }
                    },
                    "action": {
                        "write_archive": {
                            "camera": camera.accessPoint,
                            "archive": archiveName ? `hosts/${hostName}/MultimediaStorage.${archiveName}/MultimediaStorage` : "",
                            "min_prerecord_ms": 0,
                            "post_event_timeout_ms": 0,
                            "fps": 0
                        }
                    }
                }
            }
        }
    }

    let body = {
        "method": "axxonsoft.bl.logic.LogicService.ChangeMacros",
        "data": {
            "added_macros": obj
        }
    };

    let request = await fetch(`${currentURL}/grpc`, {
        headers: {
            "Authorization": "Basic cm9vdDpyb290",
        },
        method: "POST",
        body: JSON.stringify(body)
    });

    let response = await request.json();

    if (request.ok && !response.failed.length) {
        console.log(`Was created recording macro for detector: ${camera.detectors[detectorNumber].displayName}, camera: ${camera.accessPoint}.`.green);
    } else console.log(`Error: Coudn't create recording macro for detector: ${camera.detectors[detectorNumber].displayName}, camera: ${camera.accessPoint}. Code: ${request.status}, Failed: ${response.failed}`.red);
    
    // await configurationCollector("cameras");
}






export async function deleteCameras(camerasEndpoints: string[]) {
    let deleteArr: object[] = [];
    for (let camera of camerasEndpoints) {
        deleteArr.push({ "uid": camera });
    }

    let body = {
        "method": "axxonsoft.bl.config.ConfigurationService.ChangeConfig",
        "data": {
            "removed": deleteArr
        }
    };

    let request = await fetch(`${currentURL}/grpc`, {
        headers: {
            "Authorization": "Basic cm9vdDpyb290",
        },
        method: "POST",
        body: JSON.stringify(body)
    });
    
    if (request.ok) {  
        console.log(`Cameras ${camerasEndpoints.toString()} was successfully deleted!`.green);
    } else console.log(`Error: could not delete cameras ${camerasEndpoints.toString()}. Code: ${request.status}`.red);

    await configurationCollector("cameras");
};


export async function changeSingleCameraActiveStatus(cameraEndpoint: string, bool = false) {

    let body = {
        "method": "axxonsoft.bl.config.ConfigurationService.ChangeConfig",
        "data": {
            "changed": [
                {
                    "uid": cameraEndpoint,
                    "type": "DeviceIpint",
                    "properties": [
                        {
                            "id": "enabled",
                            "value_bool": bool
                        }
                    ],
                    "opaque_params": []
                }
            ]
        }
    };

    let request = await fetch(`${currentURL}/grpc`, {
        headers: {
            "Authorization": "Basic cm9vdDpyb290",
        },
        method: "POST",
        body: JSON.stringify(body)
    });
    
    let response = await request.json();

    if (request.ok && !response.failed.length) {
        console.log(`Camera "${cameraEndpoint}" was ${bool ? "enabled" : "disabled"}.`.green);
    } else console.log(`Error: Camera "${cameraEndpoint}" coudn't change status. Code: ${request.status}, Failed: ${response.failed}`.red);

    await configurationCollector("cameras");
};


export async function changeSingleCameraID(cameraEndpoint: string, newID: string) {

    let body = {
        "method": "axxonsoft.bl.config.ConfigurationService.ChangeConfig",
        "data": {
            "changed": [
                {
                    "uid": cameraEndpoint,
                    "type": "DeviceIpint",
                    "properties": [
                        {
                            "id": "display_id",
                            "value_string": newID
                        }
                    ],
                    "opaque_params": []
                }
            ]
        }
    };

    let request = await fetch(`${currentURL}/grpc`, {
        headers: {
            "Authorization": "Basic cm9vdDpyb290",
        },
        method: "POST",
        body: JSON.stringify(body)
    });
    
    let response = await request.json();

    if (request.ok && !response.failed.length) {
        console.log(`Camera "${cameraEndpoint}" friendly ID was changed to "${newID}".`.green);
    } else console.log(`Error: Camera "${cameraEndpoint}" friendly ID coudn't change. Code: ${request.status}, Failed: ${response.failed}`.red);

    await configurationCollector("cameras");
};


export async function changeSingleCameraName(cameraEndpoint: string, newName: string) {

    let body = {
        "method": "axxonsoft.bl.config.ConfigurationService.ChangeConfig",
        "data": {
            "changed": [
                {
                    "uid": cameraEndpoint,
                    "type": "DeviceIpint",
                    "properties": [
                        {
                            "id": "display_name",
                            "value_string": newName
                        }
                    ],
                    "opaque_params": []
                }
            ]
        }
    };

    let request = await fetch(`${currentURL}/grpc`, {
        headers: {
            "Authorization": "Basic cm9vdDpyb290",
        },
        method: "POST",
        body: JSON.stringify(body)
    });
    
    let response = await request.json();

    if (request.ok && !response.failed.length) {
        console.log(`Camera "${cameraEndpoint}" name was changed to "${newName}".`.green);
    } else console.log(`Error: Camera "${cameraEndpoint}" name coudn't change. Code: ${request.status}, Failed: ${response.failed}`.red);

    await configurationCollector("cameras");
};

export async function changeMicrophoneStatus(camerasEndpoint: { [key: string]: any, "cameraBinding": string }, bool = false) {

    const microphoneEndpoint = `${camerasEndpoint.cameraBinding}/Microphone.0`;
    let body = {
        "method": "axxonsoft.bl.config.ConfigurationService.ChangeConfig",
        "data": {
            "changed": [
                {
                    "uid": microphoneEndpoint,
                    "type": "Microphone",
                    "properties": [
                        {
                            "id": "enabled",
                            "value_bool": bool
                        }
                    ],
                    "opaque_params": []
                }
            ]
        }
    };

    let request = await fetch(`${currentURL}/grpc`, {
        headers: {
            "Authorization": "Basic cm9vdDpyb290",
        },
        method: "POST",
        body: JSON.stringify(body)
    });
    
    let response = await request.json();

    if (request.ok && !response.failed.length) {
        console.log(`Microphone "${microphoneEndpoint}" was ${bool ? "enabled" : "disabled"}.`.green);
    } else console.log(`Error: Camera "${microphoneEndpoint}" coudn't change status. Code: ${request.status}, Failed: ${response.failed}`.red);

    await configurationCollector("cameras");
};

export async function changeIPServerCameraActiveStatus(videoChannelEndpoint: string, bool: boolean) {

    let body = {
        "method": "axxonsoft.bl.config.ConfigurationService.ChangeConfig",
        "data": {
            "changed": [
                {
                    "uid": videoChannelEndpoint,
                    "type": "VideoChannel",
                    "properties": [
                        {
                            "id": "enabled",
                            "value_bool": bool
                        }
                    ],
                    "opaque_params": []
                }
            ]
        }
    };

    let request = await fetch(`${currentURL}/grpc`, {
        headers: {
            "Authorization": "Basic cm9vdDpyb290",
        },
        method: "POST",
        body: JSON.stringify(body)
    });
    
    let response = await request.json();

    if (request.ok && !response.failed.length) {
        console.log(`Camera "${videoChannelEndpoint}" was ${bool ? "enabled" : "disabled"}.`.green);
    } else console.log(`Error: Camera "${videoChannelEndpoint}" coudn't change status. Code: ${request.status}, Failed: ${response.failed}`.red);

    await configurationCollector("cameras");
};


export async function changeIPServerCameraID(videoChannelEndpoint: string, newID: string) {

    let body = {
        "method": "axxonsoft.bl.config.ConfigurationService.ChangeConfig",
        "data": {
            "changed": [
                {
                    "uid": videoChannelEndpoint,
                    "type": "VideoChannel",
                    "properties": [
                        {
                            "id": "display_id",
                            "value_string": newID
                        }
                    ],
                    "opaque_params": []
                }
            ]
        }
    };

    let request = await fetch(`${currentURL}/grpc`, {
        headers: {
            "Authorization": "Basic cm9vdDpyb290",
        },
        method: "POST",
        body: JSON.stringify(body)
    });
    
    let response = await request.json();

    if (request.ok && !response.failed.length) {
        console.log(`Camera "${videoChannelEndpoint}" friendly ID was changed to "${newID}".`.green);
    } else console.log(`Error: Camera "${videoChannelEndpoint}" friendly ID coudn't change. Code: ${request.status}, Failed: ${response.failed}`.red);

    await configurationCollector("cameras");
};


export async function changeIPServerCameraName(videoChannelEndpoint: string, newName: string) {

    let body = {
        "method": "axxonsoft.bl.config.ConfigurationService.ChangeConfig",
        "data": {
            "changed": [
                {
                    "uid": videoChannelEndpoint,
                    "type": "VideoChannel",
                    "properties": [
                        {
                            "id": "display_name",
                            "value_string": newName
                        }
                    ],
                    "opaque_params": []
                }
            ]
        }
    };

    let request = await fetch(`${currentURL}/grpc`, {
        headers: {
            "Authorization": "Basic cm9vdDpyb290",
        },
        method: "POST",
        body: JSON.stringify(body)
    });
    
    let response = await request.json();

    if (request.ok && !response.failed.length) {
        console.log(`Camera "${videoChannelEndpoint}" name was changed to "${newName}".`.green);
    } else console.log(`Error: Camera "${videoChannelEndpoint}" name coudn't change. Code: ${request.status}, Failed: ${response.failed}`.red);

    await configurationCollector("cameras");
};

export async function addVirtualVideo(camerasList: { [key: string]: any, "videochannelID": string }[], highStreamVideo: string, lowStreamVideo: string) {
    let changeList: object[] = [];

    for (let camera of camerasList) {
        if (highStreamVideo) {
            changeList.push(
                {
                    "uid": `${camera.videochannelID}/Streaming.0`,
                    "type": "Streaming",
                    "properties": [
                        {
                            "id": "folder",
                            "value_string": `${videoFolder}/${highStreamVideo}`
                        }
                    ],
                    "opaque_params": []
                }
            )
        }
        if (lowStreamVideo) {
            changeList.push(
                {
                    "uid": `${camera.videochannelID}/Streaming.1`,
                    "type": "Streaming",
                    "properties": [
                        {
                            "id": "folder",
                            "value_string": `${videoFolder}/${lowStreamVideo}`
                        }
                    ],
                    "opaque_params": []
                }
            )
        }
    }

    let body = {
        "method": "axxonsoft.bl.config.ConfigurationService.ChangeConfig",
        "data": {
            "changed": changeList
        }
    };

    let request = await fetch(`${currentURL}/grpc`, {
        headers: {
            "Authorization": "Basic cm9vdDpyb290",
        },
        method: "POST",
        body: JSON.stringify(body)
    });

    let response = await request.json();
    let nameList = camerasList.map(item => `${item.displayId}.${item.displayName}`);
    if (request.ok && !response.failed.length) {
        console.log(`Videos ${highStreamVideo} / ${lowStreamVideo} was added to cameras ${nameList.toString()}.`.green);
    } else console.log(`Error: Coudn't add video to cameras ${nameList.toString()}. Code: ${request.status}, Failed: ${response.failed}`.red);

};

