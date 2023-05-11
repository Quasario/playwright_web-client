import { readFileSync, writeFileSync } from 'node:fs';

export function exchangeIndexCredentials(username, password) {
    let file = readFileSync("C:/Program Files/AxxonSoft/AxxonNext/public_html/0/index.html", 'utf8');
    let exchangeLogin = file.replace(/window.login = '\w*';/, `window.login = '${username}';`);
    let exchangePassword = exchangeLogin.replace(/window.pass = '\w*';/, `window.pass = '${password}';`);
    writeFileSync("C:/Program Files/AxxonSoft/AxxonNext/public_html/0/index.html", exchangePassword, 'utf8');
    console.log("index.html was changed");
}

// exchangeIndexCredentials("", "");