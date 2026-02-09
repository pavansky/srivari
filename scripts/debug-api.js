
async function checkApi() {
    try {
        console.log("Fetching /api/products...");
        const res = await fetch('http://localhost:3000/api/products');
        console.log(`Status: ${res.status} ${res.statusText}`);
        const text = await res.text();
        console.log("Response:", text);
    } catch (e) {
        console.error("Fetch Error:", e);
    }
}

checkApi();
