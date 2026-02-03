const fs = require('fs');

async function testbackend() {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';

    // Test 1: Text-to-Image
    console.log("Testing Text-to-Image...");
    const bodyText =
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="prompt"\r\n\r\n` +
        `Red saree flat lay\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="style"\r\n\r\n` +
        `Flat Lay\r\n` +
        `--${boundary}--\r\n`;

    try {
        const res = await fetch('http://localhost:3000/api/admin/ai-studio-generate', {
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`
            },
            body: bodyText
        });
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Request failed:", e);
    }
}

testbackend();
