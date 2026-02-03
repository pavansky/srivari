export async function sendSMS(phone: string, message: string): Promise<boolean> {
    try {
        // cleanedPhone: Remove +91 or spaces, keep 10 digits
        const cleanedPhone = phone.replace(/\D/g, '').slice(-10);

        console.log(`[SMS PROVIDER] Sending to ${cleanedPhone}: ${message}`);

        // ------------------------------------------------------------------
        // OPTION 1: Fast2SMS (Free Tier available in India)
        // Sign up at fast2sms.com and get your API Key.
        // ------------------------------------------------------------------
        /*
        const API_KEY = process.env.FAST2SMS_API_KEY;
        if (API_KEY) {
            const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
                method: 'POST',
                headers: {
                    'authorization': API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    route: 'q', // 'q' for Quick SMS
                    message: message,
                    language: 'english',
                    flash: 0,
                    numbers: cleanedPhone,
                })
            });
            const data = await response.json();
            return data.return;
        }
        */

        // ------------------------------------------------------------------
        // OPTION 2: Twilio (Global)
        // ------------------------------------------------------------------
        /*
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const client = require('twilio')(accountSid, authToken);

        await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: `+91${cleanedPhone}`
        });
        return true;
        */

        // For now, since no API key is configured, we return true to allow the flow.
        // In a real deployment, you would return 'false' if the API call fails.
        return true;
    } catch (error) {
        console.error("Failed to send SMS:", error);
        return false;
    }
}
