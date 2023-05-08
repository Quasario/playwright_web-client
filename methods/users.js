import {currentURL} from '../global_variables';

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
        console.log(`The user(${userName}) was successfully created!`);
    }else console.log(`Error: The user(${userName}) was not created. Code: ${request.status}`);
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
        console.log(`Password was successfully set!`);
    }else console.log(`Error: could not set user password. Code: ${request.status}`);
    
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
        console.log(`The role was successfully assigned to user!`);
    }else console.log(`Error: The role was not assined to user. Code: ${request.status}`);
    
}


