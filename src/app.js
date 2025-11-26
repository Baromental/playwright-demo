require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { sendEmail } = require('./services/emailService');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/api/send-email', async (req, res) => {
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
    } catch (error) {
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

module.exports = app;