const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

    const { target, apiId, apiHash, session, reasonType, message } = req.body;
    
    if (!target || !apiId || !apiHash || !session) {
        return res.status(400).json({ success: false, error: 'Parameter tidak lengkap' });
    }

    const stringSession = new StringSession(session);
    const client = new TelegramClient(stringSession, parseInt(apiId), apiHash, {
        connectionRetries: 1, useWSS: true, deviceModel: "Desktop", systemVersion: "Windows 10", appVersion: "1.0.0"
    });

    try {
        await client.connect();
        const entity = await client.getEntity(target);
        
        let reason;
        switch (reasonType) {
            case 'spam': reason = new Api.InputReportReasonSpam(); break;
            case 'violence': reason = new Api.InputReportReasonViolence(); break;
            case 'child_abuse': reason = new Api.InputReportReasonChildAbuse(); break;
            case 'pornography': reason = new Api.InputReportReasonPornography(); break;
            default: reason = new Api.InputReportReasonSpam();
        }

        await client.invoke(
            new Api.account.ReportPeer({
                peer: entity,
                reason: reason,
                message: message || "This account violates Telegram Terms of Service."
            })
        );

        await client.disconnect();
        return res.status(200).json({ success: true, message: 'Hit confirmed' });

    } catch (error) {
        if(client) { try { await client.disconnect(); } catch(e){} }
        let errMsg = error.message || 'Unknown Error';
        if(errMsg.includes('FLOOD_WAIT')) return res.status(429).json({ success: false, error: 'Limit (FloodWait)' });
        return res.status(500).json({ success: false, error: errMsg });
    }
}
