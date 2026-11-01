const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { phone, apiId, apiHash, phoneCodeHash, code, session } = req.body;

    const client = new TelegramClient(new StringSession(session), parseInt(apiId), apiHash, {
        connectionRetries: 1, useWSS: true
    });

    try {
        await client.connect();
        await client.invoke(new Api.auth.SignIn({
            phoneNumber: phone,
            phoneCodeHash: phoneCodeHash,
            phoneCode: code
        }));

        const finalSession = client.session.save();
        await client.disconnect();
        return res.status(200).json({ success: true, session: finalSession });

    } catch (err) {
        if(client) await client.disconnect();
        if (err.message.includes('SESSION_PASSWORD_NEEDED')) {
            return res.status(200).json({ success: false, need2FA: true, session: session });
        }
        return res.status(500).json({ success: false, error: err.message });
    }
}
