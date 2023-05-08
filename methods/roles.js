import {currentURL} from '../global_variables';

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


