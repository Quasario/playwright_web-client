import { currentURL, hostName } from '../global_variables';
import { green, blue, yellow, red } from 'colors';

export let currentPort = "80";
export let currentPrefix = "";

export async function getServerConfig() {
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
        console.log(`Server information has been provided.`.green);
    } else console.log(`Error: Server information hasn't been provided.`.red);
};


export async function setServerConfig(port: string, prefix: string) {

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
    console.log(`Attempt server configuration change`.yellow);
};