import dotenv from 'dotenv';
import express, { Request, Response, NextFunction, Application } from 'express';
import bodyParser from 'body-parser';
import emailService from './services/emailService';

const { sendEmail } = emailService;

dotenv.config();

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

app.use(bodyParser.json());

interface EmailRequest extends Request {
    body: {
        to: string;
        subject: string;
        message: string;
        attachmentPath?: string;
    };
}

interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}

app.post('/api/send-email', async (req: EmailRequest, res: Response<ApiResponse>, next: NextFunction) => {
    try {
        const { to, subject, message, attachmentPath } = req.body;
        
        if (!to || !subject || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields: to, subject, and message are required' 
            });
        }

        const result = await sendEmail({
            to,
            subject,
            message,
            attachmentPath
        });

        res.json({ 
            success: true, 
            message: 'Email sent successfully',
            data: result
        });
    } catch (error: any) {
        console.error('Error sending email:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to send email',
            error: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
