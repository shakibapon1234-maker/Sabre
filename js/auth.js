/* Sabre security gate.  This file intentionally contains only the public
   Supabase URL/key; privileged actions are performed by Edge Functions. */
(() => {
  const URL = 'https://yajsoxywosuyyoufuxui.supabase.co';
  const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhanNveHl3b3N1eXlvdWZ1eHVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMzYyMDAsImV4cCI6MjEwNTgxMjIwMH0.b4ESJvByQkje10NVjn0bJQPwUOaalV2ZvkRh8p6h3ds';
  const SESSION_KEY = 'sabre_supabase_session_v1';
  const DEVICE_KEY = 'sabre_training_device_id_v1';
  let session, deviceId, heartbeat, failures = 0;
  const headers = token => ({ apikey: KEY, Authorization: `Bearer ${token || KEY}`, 'Content-Type': 'application/json' });
  const $ = id => document.getElementById(id);
  function device() {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) { const bytes = new Uint8Array(16); crypto.getRandomValues(bytes); id = 'SBR-' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('').toUpperCase().match(/.{1,4}/g).join('-'); localStorage.setItem(DEVICE_KEY, id); }
    return id;
  }
  function render() {
    const shell = document.createElement('section'); shell.id = 'sbLoginShell';
    shell.innerHTML = `<style>#sbLoginShell{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:linear-gradient(135deg,#111a27,#253b55);font-family:Segoe UI,Arial,sans-serif;color:#edf3f8}#sbLoginShell[hidden]{display:none!important}#sbLoginShell .card{width:min(420px,92vw);padding:34px;border-radius:12px;background:#fff;color:#1d2733;box-shadow:0 20px 55px #0008}#sbLoginShell h1{margin:0 0 6px;color:#b6432f}#sbLoginShell p{color:#56616f}#sbLoginShell label{display:block;margin:16px 0 6px;font-weight:600}#sbLoginShell input{width:100%;padding:11px;border:1px solid #b8c2cd;border-radius:5px;font-size:15px;box-sizing:border-box}#sbLoginShell .password-wrap{position:relative}#sbLoginShell .password-wrap input{padding-right:48px}#sbLoginShell .eye{position:absolute;right:7px;top:7px;width:34px;height:34px;margin:0;padding:0;border:0;border-radius:4px;background:transparent;color:#536171;font-size:18px;cursor:pointer}#sbLoginShell .eye:hover{background:#eaf0f4}#sbLoginShell .submit{width:100%;margin-top:20px;padding:12px;border:0;border-radius:5px;background:#0d817e;color:#fff;font-weight:700;cursor:pointer}#sbLoginShell .err{min-height:20px;color:#b42318;margin:12px 0 0}#sbLoginShell code{display:block;font-size:11px;word-break:break-all;background:#edf2f6;padding:7px;border-radius:4px}</style><div class="card"><h1>Sabre Training</h1><p>Secure training environment</p><form id="sbLoginForm"><label>Username<input id="sbLoginUsername" autocomplete="username" required></label><label>Password<span class="password-wrap"><input id="sbLoginPassword" type="password" autocomplete="current-password" required><button class="eye" id="sbPasswordEye" type="button" aria-label="Show password">◉</button></span></label><button class="submit" id="sbSignIn" type="button">Sign in</button></form><p class="err" id="sbLoginError"></p><p>Device ID</p><code id="sbDeviceId"></code></div>`;
    document.body.appendChild(shell); $('sbDeviceId').textContent = deviceId;
    $('sbLoginForm').addEventListener('submit', signIn);
    $('sbSignIn').addEventListener('click', signIn);
    $('sbPasswordEye').addEventListener('click', () => { const input = $('sbLoginPassword'); const visible = input.type === 'text'; input.type = visible ? 'password' : 'text'; $('sbPasswordEye').textContent = visible ? '◉' : '◉̸'; $('sbPasswordEye').setAttribute('aria-label', visible ? 'Show password' : 'Hide password'); });
  }
  async function call(name, body, token) { const r = await fetch(`${URL}/functions/v1/${name}`, { method:'POST', headers:headers(token), body:JSON.stringify(body) }); const json = await r.json().catch(() => ({})); if (!r.ok) throw new Error(json.error || 'Security service unavailable.'); return json; }
  function appType() { return navigator.userAgent.includes('Electron') ? 'electron' : (/Android/i.test(navigator.userAgent) ? 'android' : 'web'); }
  function lock(message) { clearInterval(heartbeat); session = null; localStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(SESSION_KEY); $('sbLoginError').textContent = message || 'Internet connection is required to use this training application.'; $('sbLoginShell').hidden = false; }
  function startHeartbeat() { clearInterval(heartbeat); failures = 0; heartbeat = setInterval(async () => { try { await call('device-license', { action:'heartbeat', device_id:deviceId, app_type:appType() }, session.access_token); failures = 0; } catch (e) { if (++failures >= 2) lock(e.message); } }, 300000); }
  async function signIn(event) { event.preventDefault(); const username = $('sbLoginUsername').value.trim().toUpperCase(), password = $('sbLoginPassword').value; $('sbLoginError').textContent = ''; try { const login = await call('login-with-device', { username, password, device_id:deviceId, device_name:navigator.userAgent.slice(0,150), app_type:appType() }); await call('device-license', { action:'activate', device_id:deviceId, device_name:navigator.userAgent.slice(0,150), app_type:appType() }, login.session.access_token); session = { ...login.session, profile:login.profile }; sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); $('sbLoginShell').hidden = true; startHeartbeat(); } catch (e) { $('sbLoginError').textContent = e.message; } }
  window.addEventListener('DOMContentLoaded', () => { deviceId = device(); render(); window.addEventListener('offline', () => lock()); });
})();
