const axios = require('axios');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL TikTok wajib diisi' });

    const startTime = Date.now();
    const TIMEOUT_LIMIT = 8000; // Maksimal 8 detik buat nyari komen

    try {
        // 1. Tarik Data Video
        const videoRes = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        if (videoRes.data.code !== 0 || !videoRes.data.data) {
            throw new Error('Video gak valid atau di-private.');
        }
        const videoData = videoRes.data.data;

        let foundLinks = [];
        let foundKeywords = [];
        let cursor = 0;
        let hasMore = true;
        let totalScanned = 0;

        // Regex Deteksi
        const urlRegex = /(https?:\/\/(?:www\.)?(?:alightcreative|alightmotion)\.com\/[^\s]+)/gi;
        const keywordRegex = /(preset\s*am|am\s*preset|preset\s*xml|xml\s*preset|preset\s*5mb|5mb\s*preset|am\s*xml|xml\s*am)/i;

        // Scan Deskripsi Dulu
        if (videoData.title) {
            const descUrls = videoData.title.match(urlRegex);
            if (descUrls) descUrls.forEach(u => foundLinks.push(u.replace(/[.,;!?]+$/, '')));
            if (keywordRegex.test(videoData.title)) {
                foundKeywords.push({ text: videoData.title, type: 'Deskripsi Video' });
            }
        }

        // 2. Loop Komen (Sampai waktu habis / maks 50 halaman)
        let pages = 0;
        while (hasMore && pages < 50 && (Date.now() - startTime < TIMEOUT_LIMIT)) {
            pages++;
            try {
                const commentRes = await axios.get(`https://www.tikwm.com/api/comment/list/?url=${encodeURIComponent(url)}&count=20&cursor=${cursor}`, { timeout: 3000 });
                
                if (commentRes.data.code !== 0 || !commentRes.data.data || commentRes.data.data.comments.length === 0) {
                    break;
                }

                const comments = commentRes.data.data.comments;
                totalScanned += comments.length;

                for (const c of comments) {
                    const text = c.text || '';
                    
                    // Cek Link & Keyword di Komen Utama
                    const urls = text.match(urlRegex);
                    if (urls) urls.forEach(u => {
                        const clean = u.replace(/[.,;!?]+$/, '');
                        if (!foundLinks.includes(clean)) foundLinks.push(clean);
                    });
                    if (keywordRegex.test(text) && !foundKeywords.some(k => k.text === text)) {
                        foundKeywords.push({ text, type: 'Komentar' });
                    }

                    // Cek Balasan (Reply) kalau ada
                    if (c.reply_comment_total > 0 && (Date.now() - startTime < TIMEOUT_LIMIT)) {
                        try {
                            const replyRes = await axios.get(`https://www.tikwm.com/api/comment/reply/list/?url=${encodeURIComponent(url)}&cid=${c.cid}&count=20`, { timeout: 2000 });
                            if (replyRes.data.code === 0 && replyRes.data.data && replyRes.data.data.comments) {
                                replyRes.data.data.comments.forEach(r => {
                                    const rText = r.text || '';
                                    const rUrls = rText.match(urlRegex);
                                    if (rUrls) rUrls.forEach(u => {
                                        const clean = u.replace(/[.,;!?]+$/, '');
                                        if (!foundLinks.includes(clean)) foundLinks.push(clean);
                                    });
                                    if (keywordRegex.test(rText) && !foundKeywords.some(k => k.text === rText)) {
                                        foundKeywords.push({ text: rText, type: 'Balasan Komen' });
                                    }
                                });
                            }
                        } catch (e) { /* Skip error reply */ }
                    }
                }

                cursor = commentRes.data.data.cursor;
                hasMore = commentRes.data.data.has_more;
            } catch (e) {
                break; // Berhenti kalau API error
            }
        }

        // 3. Return Data Lengkap
        return res.status(200).json({
            success: true,
            data: {
                video: {
                    id: videoData.id,
                    title: videoData.title,
                    cover: videoData.cover,
                    play: videoData.play,
                    music: videoData.music_info.play,
                    author: {
                        username: videoData.author.unique_id,
                        nickname: videoData.author.nickname,
                        avatar: videoData.author.avatar
                    },
                    stats: {
                        views: videoData.play_count,
                        likes: videoData.digg_count,
                        comments: videoData.comment_count,
                        shares: videoData.share_count
                    }
                },
                scanResult: {
                    links: foundLinks,
                    keywords: foundKeywords,
                    totalScanned: totalScanned
                }
            }
        });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
