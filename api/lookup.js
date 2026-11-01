const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { apiId, apiHash, session, target, type } = req.body;

    const client = new TelegramClient(new StringSession(session), parseInt(apiId), apiHash, {
        connectionRetries: 1, useWSS: true
    });

    try {
        await client.connect();
        let entity;
        try {
            entity = await client.getEntity(target);
        } catch (e) {
            throw new Error('Target tidak ditemukan. Pastikan username/ID valid.');
        }

        let output = [];
        let createdYear = 'Unknown';
        if (entity.id) {
            const idStr = entity.id.toString();
            if (idStr.length <= 7) createdYear = '2013';
            else if (idStr.length === 8) createdYear = '2015';
            else if (idStr.length === 9) createdYear = '2019';
            else if (idStr.length === 10) createdYear = '2022';
            else createdYear = '2024';
        }
        
        const currentYear = new Date().getFullYear();
        const age = createdYear !== 'Unknown' ? `${currentYear - createdYear} years` : 'Unknown';
        
        let dc = 'Unknown';
        if (entity.photo && entity.photo.dcId) dc = entity.photo.dcId;
        else if (entity.status) dc = '5'; 

        if (type === 'User' || type === 'Bot') {
            const fullUser = await client.invoke(new Api.users.GetFullUser({ id: entity.id }));
            const u = fullUser.users[0];

            output.push(`- ID: ${u.id} - ${u.id.toString().length} Digits`);
            output.push(`- Name: ${u.firstName || ''} ${u.lastName || ''}`);
            output.push(`- DC: ${dc}`);
            output.push(`- Created: ${createdYear}`);
            output.push(`- Username: ${u.username ? '@' + u.username : 'No Username'}`);
            output.push(`- Premium: ${u.premium ? 'Active' : 'Inactive'}`);
            output.push(`- Language: ${u.langCode || 'Unknown'}`);
            output.push(`- Photos: ${u.photo ? 'Set' : 'None'}`);
            output.push(`- Status: ${u.status ? u.status.className.replace('UserStatus', '') : 'Unknown'}`);
            output.push(`- Scam Label: ${u.scam ? 'Yes' : 'No'}`);
            output.push(`- Fake Label: ${u.fake ? 'Yes' : 'No'}`);
            output.push(`- Paid Message: ${u.contactRequirePremium ? 'Yes' : 'No'}`);
            output.push(`- Account Age: ${age}`);

        } else {
            const fullChat = await client.invoke(new Api.channels.GetFullChannel({ channel: entity.id }));
            const c = fullChat.chats[0];

            output.push(`- ID: ${c.id} - ${c.id.toString().length} Digits`);
            output.push(`- Title: ${c.title}`);
            output.push(`- DC: ${dc}`);
            output.push(`- Created: ${createdYear}`);
            output.push(`- Username: ${c.username ? '@' + c.username : 'No Username'}`);
            output.push(`- Broadcast: ${c.broadcast ? 'Yes' : 'No'}`);
            output.push(`- Megagroup: ${c.megagroup ? 'Yes' : 'No'}`);
            output.push(`- Scam Label: ${c.scam ? 'Yes' : 'No'}`);
            output.push(`- Fake Label: ${c.fake ? 'Yes' : 'No'}`);
            output.push(`- Participants: ${fullChat.fullChat.participantsCount || 'Hidden'}`);
            output.push(`- About: ${fullChat.fullChat.about || 'No Bio'}`);
            output.push(`- Age: ${age}`);
        }

        await client.disconnect();
        return res.status(200).json({ success: true, data: output.join('\n') });

    } catch (err) {
        if(client) await client.disconnect();
        return res.status(500).json({ success: false, error: err.message });
    }
              }
