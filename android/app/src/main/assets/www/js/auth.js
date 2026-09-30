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
  background: linear-gradient(135deg, #111a27, #253b55);
  font-family: Segoe UI, Arial, sans-serif;
  color: #edf3f8;
}
#sbLoginShell[hidden] {
  display: none !important;
}
#sbLoginShell .card {
  width: min(420px, 92vw);
  padding: 34px;
  border-radius: 12px;
  background: #fff;
  color: #1d2733;
  box-shadow: 0 20px 55px #0008;
}
#sbLoginShell h1 {
  margin: 0 0 6px;
  color: #b6432f;
}
#sbLoginShell p {
  color: #56616f;
}
#sbLoginShell label {
  display: block;
  margin: 16px 0 6px;
  font-weight: 600;
}
#sbLoginShell input {
  width: 100%;
  padding: 11px;
  border: 1px solid #b8c2cd;
  border-radius: 5px;
  font-size: 15px;
  box-sizing: border-box;
}
#sbLoginShell .password-wrap {
  position: relative;
}
#sbLoginShell .password-wrap input {
  padding-right: 48px;
}
#sbLoginShell .eye {
  position: absolute;
  right: 7px;
  top: 7px;
  width: 34px;
  height: 34px;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: #536171;
  font-size: 18px;
  cursor: pointer;
}
#sbLoginShell .eye:hover {
  background: #eaf0f4;
}
#sbLoginShell .submit {
  width: 100%;
  margin-top: 20px;
  padding: 12px;
  border: 0;
  border-radius: 5px;
  background: #0d817e;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}
#sbLoginShell .err {
  min-height: 20px;
  color: #b42318;
  margin: 12px 0 0;
}
#sbLoginShell code {
  display: block;
  font-size: 11px;
  word-break: break-all;
  background: #edf2f6;
  padding: 7px;
  border-radius: 4px;
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
        <button class="eye" id="sbPasswordEye" type="button" aria-label="Show password">◉</button>
      </span>
    </label>
    <button class="submit" id="sbSignIn" type="button">Sign in</button>
  </form>
  <p class="err" id="sbLoginError"></p>
  <p>Device ID</p>
  <code id="sbDeviceId"></code>
</div>`;

    document.body.appendChild(shell);
    if ($('sbDeviceId')) $('sbDeviceId').textContent = deviceId;

    $('sbLoginForm').addEventListener('submit', signIn);
    $('sbSignIn').addEventListener('click', signIn);
    $('sbPasswordEye').addEventListener('click', () => {
      const input = $('sbLoginPassword');
      const visible = input.type === 'text';
      input.type = visible ? 'password' : 'text';
      $('sbPasswordEye').textContent = visible ? '◉' : '◉̸';
      $('sbPasswordEye').setAttribute('aria-label', visible ? 'Show password' : 'Hide password');
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
