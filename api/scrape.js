const axios = require('axios');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL TikTok wajib diisi' });

    const startTime = Date.now();
    const TIMEOUT_LIMIT = 8500; // 8.5 detik (Aman dari limit Vercel)

    try {
        const videoRes = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        if (videoRes.data.code !== 0 || !videoRes.data.data) {
            throw new Error('Video gak valid atau di-private.');
        }
        
        const videoData = videoRes.data.data;
        const authorData = videoData.author || {};

        // Set biar gak ada link duplikat
        let foundLinks = new Set();
        let foundKeywords = new Set();
        let keywordsData = []; // Nyimpen detail teks

        // REGEX DIPERBARUI: Nangkep link + kata xml, 5mb, 5gb
        const urlRegex = /(https?:\/\/(?:www\.)?(?:alightcreative|alightmotion)\.com\/[^\s"']+)/gi;
        const keywordRegex = /(preset\s*am|am\s*preset|preset\s*xml|xml\s*preset|preset\s*5mb|5mb\s*preset|am\s*xml|xml\s*am|\bxml\b|\b5mb\b|\b5gb\b)/i;

        // Scan Deskripsi Video
        if (videoData.title) {
            const descUrls = videoData.title.match(urlRegex);
            if (descUrls) descUrls.forEach(u => foundLinks.add(u));
            if (keywordRegex.test(videoData.title)) {
                foundKeywords.add(videoData.title);
                keywordsData.push({ text: videoData.title, type: 'Deskripsi Video' });
            }
        }

        let cursor = 0;
        let hasMore = true;
        let pages = 0;

        // LOOP LEBIH CEPET (50 komen per halaman)
        while (hasMore && pages < 20 && (Date.now() - startTime < TIMEOUT_LIMIT)) {
            pages++;
            try {
                const commentRes = await axios.get(`https://www.tikwm.com/api/comment/list/?url=${encodeURIComponent(url)}&count=50&cursor=${cursor}`, { timeout: 3000 });
                const comments = commentRes.data.data?.comments || [];

                for (const c of comments) {
                    const text = c.text || '';
                    
                    // Cek Komen Utama
                    const urls = text.match(urlRegex);
                    if (urls) urls.forEach(u => foundLinks.add(u));
                    
                    if (keywordRegex.test(text) && !foundKeywords.has(text)) {
                        foundKeywords.add(text);
                        keywordsData.push({ text, type: 'Komentar' });
                    }

                    // CEK BALASAN (REPLY) - Paksa cek kalau kreator atau ada reply
                    const isCreator = c.user?.unique_id === authorData.unique_id;
                    if (c.reply_comment_total > 0 || isCreator || c.reply_id) {
                        try {
                            const replyRes = await axios.get(`https://www.tikwm.com/api/comment/reply/list/?url=${encodeURIComponent(url)}&cid=${c.cid}&count=50`, { timeout: 2000 });
                            const replies = replyRes.data.data?.comments || [];
                            
                            for (const r of replies) {
                                const rText = r.text || '';
                                const rUrls = rText.match(urlRegex);
                                if (rUrls) rUrls.forEach(u => foundLinks.add(u));
                                
                                if (keywordRegex.test(rText) && !foundKeywords.has(rText)) {
                                    foundKeywords.add(rText);
                                    keywordsData.push({ text: rText, type: 'Balasan Komen' });
                                }
                            }
                        } catch (e) { /* Skip error reply */ }
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
                    links: Array.from(foundLinks), // Ubah Set jadi Array
                    keywords: keywordsData
                }
            }
        });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
