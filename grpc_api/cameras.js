import {currentURL, createdUnits} from '../global_variables';

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
    }else console.log(`Error: could not delete cameras ${camerasEndpoints.toString()}. Code: ${request.status}`);
};



