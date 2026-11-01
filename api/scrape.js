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
        let keywordsData = new Set(); // Pake Set biar gak duplikat

        // REGEX SUPER LEBAR: Nangkep link alightcreative/alightmotion dalam kondisi apapun
        const urlRegex = /(https?:\/\/(?:www\.)?(?:alightcreative|alightmotion)\.com\/[^\s"']+)/gi;
        const keywordRegex = /(preset|xml|5mb|5gb|alight)/i;

        const addText = (text, type) => {
            if (!text) return;
            const urls = text.match(urlRegex);
            if (urls) urls.forEach(u => foundLinks.add(u));
            
            if (keywordRegex.test(text)) {
                keywordsData.add(`[${type}] ${text}`);
            }
        };

        // 1. Scan Deskripsi Video
        addText(videoData.title, 'Deskripsi');

        let cursor = 0;
        let hasMore = true;
        let pages = 0;

        // 2. Loop Komen
        while (hasMore && pages < 10 && (Date.now() - startTime < TIMEOUT_LIMIT)) {
            pages++;
            try {
                const commentRes = await axios.get(`https://www.tikwm.com/api/comment/list/?url=${encodeURIComponent(url)}&count=50&cursor=${cursor}`, { timeout: 3000 });
                const comments = commentRes.data.data?.comments || [];

                for (const c of comments) {
                    // Scan teks komen utama
                    addText(c.text, 'Komentar');

                    // 3. BONGKAR BALASAN (REPLY) - Kunci utamanya di sini!
                    // Kita hajar terus selama ada reply_comment_total atau reply_id
                    if ((c.reply_comment_total > 0 || c.reply_id) && (Date.now() - startTime < TIMEOUT_LIMIT)) {
                        try {
                            const replyRes = await axios.get(`https://www.tikwm.com/api/comment/reply/list/?url=${encodeURIComponent(url)}&cid=${c.cid}&count=50`, { timeout: 2500 });
                            const replies = replyRes.data.data?.comments || [];
                            
                            for (const r of replies) {
                                addText(r.text, 'Balasan Komen');
                            }
                        } catch (e) { /* Skip jika gagal 1 reply */ }
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
                        // Pisahin tipe sama teksnya buat UI
                        const match = text.match(/^\[(.*?)\] (.*)/);
                        return { type: match ? match[1] : 'Teks', text: match ? match[2] : text };
                    })
                }
            }
        });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
