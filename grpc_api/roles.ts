import { currentURL, alloyAllPermisions } from '../global_variables';
import { green, blue, yellow, red } from 'colors';
import { configurationCollector, getIdByRoleName } from "../utils/utils.js";
import { randomUUID } from 'node:crypto';


export async function getRolesAndUsers() {
    let body = {
        "method":"axxonsoft.bl.security.SecurityService.ListConfig",
        "data": {
        }
    };

    let request = await fetch(`${currentURL}/grpc`, {
        headers: {
            "Authorization": "Basic cm9vdDpyb290",
        },
        method: "POST",
        body: JSON.stringify(body)
    });
    
    let usersRolesList = await request.json();

    if (request.ok) {
        return usersRolesList;
    } else console.log(`Error: could not pull roles & users list. Code: ${request.status}`.red);
};


export async function createRole(roleName = 'Role') {
    let roleId = randomUUID();

    let body = {
        "method": "axxonsoft.bl.security.SecurityService.ChangeConfig",
        "data": {
            "added_roles": [
                {
                    "index": roleId,
                    "name": roleName,
                    "comment": "",
                    "timezone_id": "",
                    "supervisor": ""
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
    
    if (request.ok) {
        console.log(`The role "${roleName}" was successfully created! UUID: ${roleId}`.green);
    } else console.log(`Error: The role "${roleName}" was not created. Code: ${request.status}`.red);

    await configurationCollector("roles");
};

export async function setRolePermissions(roleName: string, permissions?: object) {

    let body = {
        "method": "axxonsoft.bl.security.SecurityService.SetGlobalPermissions",
        "data": {
            "permissions": {
                [getIdByRoleName(roleName)]: permissions || alloyAllPermisions
            }
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
        console.log(`Permissions for role "${roleName}" was successfully changed!`.green);
    } else console.log(`Error: could not set permissions for role "${roleName}". Code: ${request.status}`.red);
};


export async function setObjectPermissions(roleName: string, cameraIDs: string[], accessLevel: "CAMERA_ACCESS_FORBID" | "CAMERA_ACCESS_ONLY_ARCHIVE" | "CAMERA_ACCESS_MONITORING_ON_PROTECTION" | "CAMERA_ACCESS_MONITORING" | "CAMERA_ACCESS_ARCHIVE" | "CAMERA_ACCESS_MONITORING_ARCHIVE_MANAGE" | "CAMERA_ACCESS_FULL" = "CAMERA_ACCESS_FULL") {
    let camerasObj: object = {};

    for (let cameraID of cameraIDs){
        camerasObj[cameraID] = accessLevel;
    }

    let body = {
        "method": "axxonsoft.bl.security.SecurityService.SetObjectPermissions",
        "data": {
            "role_id": getIdByRoleName(roleName),
            "permissions": {
                "camera_access": camerasObj,
                // "microphone_access": {
                //     "hosts/Server1/DeviceIpint.10/SourceEndpoint.audio:0": "MICROPHONE_ACCESS_MONITORING"
                // },
                // "telemetry_priority": {
                //     "hosts/Server1/DeviceIpint.10/TelemetryControl.0": "TELEMETRY_PRIORITY_LOW"
                // },
                // "archive_access": {
                //     "hosts/Server1/MultimediaStorage.AliceBlue/MultimediaStorage": "ARCHIVE_ACCESS_FULL"
                // },
                // "videowall_access": {}
            }
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
        console.log(`Cameras ${cameraIDs.toString()} for role "${roleName}" was assigned access ${accessLevel}!`.green);
    } else console.log(`Error: could not assigned object permissions to role. Code: ${request.status}`.red);

};


export async function deleteRoles(rolesID: string[]) {

    let body = {
            "method": "axxonsoft.bl.security.SecurityService.ChangeConfig",
            "data": {
                "removed_roles": rolesID
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
        console.log(`Roles was successfully deleted!`.green);
    } else console.log(`Error: could not delete roles. Code: ${request.status}`.red);

    await configurationCollector("roles");
};

