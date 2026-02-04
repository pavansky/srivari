import nodemailer from 'nodemailer';

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
        // Create a transporter using SMTP
        // For development/demo, we can use a mock or just log if no credentials
        // For production, these ENV variables must be set

        if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
            console.log(`[EMAIL MOCK] To: ${to} | Subject: ${subject}`);
            console.log(`[EMAIL BODY] ${html}`);
            return true; // Return true to simulate success in dev
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const info = await transporter.sendMail({
            from: `"Srivari Concierge" <${process.env.SMTP_USER}>`, // sender address
            to, // list of receivers
            subject, // Subject line
            html, // html body
        });

        console.log("Message sent: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("Failed to send email:", error);
        return false;
    }
}
