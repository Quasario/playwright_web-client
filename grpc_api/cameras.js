import { currentURL, videoFolder, hostName } from '../global_variables';
import { green, blue, yellow, red } from 'colors';
import { configurationCollector } from "../utils/utils.js";


export async function createCamera(count=1, vendor="AxxonSoft", model="Virtual several streams", login="admin", password="admin", address="0.0.0.0", port="80", displayID="", displayName="") {
    // let hostName = await getHostName();

    let body = {
        "method": "axxonsoft.bl.config.ConfigurationService.ChangeConfig",
        "data": {
            "added": [
                {
                    "uid": `hosts/${hostName}`,
                    "units": [
                        {
                            "type": "DeviceIpint",
                            "units": [],
                            "properties": [
                                {
                                    "id": "vendor",
                                    "value_string": `${vendor}`,
                                    "properties": []
                                },
                                {
                                    "id": "model",
                                    "value_string": `${model}`,
                                    "properties": []
                                },
                                {
                                    "id": "user",
                                    "value_string": `${login}`,
                                    "properties": []
                                },
                                {
                                    "id": "password",
                                    "value_string": `${password}`,
                                    "properties": []
                                },
                                {
                                    "id": "address",
                                    "value_string": `${address}`,
                                    "properties": []
                                },
                                {
                                    "id": "port",
                                    "value_string": `${port}`,
                                    "properties": []
                                },
                                {
                                    "id": "display_name",
                                    "value_string": `${displayName}`,
                                    "properties": []
                                },
                                {
                                    "id": "display_id",
                                    "value_string": `${displayID}`,
                                    "properties": []
                                },
                                {
                                    "id": "recordingMode",
                                    "value_string": "",
                                    "properties": []
                                },
                                {
                                    "id": "archiveBinding",
                                    "value_string": "",
                                    "properties": []
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    };

    for (let i = 1; i <= count; i++) {

        let request = await fetch(`${currentURL}/grpc`, {
            headers: {
                "Authorization": "Basic cm9vdDpyb290",
            },
            method: "POST",
            body: JSON.stringify(body)
        });

        let response = await request.json();

        if (request.ok && !response.failed.length) {
            console.log(`Camera (${vendor}/${model}) №${i} was successfully created!`.green);
        } else console.log(`Error: Camera №${i} was not created. Code: ${request.status}, Failed: ${response.failed}`.red);
    }
    await configurationCollector("cameras");
}


export async function deleteCameras(camerasEndpoints) {
    let deleteArr = [];
    for (let camera of camerasEndpoints) {
        deleteArr.push({"uid": camera})
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


export async function changeSingleCameraActiveStatus(cameraEndpoint, bool=false) {

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
        console.log(`Camera (${cameraEndpoint}) was ${bool ? "enabled" : "disabled"}.`.green);
    } else console.log(`Error: Camera (${cameraEndpoint}) coudn't change status. Code: ${request.status}, Failed: ${response.failed}`.red);

    await configurationCollector("cameras");
};


export async function changeSingleCameraID(cameraEndpoint, newID) {

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
        console.log(`Camera (${cameraEndpoint}) friendly ID was changed to "${newID}".`.green);
    } else console.log(`Error: Camera (${cameraEndpoint}) friendly ID coudn't change. Code: ${request.status}, Failed: ${response.failed}`.red);

    await configurationCollector("cameras");
};


export async function changeSingleCameraName(cameraEndpoint, newName) {

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
        console.log(`Camera (${cameraEndpoint}) name was changed to "${newName}".`.green);
    } else console.log(`Error: Camera (${cameraEndpoint}) name coudn't change. Code: ${request.status}, Failed: ${response.failed}`.red);

    await configurationCollector("cameras");
};


export async function changeIPServerCameraActiveStatus(videoChannelEndpoint, bool) {

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
        console.log(`Camera (${videoChannelEndpoint}) was ${bool ? "enabled" : "disabled"}.`.green);
    } else console.log(`Error: Camera (${videoChannelEndpoint}) coudn't change status. Code: ${request.status}, Failed: ${response.failed}`.red);

    await configurationCollector("cameras");
};


export async function changeIPServerCameraID(videoChannelEndpoint, newID) {

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
        console.log(`Camera (${videoChannelEndpoint}) friendly ID was changed to "${newID}".`.green);
    } else console.log(`Error: Camera (${videoChannelEndpoint}) friendly ID coudn't change. Code: ${request.status}, Failed: ${response.failed}`.red);

    await configurationCollector("cameras");
};


export async function changeIPServerCameraName(videoChannelEndpoint, newName) {

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
        console.log(`Camera (${videoChannelEndpoint}) name was changed to "${newName}".`.green);
    } else console.log(`Error: Camera (${videoChannelEndpoint}) name coudn't change. Code: ${request.status}, Failed: ${response.failed}`.red);

    await configurationCollector("cameras");
};

export async function addVirtualVideo(camerasList, highStreamVideo, lowStreamVideo) {
    for(let camera of camerasList) {

        let body = {
            "method": "axxonsoft.bl.config.ConfigurationService.ChangeConfig",
            "data": {
                "changed": [
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
                    },
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
                    },
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
            console.log(`Videos (${highStreamVideo}/${lowStreamVideo}) was added to camera (${camera.videochannelID}).`.green);
        } else console.log(`Error: Coudn't add video to camera ${camera.videochannelID}. Code: ${request.status}, Failed: ${response.failed}`.red);
    }
};


export async function getUnitsList(endpoints) {

    let body = {
        "method": "axxonsoft.bl.config.ConfigurationService.ListUnits",
        "data": {
            "unit_uids": endpoints
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
        console.log(`Unit list for ${endpoints.toString()} were provided.`.green);
        let response = await request.json();
        // console.log(response);
        return response;
    } else console.log(`Error: Pull units information failed. Code: ${request.status}`.red);
};

