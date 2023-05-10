import { currentURL, hostName } from '../global_variables';
// import { getHostName } from "../http_api/http_host";
export let currentPort = "80";
export let currentPrefix = "";
// let host;

// export async function getHostName() {
//     let request = await fetch(`${currentURL}/hosts`, {
//         headers: {
//             "Authorization": "Basic cm9vdDpyb290",
//         }
//     });

//     let hosts = await request.json();
//     return hosts[0];
// };

export async function getServerConfig(port, prefix) {
    host = await getHostName();
    let body = {
        "method": "axxonsoft.bl.config.ConfigurationService.ListUnits",
        "data": {
            "unit_uids": [
                `hosts/${hostName}/HttpServer.0`
            ]
        }
    };

    let request = await fetch(`${currentURL}:${currentPort}${currentPrefix}/grpc`, {
        headers: {
            "Authorization": "Basic cm9vdDpyb290",
        },
        method: "POST",
        body: JSON.stringify(body)
    });

    if (request.ok) {
        console.log(`Server information has been provided.`);
    } else console.log(`Error: Server information hasn't been provided.`);
};


export async function setServerConfig(port, prefix) {
    // let host = await getHostName();
    let body = {
        "method": "axxonsoft.bl.config.ConfigurationService.ChangeConfig",
        "data": {
            "changed": [
                {
                    "uid": `hosts/${hostName}/HttpServer.0`,
                    "type": "HttpServer",
                    "properties": [
                        {
                            "id": "Port",
                            "value_string": port,
                        },
                        {
                            "id": "Prefix",
                            "value_string": prefix,
                        }
                    ]
                }
            ]
        }
    };

    let request = await fetch(`${currentURL}:${currentPort}${currentPrefix}/grpc`, {
        headers: {
            "Authorization": "Basic cm9vdDpyb290",
        },
        method: "POST",
        body: JSON.stringify(body)
    });

    currentPrefix = prefix;
    currentPort = port;
    console.log(currentPort, currentPrefix);
    console.log(`Attempt server configuration change`);

    // if (request.ok) {
    //     console.log(`Server configuration has changed`);
    // } else console.log(`Error: coudn't change server confgig (но это не точно)`);
};