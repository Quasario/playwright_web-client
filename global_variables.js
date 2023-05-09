// export let variables = {
//     currentURL: "http://127.0.0.1",
// };

export let currentURL = "http://192.168.0.24";
export let videoFolder = 'C:';
export let archiveDirection = 'C:/arch';
export let createdUnits = {
    cameras: [],
    roles: [],
    users: [],
    archives: []
}
// export let forbidAllPermissions = {
//     "unrestricted_access": "UNRESTRICTED_ACCESS_NO",
//     "maps_access": "MAP_ACCESS_FORBID",
//     "feature_access": [
//         "FEATURE_ACCESS_FORBID_ALL"
//     ],
//     "alert_access": "ALERT_ACCESS_FORBID",
//     "bookmark_access": "BOOKMARK_ACCESS_NO",
//     "user_rights_setup_access": "USER_RIGHTS_SETUP_ACCESS_NO",
//     "default_camera_access": "CAMERA_ACCESS_FORBID",
//     "default_microphone_access": "MICROPHONE_ACCESS_FORBID",
//     "default_telemetry_priority": "TELEMETRY_PRIORITY_NO_ACCESS",
//     "default_archive_access": "ARCHIVE_ACCESS_FORBID",
//     "default_acfa_access": "ACFA_ACCESS_FORBID",
//     "default_videowall_access": "VIDEOWALL_ACCESS_FORBID",
//     "default_macros_access": "MACROS_ACCESS_FORBID"
// };
export let alloyAllPermisions = {
    "unrestricted_access": "UNRESTRICTED_ACCESS_NO",                     //[UNRESTRICTED_ACCESS_NO, UNRESTRICTED_ACCESS_YES]
    "maps_access": "MAP_ACCESS_FULL",                                    //[MAP_ACCESS_FORBID, MAP_ACCESS_VIEW_ONLY, MAP_ACCESS_VIEW_SCALE, MAP_ACCESS_FULL]
    "alert_access": "ALERT_ACCESS_FULL",                                 //[ALERT_ACCESS_FORBID, ALERT_ACCESS_VIEW_ONLY, ALERT_ACCESS_FULL]
    "bookmark_access": "BOOKMARK_ACCESS_CREATE_PROTECT_EDIT_DELETE",     //[BOOKMARK_ACCESS_NO, BOOKMARK_ACCESS_CREATE, BOOKMARK_ACCESS_CREATE_PROTECT, BOOKMARK_ACCESS_CREATE_PROTECT_EDIT_DELETE]
    "user_rights_setup_access": "USER_RIGHTS_SETUP_ACCESS_ALL",          //[USER_RIGHTS_SETUP_ACCESS_NO, USER_RIGHTS_SETUP_ACCESS_DEVICES_RIGHTS_ONLY, USER_RIGHTS_SETUP_ACCESS_ALL]
    "default_camera_access": "CAMERA_ACCESS_FULL",                       //[CAMERA_ACCESS_FORBID, CAMERA_ACCESS_ONLY_ARCHIVE, CAMERA_ACCESS_MONITORING_ON_PROTECTION, CAMERA_ACCESS_MONITORING, CAMERA_ACCESS_ARCHIVE, CAMERA_ACCESS_MONITORING_ARCHIVE_MANAGE, CAMERA_ACCESS_FULL]
    "default_microphone_access": "MICROPHONE_ACCESS_FULL",               //[MICROPHONE_ACCESS_FORBID, MICROPHONE_ACCESS_MONITORING, MICROPHONE_ACCESS_FULL]
    "default_telemetry_priority": "TELEMETRY_PRIORITY_HIGHEST",          //[TELEMETRY_PRIORITY_NO_ACCESS, TELEMETRY_PRIORITY_LOWEST, TELEMETRY_PRIORITY_LOW, TELEMETRY_PRIORITY_NORMAL, TELEMETRY_PRIORITY_HIGH, TELEMETRY_PRIORITY_HIGHEST]
    "default_archive_access": "ARCHIVE_ACCESS_FULL",                     //[ARCHIVE_ACCESS_FORBID, ARCHIVE_ACCESS_FULL]
    "default_videowall_access": "VIDEOWALL_ACCESS_FULL",                 //[VIDEOWALL_ACCESS_FORBID, VIDEOWALL_ACCESS_FULL]
    "archive_view_restrictions": {
        "depth_hours": "0"
    },
    "default_macros_access": "MACROS_ACCESS_FULL",                       //[MACROS_ACCESS_FORBID, MACROS_ACCESS_FULL]
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
// export let hostName = await getHostName();


// async function getHostName() {
//     let request = await fetch(`http://192.168.0.24/hosts`, {
//         headers: {
//             "Authorization": "Basic cm9vdDpyb290",
//         }
//     });

//     let hosts = await request.json();
//     return hosts[0];
// }
