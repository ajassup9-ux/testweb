// GANTI PAKE LINK CATBOX LU (FOTO ATAU VIDEO)
const BACKGROUND_URL = "https://files.catbox.moe/0gt6hh.mp4";

let authData = { phone: '', apiId: '', apiHash: '', phoneCodeHash: '', session: '' };
let currentType = '';

document.addEventListener("DOMContentLoaded", () => {
    setupBackground(BACKGROUND_URL);
});

function setupBackground(url) {
    const container = document.getElementById('bg-container');
    container.innerHTML = url.match(/\.(mp4|webm)$/i) 
        ? `<video src="${url}" autoplay loop muted playsinline></video>` 
        : `<img src="${url}">`;
}

function writeLog(text, type = 'normal') {
    const terminal = document.getElementById('terminalOutput');
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    const lines = text.split('\n');
    let html = '';
    lines.forEach(line => {
        html += `<div class="log-line ${type}">[${time}] ${line}</div>`;
    });
    terminal.innerHTML += html;
    terminal.scrollTop = terminal.scrollHeight;
}

async function sendOTP() {
    const phoneRaw = document.getElementById('phone').value.trim();
    const apiId = document.getElementById('apiId').value.trim();
    const apiHash = document.getElementById('apiHash').value.trim();
    const btn = document.getElementById('btnSend');

    if (!phoneRaw || !apiId || !apiHash) return alert("Isi semua data!");
    let phone = phoneRaw.replace(/\D/g, ''); 
    if (phone.startsWith('0')) phone = '+62' + phone.substring(1);
    else if (!phone.startsWith('62') && !phone.startsWith('+')) phone = '+' + phone;
    else if (!phone.startsWith('+')) phone = '+' + phone;

    authData = { phone, apiId, apiHash };
    btn.disabled = true; btn.innerText = "SENDING...";
    writeLog(`Mengirim OTP ke ${phone}...`, 'info');

    try {
        const res = await fetch('/api/send-otp', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, apiId, apiHash })
        });
        const data = await res.json();
        if (data.success) {
            authData.phoneCodeHash = data.phoneCodeHash;
            authData.session = data.session;
            document.getElementById('stepOTP').classList.remove('hidden');
            writeLog(`OTP Terkirim!`, 'success');
        } else throw new Error(data.error);
    } catch (e) {
        writeLog(`Gagal: ${e.message}`, 'error');
        btn.disabled = false; btn.innerText = "LOGIN AUTH";
    }
}

async function verifyOTP() {
    const code = document.getElementById('otpCode').value.trim();
    const btn = document.getElementById('btnVerify');
    if (!code) return alert("Masukkan OTP!");
    btn.disabled = true; btn.innerText = "VERIFYING...";

    try {
        const res = await fetch('/api/verify-otp', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...authData, code })
        });
        const data = await res.json();
        if (data.success) {
            authData.session = data.session;
            loginSuccess();
        } else if (data.need2FA) {
            document.getElementById('step2FA').classList.remove('hidden');
            writeLog(`Akun dilindungi 2FA.`, 'warn');
        } else throw new Error(data.error);
    } catch (e) {
        writeLog(`Gagal: ${e.message}`, 'error');
        btn.disabled = false; btn.innerText = "VERIFY OTP";
    }
}

async function verify2FA() {
    const password = document.getElementById('twoFA').value;
    if (!password) return alert("Masukkan 2FA!");
    try {
        const res = await fetch('/api/verify-2fa', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiId: authData.apiId, apiHash: authData.apiHash, password, session: authData.session })
        });
        const data = await res.json();
        if (data.success) {
            authData.session = data.session;
            loginSuccess();
        } else throw new Error(data.error);
    } catch (e) {
        writeLog(`Gagal: ${e.message}`, 'error');
    }
}

function loginSuccess() {
    writeLog(`=== LOGIN BERHASIL ===`, 'success');
    document.getElementById('authPanel').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');
}

function selectType(type) {
    currentType = type;
    document.getElementById('targetTitle').innerText = `Masukkan Target ${type}`;
    document.getElementById('targetPanel').classList.remove('hidden');
    document.getElementById('targetInput').focus();
}

async function startScan() {
    const target = document.getElementById('targetInput').value.trim();
    const btn = document.getElementById('btnScan');
    
    if (!target) return alert("Masukkan Username atau ID!");
    
    btn.disabled = true; btn.innerText = "SCANNING...";
    writeLog(`\nMemindai DNA target: ${target} (${currentType})...`, 'warn');

    try {
        const res = await fetch('/api/lookup', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                apiId: authData.apiId, apiHash: authData.apiHash, session: authData.session,
                target: target, type: currentType
            })
        });
        const data = await res.json();
        
        if (data.success) {
            writeLog(data.data, 'success');
            btn.innerText = "SCAN";
        } else {
            throw new Error(data.error);
        }
    } catch (e) {
        writeLog(`Error: ${e.message}`, 'error');
        btn.innerText = "SCAN";
    } finally {
        btn.disabled = false;
    }
}
