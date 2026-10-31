// npm init -y
// npm install express axios cheerio cors

const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/api/search', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    try {
        // 1. Resolve shortlink (vt.tiktok.com -> www.tiktok.com)
        const resolveRes = await axios.get(url, { maxRedirects: 5 });
        const finalUrl = resolveRes.request.res.responseUrl;

        // 2. Fetch halaman TikTok asli
        const response = await axios.get(finalUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });

        const $ = cheerio.load(response.data);
        
        // 3. Ekstrak JSON tersembunyi di dalam script TikTok
        const scriptData = $('#__UNIVERSAL_DATA_FOR_REHYDRATION__').html();
        if (!scriptData) return res.status(404).json({ error: 'Data tidak ditemukan, mungkin link invalid' });

        const parsedData = JSON.parse(scriptData);
        const videoData = parsedData.__DEFAULT_SCOPE__['webapp.video-detail'];
        
        if (!videoData || !videoData.itemInfo) {
            return res.status(404).json({ error: 'Video tidak ditemukan atau di-private' });
        }

        const item = videoData.itemInfo.itemStruct;
        const desc = item.desc || '';
        
        // 4. Ekstrak link Alight Motion dari deskripsi (regex)
        const regexAM = /(https?:\/\/(?:www\.)?alightcreative\.com\/[^\s]+)/g;
        const amLinks = desc.match(regexAM) || [];
        
        // Susun format link preset
        const presets = amLinks.map((link, index) => ({
            id: index + 1,
            title: `Reeyn #${Math.floor(Math.random() * 500)} | 1:1 [+1]`, // Fallback title
            link: link,
            size: '5MB', // TikTok API gak nyediain size, ini default UI
            source: 'Deskripsi Video'
        }));

        // Kalau gaada di deskripsi, coba cari di komen (optional logic, usually top comment)
        // Untuk simple nya kita balikin data video dulu

        const result = {
            author: {
                username: item.author.uniqueId,
                nickname: item.author.nickname,
                avatar: item.author.avatarThumb
            },
            stats: {
                playCount: item.stats.playCount,
                diggCount: item.stats.diggCount,
                commentCount: item.stats.commentCount
            },
            music: {
                title: item.music.title,
                author: item.music.authorName,
                cover: item.music.coverLarge || item.music.coverMedium
            },
            desc: desc,
            presets: presets
        };

        res.json(result);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Gagal mengambil data dari TikTok' });
    }
});

app.listen(3000, () => console.log('Backend jalan di http://localhost:3000'));
