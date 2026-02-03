const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const http = require('http');

async function verifyUpload() {
    // 1. Create a dummy file
    const dummyPath = 'test-upload.txt';
    fs.writeFileSync(dummyPath, 'Hello World Upload Test');

    // 2. Prepare form data
    const form = new FormData();
    form.append('file', fs.createReadStream(dummyPath));

    // 3. Send POST request
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/upload',
        method: 'POST',
        headers: form.getHeaders(),
    };

    console.log("Uploading file...");

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            console.log("Status:", res.statusCode);
            console.log("Response:", data);

            // Cleanup
            fs.unlinkSync(dummyPath);

            try {
                const json = JSON.parse(data);
                if (json.url && json.url.startsWith('/uploads/')) {
                    console.log("SUCCESS: URL returned correctly.");
                    // Verify file exists
                    const filename = json.url.replace('/uploads/', '');
                    const filePath = path.join(__dirname, 'public', 'uploads', filename);
                    if (fs.existsSync(filePath)) {
                        console.log("SUCCESS: File saved to disk.");
                        // Clean up uploaded file
                        fs.unlinkSync(filePath);
                    } else {
                        console.error("FAILURE: File not found on disk.");
                    }
                } else {
                    console.error("FAILURE: Invalid response URL.");
                }
            } catch (e) {
                console.error("FAILURE: Could not parse response.");
            }
        });
    });

    form.pipe(req);
}

verifyUpload();
