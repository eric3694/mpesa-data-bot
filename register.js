const axios = require('axios');

// Pre-filled credentials from your Daraja Portal screenshot
const consumerKey = "36xrdWvl8ha4j4tsCIWKdMTLysT0I89IHdGqGTfdtrCLMrwM";
const consumerSecret = "00OAyGAxGJjnpqbyrNUd3nBVGUhlb2QNdv3AFrGJb7C6MCpxbvQsEAWtArWpo1GK";
const shortCode = "174379";

// Your live Render server URL
const confirmationUrl = "https://mpesa-data-bot.onrender.com/api/mpesa-confirmation";
const validationUrl = "https://mpesa-data-bot.onrender.com/api/mpesa-confirmation";

async function registerUrls() {
    // Encode credentials to Base64
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    try {
        console.log("1. Requesting access token from Safaricom...");
        const tokenRes = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
            headers: { Authorization: `Basic ${auth}` }
        });

        const accessToken = tokenRes.data.access_token;
        console.log("-> Access Token received successfully!");

        console.log("2. Registering Webhook URL with Safaricom...");
        const payload = {
            ShortCode: shortCode,
            ResponseType: "Completed",
            ConfirmationURL: confirmationUrl,
            ValidationURL: validationUrl
        };

        const regRes = await axios.post('https://sandbox.safaricom.co.ke/mpesa/c2b/v1/registerurl', payload, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log("\n✅ SUCCESS! Safaricom Response:", regRes.data);
    } catch (error) {
        console.error("\n❌ Registration Failed:", error.response ? error.response.data : error.message);
    }
}

registerUrls();