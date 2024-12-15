import twilio from 'twilio';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { toNumber, messageText } = req.body;

    if (!toNumber || !messageText) {
        return res.status(400).json({ error: 'Missing required fields: toNumber and messageText' });
    }

    const accountSid = process.env.ACCOUNT_SID;
    const authToken =   process.env.TWILIO_AUTH_TOKEN;


    // Twilio credentials (these should ideally come from a secure backend)

    const fromNumber = process.env.TWILIO_FROM_NUMBER;   // Replace with your Twilio phone number

    const client = twilio(accountSid, authToken);

    const twiml = `
        <Response>
            <Say>${messageText}</Say>
        </Response>
    `;

    try {
        const call = await client.calls.create({
            to: toNumber,
            from: fromNumber,
            twiml: twiml,
        });

        res.status(200).json({ message: 'Call initiated successfully!', callSid: call.sid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
