import { currentURL, alloyAllPermisions } from '../global_variables';
import { green, blue, yellow, red } from 'colors';
import { configurationCollector, getIdByRoleName } from "../utils/utils.js";
import { randomUUID } from 'node:crypto';


export async function getGroups() {
    let body = {
        "method": "axxonsoft.bl.groups.GroupManager.ListGroups",
        "data": {
            "view": "VIEW_MODE_DEFAULT"
        }
    };

    let request = await fetch(`${currentURL}/grpc`, {
        headers: {
            "Authorization": "Basic cm9vdDpyb290",
        },
        method: "POST",
        body: JSON.stringify(body)
    });
    
    let groupsList = await request.json();

    if (request.ok) {
        return groupsList.groups;
    } else console.log(`Error: could not pull groups list. Code: ${request.status}`.red);
};


export async function createGroup(groupName='Group', parentID="") {
    let groupId = randomUUID();

    let body = {
        "method": "axxonsoft.bl.groups.GroupManager.ChangeGroups",
        "data": {
            "added_groups": {
                "group_id": groupId,
                "name": groupName,
                "parent": parentID,
                "description": ""
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
        console.log(`The group (${groupName}) was successfully created! UUID: ${groupId}`.green);
    } else console.log(`Error: The group (${groupName}) was not created. Code: ${request.status}`.red);

    await configurationCollector("groups");
    return groupId;
};

export async function setGroup(currentGroupID, parentGroupID) {

    let body = {
        "method": "axxonsoft.bl.groups.GroupManager.ChangeGroups",
        "data": {
            "changed_groups_info": {
                "group_id": currentGroupID,
                "parent": parentGroupID
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
        console.log(`Group "${currentGroupID}" was assigned to parent "${parentGroupID}"!`.green);
    } else console.log(`Error: could not assigned "${currentGroupID}" to "${parentGroupID}". Code: ${request.status}`.red);
};

export async function deleteGroup(groupsID) {

    let body = {
        "method": "axxonsoft.bl.groups.GroupManager.ChangeGroups",
        "data": {
            "removed_groups": groupsID
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
        console.log(`Groups was successfully deleted!`.green);
    } else console.log(`Error: could not delete groups. Code: ${request.status}`.red);

    await configurationCollector("groups");
};

export async function addCameraToGroup(groupID, cameraID) {

    let body = {
        "method": "axxonsoft.bl.groups.GroupManager.SetObjectsMembership",
        "data": {
            "added_objects": {
                "group_id": groupID,
                "object": cameraID
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
        console.log(`Camera ${cameraID} was successfully added to group "${groupID}"!`.green);
    } else console.log(`Error: could not add ${cameraID} to group "${groupID}". Code: ${request.status}`.red);

};