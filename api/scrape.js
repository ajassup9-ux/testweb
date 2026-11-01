const axios = require('axios');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL TikTok wajib diisi' });

    try {
        // Pake API TikWM buat nembus proteksi TikTok
        const response = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const json = response.data;

        if (json.code !== 0 || !json.data) {
            return res.status(404).json({ success: false, error: 'Video gak ketemu atau di-private.' });
        }

        const data = json.data;

        // Return data yang udah rapi
        return res.status(200).json({
            success: true,
            data: {
                id: data.id,
                title: data.title,
                cover: data.cover,
                play: data.play, // Link video (No Watermark)
                music: data.music_info.play, // Link audio
                author: {
                    username: data.author.unique_id,
                    nickname: data.author.nickname,
                    avatar: data.author.avatar
                },
                stats: {
                    views: data.play_count,
                    likes: data.digg_count,
                    comments: data.comment_count,
                    shares: data.share_count
                }
            }
        });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
