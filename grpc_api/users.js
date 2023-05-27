import { currentURL } from '../global_variables';
import { green, blue, yellow, red } from 'colors';
import { configurationCollector, getIdByUserName, getIdByRoleName } from "../utils/utils.js";
import { randomUUID } from 'node:crypto';

export async function createUser(userName='User') {
    let userId = randomUUID();

    let body = {
        "method": "axxonsoft.bl.security.SecurityService.ChangeConfig",
        "data": {
            "added_users": [
                {
                    "login": userName,
                    "index": userId,
                    "enabled": true,
                    "restrictions": {
                        "web_count": 2147483647,
                        "mobile_count": 2147483647
                    }
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
        console.log(`The user (${userName}) was successfully created! UUID: ${userId}`.green);
    } else console.log(`Error: The user(${userName}) was not created. Code: ${request.status}`.red);

    await configurationCollector("users");
}

export async function setUserPassword(userName, password="123") {

    let body = {
        "method": "axxonsoft.bl.security.SecurityService.ChangeConfig",
        "data": {
            "modified_user_passwords": [
                {
                    "user_index": getIdByUserName(userName),
                    "password": password,
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
        console.log(`Password for user "${userName}" was successfully set!`.green);
    } else console.log(`Error: could not set user password "${userName}". Code: ${request.status}`.red);
    
}

export async function assignUserRole(roleName, userName) {
    let body = {
        "method": "axxonsoft.bl.security.SecurityService.ChangeConfig",
        "data": {
            "added_users_assignments": [
                {
                    "user_id": getIdByUserName(userName),
                    "role_id": getIdByRoleName(roleName)
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
        console.log(`The role "${roleName}" was successfully assigned to user "${userName}"!`.green);
    } else console.log(`Error: The role "${roleName}" was not assined to user "${userName}". Code: ${request.status}`.red);
    
}

export async function deleteUsers(usersID) {

    let body = {
            "method": "axxonsoft.bl.security.SecurityService.ChangeConfig",
            "data": {
                "removed_users": usersID
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
        console.log(`Users was successfully deleted!`.green);
    } else console.log(`Error: could not delete users. Code: ${request.status}`.red);

    await configurationCollector("users");
};

