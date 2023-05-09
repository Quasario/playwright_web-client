import {currentURL, createdUnits, videoFolder} from '../global_variables';

export async function getHostName() {
    let request = await fetch(`${currentURL}/hosts`, {
        headers: {
            "Authorization": "Basic cm9vdDpyb290",
        }
    });

    let hosts = await request.json();
    return hosts[0];
}

export async function createCamera(count=1, vendor="AxxonSoft", model="Virtual several streams", login="admin", password="admin", address="0.0.0.0", port="80") {
    let hostName = await getHostName();

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
                                    "value_string": "",
                                    "properties": []
                                },
                                {
                                    "id": "display_id",
                                    "value_string": "",
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
            console.log(`Camera (${vendor}/${model}) №${i} was successfully created!`);
        } else console.log(`Error: Camera №${i} was not created. Code: ${request.status}, Failed: ${response.failed}`);
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
        console.log(`Cameras ${deleteArr.toString()} was successfully deleted!`);
    } else console.log(`Error: could not delete cameras ${camerasEndpoints.toString()}. Code: ${request.status}`);
};

export async function changeSingleCameraActiveStatus(camerasEndpoint, bool) {

    let body = {
        "method": "axxonsoft.bl.config.ConfigurationService.ChangeConfig",
        "data": {
            "changed": [
                {
                    "uid": camerasEndpoint,
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
        console.log(`Camera (${camerasEndpoint}) was ${bool ? "enabled" : "disabled"}.`);
    } else console.log(`Error: Camera (${camerasEndpoint}) coudn't change status. Code: ${request.status}, Failed: ${response.failed}`);
};

export async function changeIPServerCameraActiveStatus(camerasEndpoint, bool) {

    let body = {
        "method": "axxonsoft.bl.config.ConfigurationService.ChangeConfig",
        "data": {
            "changed": [
                {
                    "uid": camerasEndpoint,
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
        console.log(`Camera (${camerasEndpoint}) was ${bool ? "enabled" : "disabled"}.`);
    } else console.log(`Error: Camera (${camerasEndpoint}) coudn't change status. Code: ${request.status}, Failed: ${response.failed}`);
};


export async function addVirtualVideo(videoChannelsEndpoints, highStreamVideo, lowStreamVideo) {
    for(let videoChannelEndpoint of videoChannelsEndpoints) {
        console.log(videoChannelEndpoint);
        let body = {
            "method": "axxonsoft.bl.config.ConfigurationService.ChangeConfig",
            "data": {
                "changed": [
                    {
                        "uid": `${videoChannelEndpoint}/Streaming.0`,
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
                        "uid": `${videoChannelEndpoint}/Streaming.1`,
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
            console.log(`Videos (${highStreamVideo}/${lowStreamVideo}) was added to camera (${videoChannelEndpoint}).`);
        } else console.log(`Error: Coudn't add video to camera ${videoChannelEndpoint}. Code: ${request.status}, Failed: ${response.failed}`);
    }
};

export async function getUnitsList(Endpoints) {

    let body = {
        "method": "axxonsoft.bl.config.ConfigurationService.ListUnits",
        "data": {
            "unit_uids": Endpoints
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
        let response = await request.json();
        return response;
    } else console.log(`Error: Pull cameras information failed. Code: ${request.status}`);
};

export async function getVideChannelsList(camerasEndpoint) {
    let videoChannels = [];
    let units = await getUnitsList(camerasEndpoint);

    for (let cameras of units.units) {
        for (let channel of cameras.units) {
            if (channel.type == "VideoChannel") {
                videoChannels.push(channel.uid);
            }
        }
        
    };
    console.log(videoChannels);
    return(videoChannels);
};