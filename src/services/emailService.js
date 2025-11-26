const { chromium } = require('playwright');
require('dotenv').config();
const speakeasy = require("speakeasy");

function get2FACode(secret) {
  return speakeasy.totp({
    secret,
    encoding: "base32"
  });
}

async function clickIfVisible(locator) {
    if (await locator.isVisible().catch(() => false)) {
        await locator.click();
    }
}


const sendEmail = async ({ to, subject, message, attachmentPath }) => {

    const browser = await chromium.launch({ 
        headless: false, 
        args: ['--disable-blink-features=AutomationControlled', '--disable-web-security'] 
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        await page.goto('https://mail.google.com');

        await page.fill('input[type="email"]', process.env.GMAIL_EMAIL);
        await page.click('#identifierNext');
        
        await page.waitForSelector('input[type="password"]', { state: 'visible' });
        await page.fill('input[type="password"]', process.env.GMAIL_PASSWORD);
        await page.click('#passwordNext');

        // --- Try Another Way ---
const selectorTryAnother = '#yDmH0d > c-wiz > main > div.JYXaTc.lUWEgd > div.O1Slxf > div.FO2vFd > div > div > button > span';
await clickIfVisible(page.locator(selectorTryAnother));

// if (await page.waitForSelector(selectorTryAnother)) {
//     if (await page.isVisible(selectorTryAnother)) {
//         await page.click(selectorTryAnother);
//     }
// }

// --- Backup Codes ---
const selectorBackupCodes = '#yDmH0d > c-wiz > main > div.UXFQgc > div > div > div > form > span > section:nth-child(2) > div > div > section > div > div > div > ul > li:nth-child(2) > div';

// if (await page.waitForSelector(selectorBackupCodes)) {
//     if (await page.isVisible(selectorBackupCodes)) {
//         await page.click(selectorBackupCodes);
//     }
// }
await clickIfVisible(page.locator(selectorBackupCodes));


        const selectorBackupCodesInput = '#totpPin';
        const code2FA = get2FACode(process.env.GMAIL_CODE);
        await page.fill(selectorBackupCodesInput, code2FA);
        await page.click('#totpNext > div > button > div.VfPpkd-RLmnJb');
    
        await page.waitForSelector('.T-I.T-I-KE.L3', { timeout: 10000 });
        await page.click('.T-I.T-I-KE.L3');

        await page.waitForSelector('input[role="combobox"][aria-haspopup="listbox"]');
        await page.fill('input[role="combobox"][aria-haspopup="listbox"]', to);
        
        await page.keyboard.press('Tab');
        await page.keyboard.type(subject);
        
        await page.keyboard.press('Tab');
        await page.keyboard.type(message);

        if (attachmentPath) {
            const [fileChooser] = await Promise.all([
                page.waitForEvent('filechooser'),
                page.click('.a1.aaA.aMZ')
            ]);
            await fileChooser.setFiles(attachmentPath);
            await page.waitForTimeout(10000);
        }

        await page.click('div[role="button"].T-I.J-J5-Ji.aoO.T-I-atl.L3');
        
        await page.waitForSelector('.bAq', { state: 'visible', timeout: 10000 });

        return { success: true, message: 'Email sent successfully' };
    } catch (error) {
        console.error('Error in sendEmail:', error);
        throw new Error(`Failed to send email: ${error.message}`);
    } finally {
        await browser.close();
    }
};

module.exports = { sendEmail };
