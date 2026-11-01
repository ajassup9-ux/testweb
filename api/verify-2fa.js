const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { computeCheck } = require("telegram/Password");

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { apiId, apiHash, password, session } = req.body;

    const client = new TelegramClient(new StringSession(session), parseInt(apiId), apiHash, {
        connectionRetries: 1, useWSS: true
    });

    try {
        await client.connect();
        const passwordSrp = await client.invoke(new Api.account.GetPassword());
        const passwordHash = await computeCheck(passwordSrp, password);
        
        await client.invoke(new Api.auth.CheckPassword({ password: passwordHash }));

        const finalSession = client.session.save();
        await client.disconnect();
        return res.status(200).json({ success: true, session: finalSession });

    } catch (err) {
        if(client) await client.disconnect();
        return res.status(500).json({ success: false, error: 'Password 2FA Salah!' });
    }
}
