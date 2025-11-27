import { chromium, Browser, BrowserContext, Page, FileChooser } from 'playwright';
import dotenv from 'dotenv';
import speakeasy from 'speakeasy';

dotenv.config();

export interface EmailOptions {
    to: string;
    subject: string;
    message: string;
    attachmentPath?: string;
}

interface EmailResult {
    success: boolean;
    message: string;
}

function get2FACode(secret: string | undefined): string {
    if (!secret) {
        throw new Error('GMAIL_CODE is not set in environment variables');
    }
    return speakeasy.totp({
        secret,
        encoding: "base32"
    });
}

export const sendEmail = async ({ 
    to, 
    subject, 
    message, 
    attachmentPath 
}: EmailOptions): Promise<EmailResult> => {
    if (!process.env.GMAIL_EMAIL || !process.env.GMAIL_PASSWORD || !process.env.GMAIL_CODE) {
        throw new Error('Missing required environment variables: GMAIL_EMAIL, GMAIL_PASSWORD, or GMAIL_CODE');
    }

    const browser: Browser = await chromium.launch({ 
        headless: false, 
        args: ['--disable-blink-features=AutomationControlled', '--disable-web-security'] 
    });
    const context: BrowserContext = await browser.newContext();
    const page: Page = await context.newPage();

    try {
        await page.goto('https://mail.google.com');

        await page.fill('input[type="email"]', process.env.GMAIL_EMAIL);
        await page.click('#identifierNext');
        
        await page.waitForSelector('input[type="password"]', { state: 'visible' });
        await page.fill('input[type="password"]', process.env.GMAIL_PASSWORD);
        await page.click('#passwordNext');

        const tryAnother = page.getByRole('button', { name: /try another way/i });
        if (await tryAnother.isVisible().catch(() => false)) {
            await tryAnother.click();
        }

        const backupButton = page.getByRole('button', { name: /backup codes/i });
        if (await backupButton.isVisible().catch(() => false)) {
            await backupButton.click();
        }

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
            const fileChooserPromise = page.waitForEvent('filechooser');
            await page.click('.a1.aaA.aMZ');
            const fileChooser = await fileChooserPromise;
            await fileChooser.setFiles(attachmentPath);
            await page.waitForTimeout(10000);
        }

        await page.click('div[role="button"].T-I.J-J5-Ji.aoO.T-I-atl.L3');
        await page.waitForSelector('.bAq', { state: 'visible', timeout: 10000 });

        return { 
            success: true, 
            message: 'Email sent successfully' 
        };
    } catch (error: any) {
        console.error('Error in sendEmail:', error);
        throw new Error(`Failed to send email: ${error.message}`);
    } finally {
        await browser.close();
    }
};

export default { sendEmail };
