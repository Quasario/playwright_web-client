import { currentURL } from '../global_variables';
import { green, blue, yellow, red } from 'colors';
import { configurationCollector } from "../utils/utils.js";

export async function createUser(currentUserId, userName='User') {
    let body = {
        "method": "axxonsoft.bl.security.SecurityService.ChangeConfig",
        "data": {
            "added_users": [
                {
                    "login": userName,
                    "index": currentUserId,
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
        console.log(`The user (${userName}) was successfully created! UUID: ${currentUserId}`.green);
    } else console.log(`Error: The user(${userName}) was not created. Code: ${request.status}`.red);

    await configurationCollector("users");
}

export async function setUserPassword(currentUserId, password="123") {
    let body = {
        "method": "axxonsoft.bl.security.SecurityService.ChangeConfig",
        "data": {
            "modified_user_passwords": [
                {
                    "user_index": currentUserId,
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
        console.log(`Password for user (${currentUserId}) was successfully set!`.green);
    } else console.log(`Error: could not set user password (${currentUserId}). Code: ${request.status}`.red);
    
}

export async function assingUserRole(currentRoleId, currentUserId) {
    let body = {
        "method": "axxonsoft.bl.security.SecurityService.ChangeConfig",
        "data": {
            "added_users_assignments": [
                {
                    "user_id": currentUserId,
                    "role_id": currentRoleId
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
        console.log(`The role (${currentRoleId}) was successfully assigned to user (${currentUserId})!`.green);
    } else console.log(`Error: The role (${currentRoleId}) was not assined to user (${currentUserId}). Code: ${request.status}`.red);
    
}

export async function deleteUsers(usersID) {

    let body =     {
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

