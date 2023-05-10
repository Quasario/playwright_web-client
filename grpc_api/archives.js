import {currentURL, archiveDirection, createdUnits, hostName} from '../global_variables';

// export async function getHostName() {
//     let request = await fetch(`${currentURL}/hosts`, {
//         headers: {
//             "Authorization": "Basic cm9vdDpyb290",
//         }
//     });

//     let hosts = await request.json();
//     return hosts[0];
// }

export async function createArchive(archiveName='White') {

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
        createdUnits.archives.push(response.added[0]);
        console.log(`Archive(${archiveName}) was successfully created!`);
    }else console.log(`Error: Archive was not created. Code: ${request.status}, Failed: ${response.failed}`);
    
}

export async function createArchiveVolume(archiveName='White', fileSize=10) {

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
        console.log(`Archive volume with size: ${fileSize} was successfully created in direction ${archiveDirection}!`);
    }else console.log(`Error: Archive volume was not created. Code: ${request.status}, Failed: ${response.failed}`);
    
};

export async function deleteArchive(archiveReference) {

    let body = {
        "method":"axxonsoft.bl.config.ConfigurationService.ChangeConfig",
        "data":{
            "removed":[
                {
                "uid": archiveReference,
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

    if (request.ok && !response.failed.length) {
        createdUnits.archives = []; //clear array from deleted items
        console.log(`Archive (${archiveReference}) was successfully deleted!`);
    }else console.log(`Error: Archive (${archiveReference}) was not deleted. Code: ${request.status}, Failed: ${response.failed}`);
};


