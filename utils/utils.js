
export async function isCameraListOpen(page) {
    await page.waitForTimeout(500); //list close animation timeout
    let isVisible = await page.locator('.camera-list [type="checkbox"]').last().isVisible(); //favorite button is visible
    return isVisible;
}