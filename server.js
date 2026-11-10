const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- PRODUCTION CONFIGURATION ---
const AT_API_KEY = "atsk_1e562f1f012b092a50fce0e84a2c895ed1f9f8c9ce14e71b8417639bfdf4de55d66faa28"; // Your Africa's Talking Key
const AT_USERNAME = "sandbox"; // Replace with your live Africa's Talking Username when ready

// --- YOUR TILL MENU PACKAGES (From Poster) ---
const PACKAGE_MAP = {
    // SMS Deals
    5: { amount: 5, type: 'AIRTIME', label: '20 SMS (24hrs)' },
    10: { amount: 10, type: 'AIRTIME', label: '200 SMS (24hrs)' },
    30: { amount: 30, type: 'AIRTIME', label: '1000 SMS (7 days)' },
    101: { amount: 101, type: 'AIRTIME', label: '1500 SMS (Monthly)' },

    // Minutes Packages
    21: { amount: 21, type: 'AIRTIME', label: '350 Flex 2hrs' },
    51: { amount: 51, type: 'AIRTIME', label: '50 Mins till midnight' },
    100: { amount: 100, type: 'AIRTIME', label: '100 Mins till midnight' },
    250: { amount: 250, type: 'AIRTIME', label: '200 Mins weekly' },
    500: { amount: 500, type: 'AIRTIME', label: '300 Mins monthly' },
    1000: { amount: 1000, type: 'AIRTIME', label: '800 Mins monthly' },

    // Data & Internet Packages
    20: { amount: 20, type: 'AIRTIME', label: '250MB (24 Hours)' },
    23: { amount: 23, type: 'AIRTIME', label: '1GB (1 Hour)' },
    49: { amount: 49, type: 'AIRTIME', label: '400MB (7 Days)' },
    52: { amount: 52, type: 'AIRTIME', label: '1.5GB (3 Hours)' },
    55: { amount: 55, type: 'AIRTIME', label: '1GB (Till Midnight)' },
    99: { amount: 99, type: 'AIRTIME', label: '1.5GB (24 Hours)' },
    110: { amount: 110, type: 'AIRTIME', label: '2GB (24 Hours)' },
    999: { amount: 999, type: 'AIRTIME', label: '8GB + 400 Mins (Monthly)' }
};

// Function to trigger Africa's Talking Airtime/Data Delivery
async function sendAirtime(phoneNumber, amount) {
    try {
        let formattedPhone = phoneNumber;
        if (formattedPhone.startsWith("0")) {
            formattedPhone = "+254" + formattedPhone.substring(1);
        } else if (formattedPhone.startsWith("254")) {
            formattedPhone = "+" + formattedPhone;
        }

        console.log(`🚀 Sending KES ${amount} to ${formattedPhone}...`);

        const payload = new URLSearchParams();
        payload.append('username', AT_USERNAME);
        payload.append('recipients', JSON.stringify([
            { phoneNumber: formattedPhone, currencyCode: 'KES', amount: parseFloat(amount) }
        ]));

        const endpoint = AT_USERNAME === 'sandbox' 
            ? 'https://api.sandbox.africastalking.com/version1/airtime/send'
            : 'https://api.africastalking.com/version1/airtime/send';

        const response = await axios.post(endpoint, payload, {
            headers: {
                'apiKey': AT_API_KEY,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            }
        });

        console.log('✅ Africa\'s Talking Response:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Failed to send airtime:', error.response ? error.response.data : error.message);
    }
}

// Safaricom Validation Webhook (Required by Daraja)
app.post('/api/mpesa-confirmation', async (req, res) => {
    console.log("📩 Incoming M-PESA Payment Notification:", JSON.stringify(req.body, null, 2));

    const body = req.body;
    
    // Extract Phone & Amount from M-PESA payload
    const phoneNumber = body.MSISDN || body.PhoneNumber || (body.Body && body.Body.stkCallback && body.Body.stkCallback.CallbackMetadata ? body.Body.stkCallback.CallbackMetadata.Item.find(i => i.Name === 'PhoneNumber').Value : null);
    const amountPaid = body.TransAmount || (body.Body && body.Body.stkCallback && body.Body.stkCallback.CallbackMetadata ? body.Body.stkCallback.CallbackMetadata.Item.find(i => i.Name === 'Amount').Value : null);

    if (phoneNumber && amountPaid) {
        const roundedAmount = Math.round(parseFloat(amountPaid));
        const matchedPackage = PACKAGE_MAP[roundedAmount];

        if (matchedPackage) {
            console.log(`🎉 Match Found: KES ${roundedAmount} for package ${matchedPackage.label}`);
            await sendAirtime(phoneNumber, roundedAmount);
        } else {
            console.log(`⚠️ Unrecognized amount: KES ${roundedAmount}. No automated package configured for this exact value.`);
        }
    }

    // Always respond with success to Safaricom
    res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
});

app.get('/', (req, res) => {
    res.send("M-PESA Webhook Bot is Running for Till 5059179!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
