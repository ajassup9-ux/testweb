const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { phone, apiId, apiHash } = req.body;
    if (!phone || !apiId || !apiHash) return res.status(400).json({ success: false, error: 'Data tidak lengkap' });

    const client = new TelegramClient(new StringSession(""), parseInt(apiId), apiHash, {
        connectionRetries: 1, useWSS: true
    });

    try {
        await client.connect();
        const result = await client.sendCode({ apiId, apiHash }, phone);
        
        const session = client.session.save();
        await client.disconnect();

        return res.status(200).json({ 
            success: true, 
            phoneCodeHash: result.phoneCodeHash, 
            session: session 
        });
    } catch (err) {
        if(client) await client.disconnect();
        return res.status(500).json({ success: false, error: err.message || 'Gagal mengirim OTP' });
    }
}
