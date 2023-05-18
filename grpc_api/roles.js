import { currentURL, alloyAllPermisions } from '../global_variables';
import { green, blue, yellow, red } from 'colors';
import { configurationCollector } from "../utils/utils.js";


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
        
        console.log(`The role (${roleName}) was successfully created! UUID: ${currentRoleId}`.green);
    } else console.log(`Error: The role (${roleName}) was not created. Code: ${request.status}`.red);

    await configurationCollector("roles");
};

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
};

export async function deleteRoles(rolesID) {

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

