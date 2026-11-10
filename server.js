require('dotenv').config();
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Health check endpoint so Render knows the app is running
app.get('/', (req, res) => res.send('M-PESA Data Bot Server is Online!'));

// Webhook endpoint to catch Safaricom payment notifications
app.post('/api/mpesa-confirmation', async (req, res) => {
    const { MSISDN, TransAmount, TransID } = req.body;
    const phone = `+${MSISDN}`;
    const amount = parseFloat(TransAmount);

    console.log(`[Payment Received] KES ${amount} from ${phone} (Tx: ${TransID})`);

    try {
        // Map payment amount to airtime/data values
        if (amount === 50) {
            await sendAirtime(phone, 50);
        } else if (amount === 100) {
            await sendAirtime(phone, 100);
        } else {
            console.log(`[Unmatched Amount] KES ${amount} received from ${phone}`);
        }

        // Always acknowledge receipt to Safaricom quickly
        res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
    } catch (error) {
        console.error('[Error processing transaction]', error.message);
        res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted with internal log" });
    }
});

// Function to call Africa's Talking Airtime API
async function sendAirtime(phone, amount) {
    const url = 'https://api.africastalking.com/version1/airtime/send';
    const payload = new URLSearchParams({
        username: process.env.AT_USERNAME,
        recipients: JSON.stringify([
            {
                phoneNumber: phone,
                amount: `KES ${amount}`,
                currencyCode: "KES"
            }
        ])
    });

    return axios.post(url, payload.toString(), {
        headers: {
            'apiKey': process.env.AT_API_KEY,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        }
    });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
});