import { currentURL, videoFolder, hostName } from '../global_variables';
import { green, blue, yellow, red } from 'colors';
import { randomUUID } from 'node:crypto';
import { configurationCollector } from "../utils/utils.js";


export async function createLayout(camerasEndpoints: { [key: string]: any, "accessPoint": string }[], width = 2, height = 2, layoutName = "New Layout") {
    let cellMatrix: { [key: string]: any }[] = [];
    let index = 0;
    for (let i = 0; i < height; i++) {

        for (let j=0; j < width; j++) {
  
            let left = j - 1;
            left >= 0 ? left = left + i * width : left = -1;
  
            let right = j + 1;
            right < width ? right = right + i * width : right = -1;
  
            let top = j - width + i * width;
            top >= 0 ? top : top = -1;
  
            let bottom = j + width + i * width;
            bottom < width * height ? bottom : bottom = -1;
  
            let obj = {
                "position": index,
                "dimensions": {
                    "width": 1 / width,
                    "height": 1 / height
                },
                "left_sibling_position": left,
                "top_sibling_position": top,
                "right_sibling_position": right,
                "bottom_sibling_position": bottom,
                "camera_ap": camerasEndpoints[index].accessPoint,
                "video_parameters": {
                    "microphone": "",
                    "audio_volume": 0,
                    "show_tracking": false,
                    "auto_tracking": false,
                    "auto_fit": false,
                    "video_filter": "EVideoFilterType_UNSPECIFIED",
                    "rotate_angle": 0,
                    "show_text_source_flags": {},
                    "stream_resolution": "CAMERA_STREAM_RESOLUTION_AUTO",
                    "default_zoom_info": {
                        "is_panomorph_on": false,
                        "panomorph_position": "PANOMORPH_CAMERAPOSITION_WALL",
                        "zoom_parameters": {
                            "zoom_point": {
                                "x": 0.5,
                                "y": 0.5
                            },
                            "zoom_value": 1
                        }
                    },
                    "equipment_info": {
                        "relays_position": {
                            "visible": false,
                            "positions": {
                                "component_ap": "",
                                "position": {}
                            }
                        },
                        "sensors_position": {}
                    },
                    "should_connect_to_archive": false
                }
            };
            index++;
            cellMatrix.push(obj);
        }

    }
  
    let cellsObject = Object();
    for (let cell of cellMatrix) {
        cellsObject[cell.position] = cell;
    };

    let layoutUUID = randomUUID();
    let body = {
        "method": "axxonsoft.bl.layout.LayoutManager.Update",
        "data": {
            "created": [
                {
                    "alarm_mode": false,
                    "cells": cellsObject,
                    "display_name": layoutName,
                    "id": layoutUUID,
                    "is_for_alarm": false,
                    "is_user_defined": true,
                    "map_view_mode": "MAP_VIEW_MODE_LAYOUT_ONLY"
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

    let response = await request.json();

    if (request.ok && !response.failed?.length) {
        console.log(`Layout "${layoutName}" (${width}x${height}) was successfully created! UUID: ${layoutUUID}`.green);
    } else console.log(`Error: Layout "${layoutName}" (${width}x${height}) was not created. Code: ${request.status}, Failed: ${response.failed}`.red);
    
    await configurationCollector("layouts");
    return layoutUUID;
};


export async function deleteLayouts(layoutsID: string[]) {

    let body = {
        "method": "axxonsoft.bl.layout.LayoutManager.Update",
        "data": {
            "removed": layoutsID
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
        console.log(`Layots ${layoutsID.toString()} was successfully deleted!`.green);
    } else console.log(`Error: could not delete layouts ${layoutsID.toString()}. Code: ${request.status}`.red);

    await configurationCollector("layouts");
};
