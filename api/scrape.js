const axios = require('axios');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL TikTok wajib diisi' });

    const startTime = Date.now();
    const TIMEOUT_LIMIT = 9000; // 9 detik batas aman Vercel

    try {
        const videoRes = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, { timeout: 4000 });
        if (videoRes.data.code !== 0 || !videoRes.data.data) throw new Error('Video gak valid.');

        const videoData = videoRes.data.data;
        const authorData = videoData.author || {};

        let foundLinks = new Set();
        let keywordsData = new Set();
        let rawDebug = []; // Buat nampilin isi asli komen (buat ngecek API nipu apa nggak)

        // REGEX BARU: Nangkep link alightcreative walau tanpa https://
        const urlRegex = /(?:https?:\/\/)?(?:www\.)?(?:alightcreative|alightmotion)\.com\/(?:am\/share\/|p\/)[a-zA-Z0-9_\-\/]+/gi;
        // REGEX BARU: Cuma nangkep yang emang ada embel-embel xml/5mb/5gb
        const keywordRegex = /\b(?:xml|5mb|5gb|alightmotion|alightcreative)\b/i;

        const processText = (text, type) => {
            if (!text) return;
            
            // Cari Link
            const urls = text.match(urlRegex);
            if (urls) urls.forEach(u => {
                // Bersihin tanda baca di ujung link
                let cleanUrl = u.replace(/[.,;!?]+$/, '');
                if (!cleanUrl.startsWith('http')) cleanUrl = 'https://' + cleanUrl;
                foundLinks.add(cleanUrl);
            });

            // Cari Keyword (Kalo ketemu, masukin ke list)
            if (keywordRegex.test(text)) {
                keywordsData.add(`[${type}] ${text}`);
            }
            
            // Simpen buat debug
            if (text.includes('alight') || text.includes('xml') || text.includes('5mb')) {
                rawDebug.push({ type, text });
            }
        };

        // 1. Scan Deskripsi
        processText(videoData.title, 'Deskripsi');

        let cursor = 0;
        let hasMore = true;
        let pages = 0;

        // 2. Loop Komen
        while (hasMore && pages < 15 && (Date.now() - startTime < TIMEOUT_LIMIT)) {
            pages++;
            try {
                const commentRes = await axios.get(`https://www.tikwm.com/api/comment/list/?url=${encodeURIComponent(url)}&count=50&cursor=${cursor}`, { timeout: 3000 });
                const comments = commentRes.data.data?.comments || [];

                for (const c of comments) {
                    processText(c.text, 'Komentar');

                    // 3. BONGKAR BALASAN (REPLY)
                    if ((c.reply_comment_total > 0 || c.reply_id) && (Date.now() - startTime < TIMEOUT_LIMIT)) {
                        try {
                            const replyRes = await axios.get(`https://www.tikwm.com/api/comment/reply/list/?url=${encodeURIComponent(url)}&cid=${c.cid}&count=50`, { timeout: 2500 });
                            const replies = replyRes.data.data?.comments || [];
                            
                            for (const r of replies) {
                                processText(r.text, 'Balasan Komen');
                            }
                        } catch (e) { /* Skip */ }
                    }
                }

                cursor = commentRes.data.data?.cursor;
                hasMore = commentRes.data.data?.has_more;
            } catch (e) { break; }
        }

        return res.status(200).json({
            success: true,
            data: {
                video: {
                    title: videoData.title || 'No Title',
                    cover: videoData.cover || '',
                    play: videoData.play || '',
                    music: videoData.music_info?.play || '',
                    author: {
                        username: authorData.unique_id || 'unknown',
                        nickname: authorData.nickname || 'Unknown User',
                        avatar: authorData.avatar || 'https://ui-avatars.com/api/?name=U'
                    },
                    stats: {
                        views: videoData.play_count || 0,
                        likes: videoData.digg_count || 0,
                        comments: videoData.comment_count || 0,
                        shares: videoData.share_count || 0
                    }
                },
                scanResult: {
                    links: Array.from(foundLinks),
                    keywords: Array.from(keywordsData).map(text => {
                        const match = text.match(/^\[(.*?)\] (.*)/s);
                        return { type: match ? match[1] : 'Teks', text: match ? match[2] : text };
                    }),
                    debug: rawDebug // Tambahan buat ngecek API
                }
            }
        });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
