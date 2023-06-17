import {currentURL, archiveDirection, hostName} from '../global_variables';
import { green, blue, yellow, red } from 'colors';
import { configurationCollector } from "../utils/utils.js";


export async function createArchive(archiveName = 'White') {

    let body = {
        "method": "axxonsoft.bl.config.ConfigurationService.ChangeConfig",
        "data": {
        "added": [
            {
                "uid": `hosts/${hostName}`,
                "units": [
                    {
                        "type": "MultimediaStorage",
                        "properties": [
                            {
                            "id": "enabled",
                            "value_bool": true
                            },
                            {
                            "id": "display_name",
                            "value_string": archiveName
                            },
                            {
                            "id": "color",
                            "value_string": archiveName
                            }
                        ]
                    }
                ]
            }
        ]}
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
        console.log(`Archive "${archiveName}" was successfully created!`.green);
    } else console.log(`Error: Archive was not created. Code: ${request.status}, Failed: ${response.failed}`.red);
    await configurationCollector("archives");
}

export async function createArchiveVolume(archiveName = 'White', fileSize = 10) {

    let body = {
        "method": "axxonsoft.bl.config.ConfigurationService.ChangeConfig",
        "data": {
        "added": [
            {
                "uid": `hosts/${hostName}/MultimediaStorage.${archiveName}`,
                "units": [
                    {
                        "type": "ArchiveVolume",
                        "properties": [
                            {
                                "id": "volume_type",
                                "value_string": "local",
                                "properties": [
                                    {
                                        "id": "file_name",
                                        "value_string": `${archiveDirection}/archive${archiveName}` //C:/archiveWhite.afs
                                    }
                                ]
                            },
                            {
                                "id": "file_size",
                                "value_int32": fileSize
                            },
                            {
                                "id": "format",
                                "value_bool": true
                            }
                        ]
                    }
                ]
            }
        ]}
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
        console.log(`Archive volume with size: ${fileSize}GB was successfully created in direction ${archiveDirection}!`.green);
    } else console.log(`Error: Archive volume was not created. Code: ${request.status}, Failed: ${response.failed}`.red);
    
};

export async function deleteArchive(archiveName: string) {

    let body = {
        "method":"axxonsoft.bl.config.ConfigurationService.ChangeConfig",
        "data":{
            "removed":[
                {
                "uid": `hosts/${hostName}/MultimediaStorage.${archiveName}`, //hosts/Server1/MultimediaStorage.Aqua
                "type": "MultimediaStorage",
                "properties": [],
                "units": [],
                "opaque_params": []
            }]
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
        console.log(`Archive "${archiveName}" was successfully deleted!`.green);
    } else console.log(`Error: Archive "${archiveName}" was not deleted. Code: ${request.status}, Failed: ${response.failed}`.red);
    await configurationCollector("archives");
};

export async function getArchiveList() {

    let body = {
        "method":"axxonsoft.bl.config.ConfigurationService.ListUnits",
        "data":{
            "unit_uids": [`hosts/${hostName}`]
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

    let output: any[] = [];
    if (request.ok) {
        
        for (let unit of response.units[0].units) {
            if (unit.type == "MultimediaStorage") {
                output.push(unit);
            }
        }

    } else console.log(`Error: Coudn't pull archive list. Code: ${request.status}, Failed: ${response.failed}`.red);

    return output;
};

export async function createArchiveContext(archiveName: string, camerasList: { [key: string]: any }[], isConstantRec = true, stream: "High" | "Low" = "High") {
    let unitsList: object[] = [];
    for (let camera of camerasList) {
        if (stream == "Low") {
            unitsList.push({
                "type": "ArchiveContext",
                "properties": [
                    {
                        "id": "camera_ref",
                        "value_string": camera.accessPoint
                    },
                    {
                        "id": "constant_recording",
                        "value_bool": isConstantRec
                    },
                    {
                        "id": "streaming_id",
                        "value_string": camera.videoStreams[1].accessPoint
                    },
                    {
                        "id": "prerecord_sec",
                        "value_int32": 0
                    },
                    {
                        "id": "day_depth",
                        "value_int32": 0
                    },
                    {
                        "id": "specific_fps",
                        "value_double": 0
                    }
                ]
            });
        } else {
            unitsList.push({
                "type": "ArchiveContext",
                "properties": [
                    {
                        "id": "camera_ref",
                        "value_string": camera.accessPoint
                    },
                    {
                        "id": "constant_recording",
                        "value_bool": isConstantRec
                    },
                    {
                        "id": "streaming_id",
                        "value_string": camera.videoStreams[0].accessPoint
                    },
                    {
                        "id": "prerecord_sec",
                        "value_int32": 0
                    },
                    {
                        "id": "day_depth",
                        "value_int32": 0
                    },
                    {
                        "id": "specific_fps",
                        "value_double": 0
                    }
                ]
            });
        }          
    };

    let body = {
        "method": "axxonsoft.bl.config.ConfigurationService.ChangeConfig",
        "data": {
            "added": [
                {
                    "uid": `hosts/${hostName}/MultimediaStorage.${archiveName}`,
                    "units": unitsList
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
        let output = camerasList.map(item => `${item.displayId}.${item.displayName}`)
        console.log(`Archive context was created for cameras ${output.toString()}!`.green);
    } else console.log(`Error: Coudn't created archive context for cameras. Code: ${request.status}, Failed: ${response.failed}`.red);
    await configurationCollector("cameras");
};


