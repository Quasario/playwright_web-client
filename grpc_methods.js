import {currentURL, archiveDirection} from './global_variables';

export async function getCameraList() {
    let promice = await fetch(`${currentURL}/camera/list`, {
        headers: {
            "Authorization": "Basic cm9vdDpyb290",
        }
    });
    
    let hostsEndpoint;
    
    if (promice.ok) {
        hostsEndpoint = await promice.json();
    }
    
    console.log(hostsEndpoint);
}


export async function getHostName() {
    let request = await fetch(`${currentURL}/hosts`, {
        headers: {
            "Authorization": "Basic cm9vdDpyb290",
        }
    });

    let hosts = await request.json();
    return hosts[0];
}


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
        console.log(`The role(${roleName}) was successfully created!`);
    }else console.log(`Error: The role(${roleName}) was not created. Code: ${request.status}`);
}

export async function setRolePermissions(currentRoleId) {
    let body = {
        "method": "axxonsoft.bl.security.SecurityService.SetGlobalPermissions",
        "data": {
            "permissions": {
                [currentRoleId]: {
                    "unrestricted_access": "UNRESTRICTED_ACCESS_NO",
                    "maps_access": "MAP_ACCESS_FORBID",
                    "alert_access": "ALERT_ACCESS_FORBID",
                    "bookmark_access": "BOOKMARK_ACCESS_NO",
                    "user_rights_setup_access": "USER_RIGHTS_SETUP_ACCESS_NO",
                    "default_camera_access": "CAMERA_ACCESS_FULL",
                    "default_microphone_access": "MICROPHONE_ACCESS_FORBID",
                    "default_telemetry_priority": "TELEMETRY_PRIORITY_NO_ACCESS",
                    "default_archive_access": "ARCHIVE_ACCESS_FORBID",
                    "default_acfa_access": "ACFA_ACCESS_FORBID",
                    "default_videowall_access": "VIDEOWALL_ACCESS_FORBID",
                    "archive_view_restrictions": {
                        "depth_hours": "0"
                    },
                    "default_macros_access": "MACROS_ACCESS_FORBID",
                    "feature_access": [
                        "FEATURE_ACCESS_DEVICES_SETUP",
                        "FEATURE_ACCESS_ARCHIVES_SETUP",
                        "FEATURE_ACCESS_DETECTORS_SETUP",
                        "FEATURE_ACCESS_SETTINGS_SETUP",
                        "FEATURE_ACCESS_PROGRAMMING_SETUP",
                        "FEATURE_ACCESS_REALTIME_RECOGNITION_SETUP",
                        "FEATURE_ACCESS_WEB_UI_LOGIN",
                        "FEATURE_ACCESS_CHANGING_LAYOUTS",
                        "FEATURE_ACCESS_EXPORT",
                        "FEATURE_ACCESS_LAYOUTS_TAB",
                        "FEATURE_ACCESS_MINMAX_BUTTON_ALLOWED",
                        "FEATURE_ACCESS_SYSTEM_JOURNAL",
                        "FEATURE_ACCESS_DOMAIN_MANAGING_OPS",
                        "FEATURE_ACCESS_ADD_CAMERA_TO_LAYOUT_IN_MONITORING",
                        "FEATURE_ACCESS_SEARCH",
                        "FEATURE_ACCESS_EDIT_PTZ_PRESETS",
                        "FEATURE_ACCESS_ALLOW_BUTTON_MENU_CAMERA",
                        "FEATURE_ACCESS_ALLOW_SHOW_TITLES",
                        "FEATURE_ACCESS_SHOW_ERROR_MESSAGES",
                        "FEATURE_ACCESS_ALLOW_DELETE_RECORDS",
                        "FEATURE_ACCESS_ALLOW_SHOW_PRIVACY_VIDEO_IN_ARCHIVE",
                        "FEATURE_ACCESS_ALLOW_SHOW_FACES_IN_LIVE",
                        "FEATURE_ACCESS_ALLOW_UNPROTECTED_EXPORT",
                        "FEATURE_ACCESS_IS_GUARD_ROLE",
                        "FEATURE_ACCESS_GROUP_PANEL",
                        "FEATURE_ACCESS_OBJECT_PANEL_AND_CAMERA_SEARCH_PANEL",
                        "FEATURE_ACCESS_CONFIDENTIAL_BOOKMARKS"
                    ]
                }
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
        console.log(`Permissions was successfully changed!`);
    }else console.log(`Error: could not set permissions. Code: ${request.status}`);
}


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
        console.log(`The user was successfully assigned to role!`);
    }else console.log(`Error: The user was not assined to role. Code: ${request.status}`);
    
}


export async function createArchive(archiveName='White') {
    let hostName = await getHostName();

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

    if (request.ok) {
        console.log(`Archive(${archiveName}) was successfully created!`);
    }else console.log(`Error: Archive was not created. Code: ${request.status}`);
    
}

export async function createArchiveVolume(archiveName='White', fileSize=10) {
    let hostName = await getHostName();

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

    if (request.ok) {
        console.log(`Archive volume with size: ${fileSize} was successfully created in direction ${archiveDirection}!`);
    }else console.log(`Error: Archive volume was not created. Code: ${request.status}`);
    
}