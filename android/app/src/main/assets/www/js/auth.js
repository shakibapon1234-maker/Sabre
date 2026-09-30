/* Sabre security gate. This file intentionally contains only the public
   Supabase URL/key; privileged actions are performed by Edge Functions. */
(() => {
  const URL = 'https://yajsoxywosuyyoufuxui.supabase.co';
  const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhanNveHl3b3N1eXlvdWZ1eHVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyMzYyMDAsImV4cCI6MjEwNTgxMjIwMH0.b4ESJvByQkje10NVjn0bJQPwUOaalV2ZvkRh8p6h3ds';
  const SESSION_KEY = 'sabre_supabase_session_v1';
  const DEVICE_KEY = 'sabre_training_device_id_v1';

  let session = null;
  let deviceId = null;
  let heartbeat = null;
  let failures = 0;

  const SVG_EYE_OPEN = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
  const SVG_EYE_CLOSED = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

  const headers = token => ({
    apikey: KEY,
    Authorization: `Bearer ${token || KEY}`,
    'Content-Type': 'application/json'
  });

  const $ = id => document.getElementById(id);

  function device() {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      id = 'SBR-' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('').toUpperCase().match(/.{1,4}/g).join('-');
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  }

  function appType() {
    return navigator.userAgent.includes('Electron') ? 'electron' : (/Android/i.test(navigator.userAgent) ? 'android' : 'web');
  }

  function setLoginLoading(isLoading) {
    const overlay = $('loginLoading');
    const btn = $('sbSignIn');
    if (overlay) overlay.hidden = !isLoading;
    if (btn) {
      btn.disabled = isLoading;
      btn.textContent = isLoading ? 'Signing in…' : 'Sign in';
      btn.style.opacity = isLoading ? '0.75' : '1';
      btn.style.cursor = isLoading ? 'not-allowed' : 'pointer';
    }
  }

  function render() {
    if ($('sbLoginShell')) return;

    const shell = document.createElement('section');
    shell.id = 'sbLoginShell';

    // If a saved session exists, keep login shell hidden while validating in background to prevent flickering
    const hasSaved = Boolean(localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY));
    if (hasSaved) {
      shell.style.display = 'none';
    }

    shell.innerHTML = `
<style>
#sbLoginShell {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at 50% 32%, rgba(200, 16, 46, 0.32) 0%, transparent 68%), linear-gradient(145deg, #130305 0%, #2e070c 45%, #5a0f18 100%);
  font-family: Segoe UI, Arial, sans-serif;
  color: #edf3f8;
}
#sbLoginShell[hidden] {
  display: none !important;
}
#sbLoginShell .card {
  width: min(420px, 92vw);
  padding: 32px 34px 28px;
  border-radius: 14px;
  background: #ffffff;
  color: #1d2733;
  box-shadow: 0 24px 65px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(200, 16, 46, 0.12);
}
#sbLoginShell h1 {
  margin: 0 0 6px;
  color: #c8102e;
  font-weight: 800;
  letter-spacing: -0.3px;
}
#sbLoginShell p {
  color: #56616f;
  margin: 0 0 4px;
}
#sbLoginShell label {
  display: block;
  margin: 16px 0 6px;
  font-weight: 600;
  color: #2b3340;
}
#sbLoginShell input {
  width: 100%;
  padding: 11px 12px;
  border: 1px solid #c9d1da;
  border-radius: 6px;
  font-size: 15px;
  box-sizing: border-box;
  transition: border-color 0.18s, box-shadow 0.18s;
}
#sbLoginShell input:focus {
  outline: none;
  border-color: #c8102e;
  box-shadow: 0 0 0 3px rgba(200, 16, 46, 0.16);
}
#sbLoginShell .password-wrap {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}
#sbLoginShell .password-wrap input {
  padding-right: 44px;
}
#sbLoginShell .eye {
  position: absolute;
  right: 7px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
#sbLoginShell .eye:hover {
  background: #fdebee;
  color: #c8102e;
}
#sbLoginShell .submit {
  width: 100%;
  margin-top: 22px;
  padding: 12px;
  border: 0;
  border-radius: 6px;
  background: linear-gradient(180deg, #d81635 0%, #b80f27 100%);
  color: #fff;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(184, 15, 39, 0.35);
  transition: background 0.18s, box-shadow 0.18s, transform 0.08s;
}
#sbLoginShell .submit:hover {
  background: linear-gradient(180deg, #e41a3a 0%, #c4122c 100%);
  box-shadow: 0 6px 20px rgba(184, 15, 39, 0.45);
}
#sbLoginShell .submit:active {
  transform: translateY(1px);
}
#sbLoginShell .err {
  min-height: 20px;
  color: #b42318;
  margin: 12px 0 0;
  font-weight: 500;
  font-size: 13.5px;
}
#sbLoginShell code {
  display: block;
  font-size: 11px;
  word-break: break-all;
  background: #fdf2f4;
  border: 1px solid #f6d4d9;
  color: #6a1723;
  padding: 8px 10px;
  border-radius: 5px;
  margin-top: 4px;
}
#sbLoginShell .sb-login-helpline {
  margin-top: 18px;
  padding-top: 13px;
  border-top: 1px dashed #f2cad0;
  text-align: center;
  font-size: 13px;
  color: #7b1d28;
}
#sbLoginShell .sb-login-helpline strong {
  color: #c8102e;
  letter-spacing: 0.5px;
  font-size: 14px;
}

/* --- Animated Flying Plane Progress Overlay (Sabre Red) --- */
.login-loading {
  position: fixed;
  inset: 0;
  z-index: 20010;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(18, 3, 5, 0.82);
  backdrop-filter: blur(4px);
}
.login-loading[hidden] {
  display: none !important;
}
.login-loading-card {
  width: min(370px, 92vw);
  padding: 30px 28px 26px;
  display: grid;
  justify-items: center;
  gap: 12px;
  border: 1px solid rgba(255, 175, 185, 0.35);
  border-radius: 16px;
  background: linear-gradient(145deg, #a81327, #48080f);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
  color: #ffffff;
  text-align: center;
}
.login-loading-card strong {
  font-size: 20px;
  letter-spacing: 0.1px;
}
.login-loading-card > span {
  color: #ffccd3;
  font-size: 13.5px;
}
.login-flight-track {
  position: relative;
  width: 230px;
  height: 42px;
  overflow: hidden;
  border-bottom: 2px dashed rgba(255, 200, 210, 0.75);
}
.login-flight-plane {
  position: absolute;
  top: 2px;
  left: -32px;
  color: #ffffff;
  font-size: 30px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.45));
  animation: login-flight 1.8s linear infinite;
}
.login-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(255, 255, 255, 0.28);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: login-spin 0.75s linear infinite;
}
@keyframes login-flight {
  from {
    transform: translateX(0) translateY(6px) rotate(-8deg);
  }
  45% {
    transform: translateX(115px) translateY(0) rotate(-8deg);
  }
  to {
    transform: translateX(275px) translateY(-9px) rotate(-8deg);
  }
}
@keyframes login-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
<div class="card">
  <h1>Sabre Training</h1>
  <p>Secure training environment</p>
  <form id="sbLoginForm">
    <label>Username
      <input id="sbLoginUsername" autocomplete="username" required>
    </label>
    <label>Password
      <span class="password-wrap">
        <input id="sbLoginPassword" type="password" autocomplete="current-password" required>
        <button class="eye" id="sbPasswordEye" type="button" aria-label="Show password">${SVG_EYE_OPEN}</button>
      </span>
    </label>
    <button class="submit" id="sbSignIn" type="button">Sign in</button>
  </form>
  <p class="err" id="sbLoginError"></p>
  <p>Device ID</p>
  <code id="sbDeviceId"></code>
  <div class="sb-login-helpline">
    <span>📞 হেল্পলাইন: <strong>01757208244 (Shakib)</strong></span>
  </div>
</div>

<div class="login-loading" id="loginLoading" hidden role="status" aria-live="assertive" aria-label="Signing you in">
  <div class="login-loading-card">
    <div class="login-flight-track"><span class="login-flight-plane">&#9992;</span></div>
    <div class="login-spinner" aria-hidden="true"></div>
    <strong>Signing you in…</strong>
    <span>Verifying your account and device.</span>
  </div>
</div>`;

    document.body.appendChild(shell);
    if ($('sbDeviceId')) $('sbDeviceId').textContent = deviceId;

    $('sbLoginForm').addEventListener('submit', signIn);
    $('sbSignIn').addEventListener('click', signIn);
    $('sbPasswordEye').addEventListener('click', () => {
      const input = $('sbLoginPassword');
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      $('sbPasswordEye').innerHTML = isPassword ? SVG_EYE_CLOSED : SVG_EYE_OPEN;
      $('sbPasswordEye').setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    });
  }

  async function call(name, body, token) {
    const r = await fetch(`${URL}/functions/v1/${name}`, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify(body)
    });
    const json = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(json.error || 'Security service unavailable.');
    return json;
  }

  async function refreshSessionToken(rfToken) {
    const res = await fetch(`${URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        apikey: KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh_token: rfToken })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) {
      throw new Error(data.msg || data.error_description || 'Session refresh failed.');
    }
    return data;
  }

  function lock(message) {
    clearInterval(heartbeat);
    session = null;
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    setLoginLoading(false);
    if ($('sbLoginError')) {
      $('sbLoginError').textContent = message || 'Internet connection is required to use this training application.';
    }
    if ($('sbLoginShell')) {
      $('sbLoginShell').style.display = '';
    }
  }

  function startHeartbeat() {
    clearInterval(heartbeat);
    failures = 0;
    heartbeat = setInterval(async () => {
      if (!session || !session.access_token) return;
      try {
        await call('device-license', {
          action: 'heartbeat',
          device_id: deviceId,
          app_type: appType()
        }, session.access_token);
        failures = 0;
      } catch (e) {
        // Try token refresh before failing if possible
        if (session.refresh_token) {
          try {
            const refreshed = await refreshSessionToken(session.refresh_token);
            session.access_token = refreshed.access_token;
            session.refresh_token = refreshed.refresh_token || session.refresh_token;
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
            await call('device-license', {
              action: 'heartbeat',
              device_id: deviceId,
              app_type: appType()
            }, session.access_token);
            failures = 0;
            return;
          } catch (_) {}
        }
        if (++failures >= 2) lock(e.message);
      }
    }, 300000); // 5 minutes
  }

  async function signIn(event) {
    if (event) event.preventDefault();
    const username = ($('sbLoginUsername')?.value || '').trim().toUpperCase();
    const password = $('sbLoginPassword')?.value || '';
    if ($('sbLoginError')) $('sbLoginError').textContent = '';

    setLoginLoading(true);
    try {
      const login = await call('login-with-device', {
        username,
        password,
        device_id: deviceId,
        device_name: navigator.userAgent.slice(0, 150),
        app_type: appType()
      });

      await call('device-license', {
        action: 'activate',
        device_id: deviceId,
        device_name: navigator.userAgent.slice(0, 150),
        app_type: appType()
      }, login.session.access_token);

      session = { ...login.session, profile: login.profile };
      // Persist in localStorage so reloads and app restarts retain session
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

      if ($('sbLoginShell')) $('sbLoginShell').style.display = 'none';
      startHeartbeat();
    } catch (e) {
      if ($('sbLoginError')) $('sbLoginError').textContent = e.message;
    } finally {
      setLoginLoading(false);
    }
  }

  async function restoreSession() {
    const stored = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    if (!stored) {
      if ($('sbLoginShell')) $('sbLoginShell').style.display = '';
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      if (!parsed || !parsed.access_token) {
        throw new Error('Invalid session format.');
      }
      session = parsed;

      // Verify the session and device registration against backend
      try {
        await call('device-license', {
          action: 'heartbeat',
          device_id: deviceId,
          app_type: appType()
        }, session.access_token);
      } catch (err) {
        // If access token expired, attempt token refresh
        if (session.refresh_token) {
          const refreshed = await refreshSessionToken(session.refresh_token);
          session.access_token = refreshed.access_token;
          session.refresh_token = refreshed.refresh_token || session.refresh_token;
          localStorage.setItem(SESSION_KEY, JSON.stringify(session));
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

          // Retry heartbeat with the newly refreshed access token
          await call('device-license', {
            action: 'heartbeat',
            device_id: deviceId,
            app_type: appType()
          }, session.access_token);
        } else {
          throw err;
        }
      }

      // Backend confirmed device and session are valid
      if ($('sbLoginShell')) $('sbLoginShell').style.display = 'none';
      startHeartbeat();
    } catch (e) {
      console.warn('Session auto-unlock failed:', e.message);
      // Device revoked, session expired, or user disabled
      lock(e.message || 'Session expired. Please sign in again.');
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    deviceId = device();
    render();
    restoreSession();
    window.addEventListener('offline', () => lock());
  });
})();
