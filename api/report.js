import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions/index.js";

export default async function handler(req, res) {
    // CORS biar aman pas dites lokal atau production
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
        connectionRetries: 1,
        useWSS: true, // Wajib true biar koneksi aman di Vercel
        deviceModel: "Desktop",
        systemVersion: "Windows 10",
        appVersion: "1.0.0"
    });

    try {
        // Timeout 8 detik biar gak kena limit Vercel (max 10s)
        await client.connect();
        
        // Resolve target
        const entity = await client.getEntity(target);
        
        // Pilih alasan report
        let reason;
        switch (reasonType) {
            case 'spam': reason = new Api.InputReportReasonSpam(); break;
            case 'violence': reason = new Api.InputReportReasonViolence(); break;
            case 'child_abuse': reason = new Api.InputReportReasonChildAbuse(); break;
            case 'pornography': reason = new Api.InputReportReasonPornography(); break;
            case 'copyright': reason = new Api.InputReportReasonCopyright(); break;
            default: reason = new Api.InputReportReasonSpam();
        }

        // Tembak Report
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
        if(errMsg.includes('FLOOD_WAIT')) {
            return res.status(429).json({ success: false, error: 'Kena Limit Telegram (FloodWait)' });
        }
        return res.status(500).json({ success: false, error: errMsg });
    }
}
