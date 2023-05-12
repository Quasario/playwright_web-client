// import { test, expect } from '@playwright/test';
// import {currentURL} from '../global_variables';
// import {getCameraList} from '../grpc_methods';

// // test("Authorization in WebUI", async ({page}) => {

// //     await page.goto("http://127.0.0.1");
// //     await expect(page).toHaveTitle("Axxon Next client");
// // })

// // test('has title', async ({ page }) => {
// //     await page.goto('https://playwright.dev/');
  
// //     // Expect a title "to contain" a substring.
// //     await expect(page).toHaveTitle(/Playwright/);
// //   });



// test('test', async ({ page }) => {
//   await page.goto(currentURL);
//   await page.getByLabel('Login').click();
//   await page.getByLabel('Login').fill('root');
//   await page.getByLabel('Login').press('Tab');
//   await page.getByLabel('Password').fill('root');
//   await page.getByRole('button', { name: 'Log in' }).click();
//   await page.click("id=at-app-mode-search");
//   await page.pause();
//   getCameraList();
//   await page.click("id=at-app-mode-live");
//   await page.pause();
//   await page.locator("text=hardware").click();
//   await page.pause();
// });

let camerEndp = [
'hosts/DESKTOP-0OFNEM9/DeviceIpint.1/SourceEndpoint.video:0:0',
'hosts/DESKTOP-0OFNEM9/DeviceIpint.2/SourceEndpoint.video:0:0',
'hosts/DESKTOP-0OFNEM9/DeviceIpint.3/SourceEndpoint.video:0:0',
'hosts/DESKTOP-0OFNEM9/DeviceIpint.4/SourceEndpoint.video:0:0',
'hosts/DESKTOP-0OFNEM9/DeviceIpint.5/SourceEndpoint.video:0:0',
'hosts/DESKTOP-0OFNEM9/DeviceIpint.5/SourceEndpoint.video:1:0',
'hosts/DESKTOP-0OFNEM9/DeviceIpint.5/SourceEndpoint.video:2:0',
'hosts/DESKTOP-0OFNEM9/DeviceIpint.5/SourceEndpoint.video:3:0',
'hosts/DESKTOP-0OFNEM9/DeviceIpint.5/SourceEndpoint.video:4:0'
];

function createLayout(camerasEndpoints, width=2, height=2, layoutName="New Layout") {

  let cellMatrix = Array();
  let index = 0;
  for (let i = 0; i < height; i++) {
      let arr = Array();
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
              "camera_ap": camerasEndpoints[index], //.cameraBinding,
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
    //   cellMatrix.push(arr);
  }
  console.log(cellMatrix);


  let cellsObject = Object();
  for (let cell of cellMatrix) {
      cellsObject[cell.position] = cell;
  };
  console.log(cellsObject);
}

createLayout(camerEndp, 3, 3,);