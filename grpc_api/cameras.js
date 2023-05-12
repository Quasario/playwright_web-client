import {currentURL, createdUnits, videoFolder, hostName} from '../global_variables';
import { green, blue, yellow, red } from 'colors';

// export async function getHostName() {
//     let request = await fetch(`${currentURL}/hosts`, {
//         headers: {
//             "Authorization": "Basic cm9vdDpyb290",
//         }
//     });

//     let hosts = await request.json();
//     return hosts[0];
// };


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
            createdUnits.cameras.push(response.added[0]);
            console.log(`Camera (${vendor}/${model}) №${i} was successfully created!`.green);
        } else console.log(`Error: Camera №${i} was not created. Code: ${request.status}, Failed: ${response.failed}`.red);
    }

    
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
        createdUnits.cameras = createdUnits.cameras.filter(i => !camerasEndpoints.includes(i)); //clear array from deleted items
        console.log(`Cameras ${camerasEndpoints.toString()} was successfully deleted!`.green);
        console.log(createdUnits);
    } else console.log(`Error: could not delete cameras ${camerasEndpoints.toString()}. Code: ${request.status}`.red);
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
};

export async function addVirtualVideo(videoChannelsEndpoints, highStreamVideo, lowStreamVideo) {
    for(let videoChannelEndpoint of videoChannelsEndpoints) {
        console.log(videoChannelEndpoint.uid);
        let body = {
            "method": "axxonsoft.bl.config.ConfigurationService.ChangeConfig",
            "data": {
                "changed": [
                    {
                        "uid": `${videoChannelEndpoint.uid}/Streaming.0`,
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
                        "uid": `${videoChannelEndpoint.uid}/Streaming.1`,
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
            console.log(`Videos (${highStreamVideo}/${lowStreamVideo}) was added to camera (${videoChannelEndpoint.uid}).`.green);
        } else console.log(`Error: Coudn't add video to camera ${videoChannelEndpoint}. Code: ${request.status}, Failed: ${response.failed}`.red);
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


export async function getVideChannelsList(camerasEndpoint) {
    let videoChannels = [];
    let camerasProps = [];
    for (let cam of camerasEndpoint) {
        let unit = await getUnitsList([cam]);
        camerasProps.push(unit.units[0]);
    };
    // console.log(camerasProps);
    
    for (let camera of camerasProps) {
        for (let channel of camera.units) {
            if (channel.type == "VideoChannel") {
                let videoChannelProps = {
                    uid: channel.uid,
                    accessPoint: channel.access_point,
                    cameraBinding: channel.config_name,
                };
                videoChannels.push(videoChannelProps);
            }
        }
        
    };
    console.log(videoChannels); //{ uid: 'hosts/DESKTOP-MQ5GFT5/DeviceIpint.22/VideoChannel.3', accessPoint: 'hosts/DESKTOP-MQ5GFT5/DeviceIpint.22/SourceEndpoint.video:3:0', cameraBinding: 'hosts/DESKTOP-MQ5GFT5/DeviceIpint.22', id: 25}
    return(videoChannels);
};


// export async function getVideChannelsList(camerasEndpoint) {
//     let videoChannels = [];
//     let units = await getUnitsList(camerasEndpoint);

//     for (let cameras of units.units) {
//         for (let channel of cameras.units) {
//             if (channel.type == "VideoChannel") {
//                 videoChannels.push(channel.uid);
//             }
//         }
        
//     };
//     console.log(videoChannels);
//     return(videoChannels);
// };


// export async function getVideChannelsList(camerasEndpoint) {
//     let videoChannels = [];
//     let camerasProps = [];
//     for (let cam of camerasEndpoint) {
//         let unit = await getUnitsList([cam]);
//         camerasProps.push(unit.units[0]);
//     };
//     console.log(camerasProps);
    

//     for (let camera of camerasProps) {
//         for (let channel of camera.units) {
//             if (channel.type == "VideoChannel") {
//                 videoChannels.push(channel.uid);
//             }
//         }
        
//     };
//     console.log(videoChannels);
//     return(videoChannels);
// };