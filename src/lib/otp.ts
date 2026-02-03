// In-memory store for OTPs (For demonstration). 
// In production, use Redis or a Database.
const otpStore: Record<string, { code: string; expiresAt: number }> = {};

export function generateOTP(phone: string): string {
    // Generate secure 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store with 5-minute expiration
    const expiresAt = Date.now() + 5 * 60 * 1000;
    otpStore[phone] = { code, expiresAt };

    return code;
}

export function verifyOTP(phone: string, code: string): boolean {
    const record = otpStore[phone];

    if (!record) return false;

    // Check expiration
    if (Date.now() > record.expiresAt) {
        delete otpStore[phone];
        return false;
    }

    // Check code match
    if (record.code === code) {
        delete otpStore[phone]; // Consume OTP (One-time use)
        return true;
    }

    return false;
}

export function getStoredOTP(phone: string): string | null {
    // Helper for debugging/dev
    const record = otpStore[phone];
    if (record && Date.now() <= record.expiresAt) {
        return record.code;
    }
    return null;
}
