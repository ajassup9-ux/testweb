const HTML = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>Userbot Panel</title>
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<style>
  :root{
    --bg1:#0a0e1a; --bg2:#121a30; --accent:#6d8cff; --accent2:#a06bff;
    --card:rgba(255,255,255,.06); --stroke:rgba(255,255,255,.12); --text:#eef1f8; --muted:#9aa6c2;
  }
  *{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
  body{background:linear-gradient(160deg,var(--bg1),var(--bg2));color:var(--text);min-height:100vh;overflow-x:hidden;position:relative}
  .glow{position:fixed;border-radius:50%;filter:blur(70px);opacity:.5;z-index:0;pointer-events:none}
  .g1{width:260px;height:260px;background:var(--accent);top:-80px;left:-60px}
  .g2{width:240px;height:240px;background:var(--accent2);bottom:-70px;right:-50px}
  .anim .g1{animation:float1 9s ease-in-out infinite}
  .anim .g2{animation:float2 11s ease-in-out infinite}
  @keyframes float1{50%{transform:translate(40px,30px) scale(1.1)}}
  @keyframes float2{50%{transform:translate(-30px,-25px) scale(1.15)}}
  .wrap{position:relative;z-index:1;padding:22px 18px 40px;max-width:520px;margin:0 auto}
  .hero{display:flex;flex-direction:column;align-items:center;margin:10px 0 22px}
  .orb{width:92px;height:92px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:46px;
    background:radial-gradient(circle at 30% 30%,var(--accent),var(--accent2));box-shadow:0 0 40px var(--accent)}
  .anim .orb{animation:pulse 3s ease-in-out infinite}
  @keyframes pulse{50%{transform:scale(1.06);box-shadow:0 0 60px var(--accent2)}}
  .hero h1{font-size:21px;margin-top:14px;font-weight:700}
  .hero p{color:var(--muted);font-size:13px;margin-top:4px}
  .card{background:var(--card);border:1px solid var(--stroke);border-radius:20px;padding:18px;backdrop-filter:blur(12px);margin-bottom:16px}
  .uc{display:flex;align-items:center;gap:14px}
  .ava{width:54px;height:54px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;
    background:linear-gradient(135deg,var(--accent),var(--accent2))}
  .ui{flex:1;min-width:0}
  .ui .nm{font-weight:700;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .ui .id{color:var(--muted);font-size:12px;margin-top:2px}
  .badge{display:inline-block;margin-top:6px;padding:3px 11px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:.3px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .tile{background:var(--card);border:1px solid var(--stroke);border-radius:18px;padding:18px 14px;cursor:pointer;transition:.2s;display:flex;flex-direction:column;gap:8px}
  .tile:active{transform:scale(.96);background:rgba(255,255,255,.1)}
  .tile .ic{font-size:26px}
  .tile .tt{font-weight:600;font-size:14px}
  .tile .ds{color:var(--muted);font-size:11px;line-height:1.3}
  .tile.full{grid-column:1/-1;flex-direction:row;align-items:center;gap:14px}
  .tile.full .ic{font-size:30px}
  .cta{background:linear-gradient(135deg,var(--accent),var(--accent2));border:none}
  .cta .ds{color:rgba(255,255,255,.85)}
  .fab{position:fixed;right:18px;bottom:22px;width:54px;height:54px;border-radius:50%;border:none;z-index:5;cursor:pointer;font-size:24px;
    background:var(--card);border:1px solid var(--stroke);backdrop-filter:blur(10px);color:var(--text)}
  .fab:active{transform:scale(.92)}
  .sheet{position:fixed;left:0;right:0;bottom:0;z-index:20;background:var(--bg2);border-radius:24px 24px 0 0;border-top:1px solid var(--stroke);
    padding:20px 18px 30px;transform:translateY(110%);transition:.3s cubic-bezier(.2,.8,.2,1);max-height:82vh;overflow-y:auto}
  .sheet.open{transform:translateY(0)}
  .ov{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:15;opacity:0;pointer-events:none;transition:.3s}
  .ov.open{opacity:1;pointer-events:auto}
  .sh-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
  .sh-h h3{font-size:17px}
  .x{background:var(--card);border:1px solid var(--stroke);color:var(--text);border-radius:10px;width:32px;height:32px;cursor:pointer;font-size:16px}
  .row{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid var(--stroke)}
  .row:last-child{border:none}
  .themes{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:6px 0 4px}
  .sw{aspect-ratio:1;border-radius:14px;cursor:pointer;border:2px solid transparent;transition:.15s}
  .sw:active{transform:scale(.9)}
  .sw.sel{border-color:#fff}
  .price{background:var(--card);border:1px solid var(--stroke);border-radius:14px;padding:14px;margin-bottom:10px}
  .price .pt{font-weight:700;font-size:15px;margin-bottom:8px}
  .price .pr{display:flex;justify-content:space-between;font-size:13px;color:var(--muted);padding:3px 0}
  .price .pr b{color:var(--text)}
  .tg{position:relative;width:46px;height:26px;background:rgba(255,255,255,.2);border-radius:20px;cursor:pointer;transition:.2s}
  .tg.on{background:var(--accent)}
  .tg::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:.2s}
  .tg.on::after{left:23px}
  .hint{color:var(--muted);font-size:11px;text-align:center;margin-top:18px;line-height:1.5}
</style>
</head>
<body class="anim">
<div class="glow g1"></div>
<div class="glow g2"></div>

<div class="wrap">
  <div class="hero">
    <div class="orb">&#129302;</div>
    <h1 id="heroTitle">Userbot Panel</h1>
    <p id="heroSub">Kelola akses userbot kamu</p>
  </div>

  <div class="card">
    <div class="uc">
      <div class="ava" id="ava">U</div>
      <div class="ui">
        <div class="nm" id="uName">Member</div>
        <div class="id" id="uId">ID: -</div>
        <span class="badge" id="uBadge">USER</span>
      </div>
    </div>
  </div>

  <div class="grid">
    <div class="tile cta full" id="tConnect">
      <div class="ic">&#128268;</div>
      <div>
        <div class="tt">Connect Userbot</div>
        <div class="ds">Sambungkan akun &mdash; kode OTP dikirim lewat bot</div>
      </div>
    </div>
    <div class="tile" id="tBuy">
      <div class="ic">&#128176;</div>
      <div class="tt">Beli Akses</div>
      <div class="ds">Lihat daftar harga</div>
    </div>
    <div class="tile" id="tHelp">
      <div class="ic">&#10067;</div>
      <div class="tt">Bantuan</div>
      <div class="ds">Cara pakai bot</div>
    </div>
    <div class="tile" id="tGroup">
      <div class="ic">&#128172;</div>
      <div class="tt">Grup</div>
      <div class="ds">Komunitas</div>
    </div>
    <div class="tile" id="tSupport">
      <div class="ic">&#128231;</div>
      <div class="tt">Support</div>
      <div class="ds">Hubungi owner</div>
    </div>
  </div>

  <div class="hint">Userbot Panel &bull; OTP &amp; transaksi tetap lewat bot demi keamanan</div>
</div>

<button class="fab" id="fab">&#9881;</button>
<div class="ov" id="ov"></div>

<!-- SETTINGS SHEET -->
<div class="sheet" id="shSet">
  <div class="sh-h"><h3>Pengaturan Tampilan</h3><button class="x" id="xSet">&times;</button></div>
  <div style="font-size:13px;color:var(--muted);margin-bottom:8px">Tema</div>
  <div class="themes" id="themes"></div>
  <div class="row"><span>Animasi</span><div class="tg on" id="tgAnim"></div></div>
</div>

<!-- BUY SHEET -->
<div class="sheet" id="shBuy">
  <div class="sh-h"><h3>Daftar Harga</h3><button class="x" id="xBuy">&times;</button></div>
  <div class="price"><div class="pt">&#11088; Premium</div>
    <div class="pr"><span>30 hari</span><b>Rp 1.000</b></div>
    <div class="pr"><span>Permanen</span><b>Rp 2.000</b></div></div>
  <div class="price"><div class="pt">&#128188; Reseller</div>
    <div class="pr"><span>30 hari</span><b>Rp 3.000</b></div>
    <div class="pr"><span>Permanen</span><b>Rp 4.000</b></div></div>
  <div class="price"><div class="pt">&#128737; Admin</div>
    <div class="pr"><span>30 hari</span><b>Rp 5.000</b></div>
    <div class="pr"><span>Permanen</span><b>Rp 7.000</b></div></div>
  <button class="tile cta full" id="buyContact" style="margin-top:6px">
    <div class="ic">&#128231;</div><div><div class="tt">Order ke Owner</div><div class="ds">Chat untuk pembelian</div></div>
  </button>
</div>

<script>
  var tg = window.Telegram ? window.Telegram.WebApp : null;
  if (tg) { try { tg.ready(); tg.expand(); } catch(e){} }

  // ── baca parameter dari URL ──
  function qp(k){ try{ return new URLSearchParams(window.location.search).get(k) || ""; }catch(e){ return ""; } }
  var ROLE = (qp("role") || "user").toLowerCase();
  var UID = qp("uid");
  var OWNERS = qp("owners");
  var BOTU = (qp("bot") || "").replace("@","");

  var firstOwner = OWNERS ? OWNERS.split(",")[0].replace("@","") : "";

  // ── role label + warna badge ──
  var ROLE_INFO = {
    pemilik:{t:"PEMILIK",c:"#22d3ee"}, ceo:{t:"CEO",c:"#f5d020"}, tk:{t:"TK",c:"#c084fc"},
    owner:{t:"OWNER",c:"#fbbf24"}, admin:{t:"ADMIN",c:"#60a5fa"}, reseller:{t:"RESELLER",c:"#34d399"},
    prem:{t:"PREMIUM",c:"#a78bfa"}, user:{t:"USER",c:"#94a3b8"}
  };
  var ri = ROLE_INFO[ROLE] || ROLE_INFO.user;

  function setText(id,v){ var e=document.getElementById(id); if(e) e.textContent=v; }
  var nm = tg && tg.initDataUnsafe && tg.initDataUnsafe.user ? tg.initDataUnsafe.user.first_name : "Member";
  setText("uName", nm || "Member");
  setText("uId", "ID: " + (UID || "-"));
  setText("ava", (nm || "U").charAt(0).toUpperCase());
  var badge = document.getElementById("uBadge");
  badge.textContent = ri.t;
  badge.style.background = "rgba(255,255,255,.1)";
  badge.style.color = ri.c;
  badge.style.border = "1px solid " + ri.c;
  setText("heroSub", "Login sebagai " + ri.t);

  // ── helper buka link/chat ──
  function openTG(url){ if(tg && tg.openTelegramLink){ tg.openTelegramLink(url); } else { window.open(url,"_blank"); } }

  // ── CONNECT: buka chat bot dengan deep-link start=connect (OTP diproses di bot) ──
  document.getElementById("tConnect").onclick = function(){
    if(!BOTU){ if(tg) tg.showAlert("Bot belum dikenali."); return; }
    openTG("https://t.me/" + BOTU + "?start=connect");
    if(tg) tg.close();
  };

  // ── sheets ──
  var ov = document.getElementById("ov");
  function open(el){ el.classList.add("open"); ov.classList.add("open"); }
  function closeAll(){ document.querySelectorAll(".sheet").forEach(function(s){ s.classList.remove("open"); }); ov.classList.remove("open"); }
  ov.onclick = closeAll;
  document.getElementById("fab").onclick = function(){ open(document.getElementById("shSet")); };
  document.getElementById("xSet").onclick = closeAll;
  document.getElementById("tBuy").onclick = function(){ open(document.getElementById("shBuy")); };
  document.getElementById("xBuy").onclick = closeAll;

  document.getElementById("tHelp").onclick = function(){ if(BOTU){ openTG("https://t.me/"+BOTU+"?start=help"); } };
  document.getElementById("tGroup").onclick = function(){ if(tg) tg.showAlert("Hubungi owner untuk link grup."); };
  function contactOwner(){ if(firstOwner){ openTG("https://t.me/"+firstOwner); } else if(tg){ tg.showAlert("Owner belum diset."); } }
  document.getElementById("tSupport").onclick = contactOwner;
  document.getElementById("buyContact").onclick = contactOwner;

  // ── tema (7 preset + simpan localStorage) ──
  var THEMES = [
    {n:"Midnight", b1:"#0a0e1a", b2:"#121a30", a:"#6d8cff", a2:"#a06bff"},
    {n:"Ocean",    b1:"#06141f", b2:"#0a2433", a:"#22d3ee", a2:"#3b82f6"},
    {n:"Emerald",  b1:"#06160f", b2:"#0a2417", a:"#34d399", a2:"#10b981"},
    {n:"Royal",    b1:"#0d0a1f", b2:"#1a1233", a:"#a06bff", a2:"#6d28d9"},
    {n:"Sunset",   b1:"#1f0d0a", b2:"#33180f", a:"#fb923c", a2:"#f43f5e"},
    {n:"Rose",     b1:"#1f0a14", b2:"#330f22", a:"#fb7185", a2:"#e11d48"},
    {n:"Mono",     b1:"#0c0c0e", b2:"#1a1a1f", a:"#a1a1aa", a2:"#71717a"}
  ];
  var root = document.documentElement;
  function applyTheme(t){
    root.style.setProperty("--bg1",t.b1); root.style.setProperty("--bg2",t.b2);
    root.style.setProperty("--accent",t.a); root.style.setProperty("--accent2",t.a2);
  }
  function saveT(i){ try{ localStorage.setItem("ubot_theme", String(i)); }catch(e){} }
  function loadT(){ try{ var v=localStorage.getItem("ubot_theme"); return v===null?0:parseInt(v); }catch(e){ return 0; } }
  var themesEl = document.getElementById("themes");
  THEMES.forEach(function(t,i){
    var d = document.createElement("div");
    d.className = "sw";
    d.style.background = "linear-gradient(135deg," + t.a + "," + t.a2 + ")";
    d.title = t.n;
    d.onclick = function(){
      applyTheme(t); saveT(i);
      document.querySelectorAll(".sw").forEach(function(s){ s.classList.remove("sel"); });
      d.classList.add("sel");
      if(tg && tg.HapticFeedback){ try{ tg.HapticFeedback.selectionChanged(); }catch(e){} }
    };
    themesEl.appendChild(d);
  });
  var initI = loadT(); if(initI>=THEMES.length) initI=0;
  applyTheme(THEMES[initI]);
  if(themesEl.children[initI]) themesEl.children[initI].classList.add("sel");

  // ── animasi toggle ──
  function loadAnim(){ try{ return localStorage.getItem("ubot_anim")!=="0"; }catch(e){ return true; } }
  var tgAnim = document.getElementById("tgAnim");
  function setAnim(on){
    if(on){ document.body.classList.add("anim"); tgAnim.classList.add("on"); }
    else { document.body.classList.remove("anim"); tgAnim.classList.remove("on"); }
    try{ localStorage.setItem("ubot_anim", on?"1":"0"); }catch(e){}
  }
  setAnim(loadAnim());
  tgAnim.onclick = function(){ setAnim(!document.body.classList.contains("anim")); };
</script>
</body>
</html>`;
export default {
  async fetch() {
    return new Response(HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
};
