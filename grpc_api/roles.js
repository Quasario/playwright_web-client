import {currentURL, createdUnits, alloyAllPermisions} from '../global_variables';
import { green, blue, yellow, red } from 'colors';

export async function createRole(currentRoleId, roleName='Role') {
    let body = {
        "method": "axxonsoft.bl.security.SecurityService.ChangeConfig",
        "data": {
            "added_roles": [
                {
                    "index": currentRoleId,
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
        createdUnits.roles.push(currentRoleId);
        console.log(`The role (${roleName}) was successfully created! UUID: ${currentRoleId}`.green);
    } else console.log(`Error: The role (${roleName}) was not created. Code: ${request.status}`.red);
}

export async function setRolePermissions(currentRoleId, permissions) {

    let body = {
        "method": "axxonsoft.bl.security.SecurityService.SetGlobalPermissions",
        "data": {
            "permissions": {
                [currentRoleId]: permissions || alloyAllPermisions
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
        console.log(`Permissions for role (${currentRoleId}) was successfully changed!`.green);
    } else console.log(`Error: could not set permissions for role (${currentRoleId}). Code: ${request.status}`.red);
}

export async function deleteRoles(rolesID) {

    let body =     {
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
        createdUnits.roles = createdUnits.roles.filter(i => !rolesID.includes(i)); //clear array from deleted items
        console.log(`Roles was successfully deleted!`.green);
    } else console.log(`Error: could not delete roles. Code: ${request.status}`.red);
};

