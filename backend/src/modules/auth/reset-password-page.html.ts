export interface ResetPasswordHtmlParams {
  token: string;
  email: string;
  apiBaseUrl: string;
}

export function renderResetPasswordHtml({ token, email, apiBaseUrl }: ResetPasswordHtmlParams): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password - Shubh Ausar</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #881337;
      --primary-hover: #700f2d;
      --accent: #E65100;
      --gold: #D97706;
      --gold-light: #FEF3C7;
      --bg: #FAF8F5;
      --card-bg: #FFFFFF;
      --text: #1E1B4B;
      --text-muted: #6B7280;
      --border: #F3E8E2;
      --error: #DC2626;
      --success: #059669;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
    }

    .container {
      width: 100%;
      max-width: 460px;
    }

    .brand-header {
      text-align: center;
      margin-bottom: 24px;
    }

    .logo-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      background: linear-gradient(135deg, #881337 0%, #B91C1C 100%);
      border-radius: 20px;
      color: #FFFFFF;
      font-family: 'Outfit', sans-serif;
      font-size: 26px;
      font-weight: 800;
      box-shadow: 0 10px 25px rgba(136, 19, 55, 0.25);
      margin-bottom: 14px;
      position: relative;
    }

    .sparkle-icon {
      position: absolute;
      top: -4px;
      right: -4px;
      background: var(--gold-light);
      border: 2px solid var(--gold);
      border-radius: 50%;
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
    }

    .brand-title {
      font-family: 'Outfit', sans-serif;
      font-size: 26px;
      font-weight: 800;
      color: var(--text);
      letter-spacing: -0.5px;
    }

    .brand-subtitle {
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .card {
      background: var(--card-bg);
      border-radius: 24px;
      padding: 32px 28px;
      box-shadow: 0 20px 40px -15px rgba(136, 19, 55, 0.08), 0 0 0 1px var(--border);
    }

    .card-title {
      font-family: 'Outfit', sans-serif;
      font-size: 20px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 6px;
    }

    .card-desc {
      font-size: 14px;
      color: var(--text-muted);
      line-height: 1.5;
      margin-bottom: 20px;
    }

    .email-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #FDF2F4;
      color: var(--primary);
      padding: 6px 12px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 20px;
      word-break: break-all;
    }

    .form-group {
      margin-bottom: 18px;
    }

    .form-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 6px;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-field {
      width: 100%;
      height: 48px;
      padding: 0 44px 0 14px;
      font-size: 15px;
      color: var(--text);
      background: #F9FAFB;
      border: 1.5px solid #E5E7EB;
      border-radius: 12px;
      outline: none;
      transition: all 0.2s ease;
      font-family: inherit;
    }

    .input-field:focus {
      border-color: var(--primary);
      background: #FFFFFF;
      box-shadow: 0 0 0 3px rgba(136, 19, 55, 0.1);
    }

    .toggle-password {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      color: #9CA3AF;
      cursor: pointer;
      padding: 4px;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toggle-password:hover {
      color: #4B5563;
    }

    .strength-wrapper {
      margin-top: -10px;
      margin-bottom: 16px;
    }

    .strength-bar-bg {
      height: 4px;
      background: #E5E7EB;
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 4px;
    }

    .strength-bar-fill {
      height: 100%;
      width: 0%;
      transition: all 0.3s ease;
    }

    .strength-text {
      font-size: 11px;
      font-weight: 600;
      text-align: right;
    }

    .alert {
      padding: 12px 14px;
      border-radius: 12px;
      font-size: 13px;
      margin-bottom: 18px;
      display: none;
      line-height: 1.4;
    }

    .alert.error {
      display: block;
      background-color: #FEF2F2;
      border: 1px solid #FCA5A5;
      color: #991B1B;
    }

    .alert.success {
      display: block;
      background-color: #ECFDF5;
      border: 1px solid #6EE7B7;
      color: #065F46;
    }

    .submit-btn {
      width: 100%;
      height: 50px;
      background: var(--primary);
      color: #FFFFFF;
      border: none;
      border-radius: 14px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 4px 14px rgba(136, 19, 55, 0.25);
      transition: all 0.2s ease;
      margin-top: 8px;
      font-family: inherit;
    }

    .submit-btn:hover {
      background: var(--primary-hover);
      transform: translateY(-1px);
    }

    .submit-btn:disabled {
      opacity: 0.65;
      cursor: not-allowed;
      transform: none;
    }

    .success-view {
      display: none;
      text-align: center;
      padding: 12px 0;
    }

    .success-icon {
      width: 72px;
      height: 72px;
      background: #D1FAE5;
      border: 3px solid #A7F3D0;
      color: #059669;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      margin: 0 auto 18px;
    }

    .success-title {
      font-family: 'Outfit', sans-serif;
      font-size: 22px;
      font-weight: 800;
      color: #065F46;
      margin-bottom: 8px;
    }

    .success-desc {
      font-size: 14px;
      color: #4B5563;
      line-height: 1.6;
      margin-bottom: 24px;
    }

    .app-link-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      height: 50px;
      background: #881337;
      color: #FFFFFF;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      border-radius: 14px;
      box-shadow: 0 4px 14px rgba(136, 19, 55, 0.25);
      transition: all 0.2s ease;
    }

    .app-link-btn:hover {
      background: #700f2d;
    }

    .footer {
      text-align: center;
      margin-top: 24px;
      font-size: 12px;
      color: var(--text-muted);
    }

    .spinner {
      display: none;
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #FFFFFF;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Brand Header -->
    <div class="brand-header">
      <div class="logo-badge">
        SA
        <span class="sparkle-icon">✨</span>
      </div>
      <h1 class="brand-title">Shubh Ausar</h1>
      <p class="brand-subtitle">Celebration & Wedding Services Marketplace</p>
    </div>

    <!-- Main Card -->
    <div class="card">
      <!-- Error Message -->
      <div id="alertBox" class="alert"></div>

      <!-- Reset Form -->
      <div id="formView">
        <h2 class="card-title">Reset Your Password</h2>
        <p class="card-desc">Create a new secure password for your customer account.</p>

        ${
          email
            ? `<div class="email-badge">
                <span>✉️</span>
                <span>${email}</span>
              </div>`
            : ''
        }

        <form id="resetForm" onsubmit="handleResetSubmit(event)">
          <!-- New Password -->
          <div class="form-group">
            <label class="form-label" for="newPassword">New Password</label>
            <div class="input-wrapper">
              <input 
                type="password" 
                id="newPassword" 
                class="input-field" 
                placeholder="At least 8 characters"
                required
                autocomplete="new-password"
                oninput="checkPasswordStrength(this.value)"
              />
              <button type="button" class="toggle-password" onclick="togglePassword('newPassword', this)">👁️</button>
            </div>
          </div>

          <!-- Password Strength Meter -->
          <div class="strength-wrapper" id="strengthWrapper" style="display: none;">
            <div class="strength-bar-bg">
              <div class="strength-bar-fill" id="strengthBar"></div>
            </div>
            <div class="strength-text" id="strengthText"></div>
          </div>

          <!-- Confirm Password -->
          <div class="form-group">
            <label class="form-label" for="confirmPassword">Confirm New Password</label>
            <div class="input-wrapper">
              <input 
                type="password" 
                id="confirmPassword" 
                class="input-field" 
                placeholder="Re-enter your new password"
                required
                autocomplete="new-password"
              />
              <button type="button" class="toggle-password" onclick="togglePassword('confirmPassword', this)">👁️</button>
            </div>
          </div>

          <!-- Submit Button -->
          <button type="submit" id="submitBtn" class="submit-btn">
            <span id="btnText">Save & Set New Password</span>
            <div id="btnSpinner" class="spinner"></div>
          </button>
        </form>
      </div>

      <!-- Success View -->
      <div id="successView" class="success-view">
        <div class="success-icon">✓</div>
        <h2 class="success-title">Password Reset Complete!</h2>
        <p class="success-desc">
          Your password has been securely updated. All active sessions have been revoked for your safety. You can now return to the mobile app and sign in with your new password.
        </p>
        <a href="shubhausar://login" class="app-link-btn">
          <span>Open Shubh Ausar App</span>
          <span>→</span>
        </a>
      </div>
    </div>

    <div class="footer">
      🔒 Protected by Shubh Ausar 256-bit Security Infrastructure
    </div>
  </div>

  <script>
    const token = ${JSON.stringify(token)};
    const email = ${JSON.stringify(email)};
    const apiBaseUrl = ${JSON.stringify(apiBaseUrl)};

    function togglePassword(inputId, btn) {
      const input = document.getElementById(inputId);
      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
      } else {
        input.type = 'password';
        btn.textContent = '👁️';
      }
    }

    function checkPasswordStrength(password) {
      const wrapper = document.getElementById('strengthWrapper');
      const bar = document.getElementById('strengthBar');
      const text = document.getElementById('strengthText');

      if (!password) {
        wrapper.style.display = 'none';
        return;
      }
      wrapper.style.display = 'block';

      let score = 0;
      if (password.length >= 8) score++;
      if (/[A-Z]/.test(password)) score++;
      if (/[0-9]/.test(password)) score++;
      if (/[^A-Za-z0-9]/.test(password)) score++;

      const configs = [
        { percent: '25%', color: '#EF4444', text: 'Weak' },
        { percent: '50%', color: '#F59E0B', text: 'Fair' },
        { percent: '75%', color: '#3B82F6', text: 'Good' },
        { percent: '100%', color: '#10B981', text: 'Strong' }
      ];

      const config = configs[Math.max(0, score - 1)] || configs[0];
      bar.style.width = config.percent;
      bar.style.backgroundColor = config.color;
      text.textContent = 'Strength: ' + config.text;
      text.style.color = config.color;
    }

    function showAlert(msg, isError = true) {
      const box = document.getElementById('alertBox');
      box.textContent = msg;
      box.className = 'alert ' + (isError ? 'error' : 'success');
      box.scrollIntoView({ behavior: 'smooth' });
    }

    function clearAlert() {
      const box = document.getElementById('alertBox');
      box.className = 'alert';
      box.textContent = '';
    }

    async function handleResetSubmit(event) {
      event.preventDefault();
      clearAlert();

      const newPassword = document.getElementById('newPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      if (!token) {
        showAlert('Invalid or missing password reset link. Please request a new link from the mobile app.');
        return;
      }

      if (newPassword.length < 8) {
        showAlert('Password must be at least 8 characters long.');
        return;
      }

      if (newPassword !== confirmPassword) {
        showAlert('Passwords do not match. Please verify and try again.');
        return;
      }

      const submitBtn = document.getElementById('submitBtn');
      const btnText = document.getElementById('btnText');
      const btnSpinner = document.getElementById('btnSpinner');

      submitBtn.disabled = true;
      btnText.textContent = 'Updating Password...';
      btnSpinner.style.display = 'block';

      try {
        const response = await fetch(apiBaseUrl + '/auth/password/reset', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: token,
            email: email || undefined,
            newPassword: newPassword,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to reset password. Link may have expired.');
        }

        // Show Success
        document.getElementById('formView').style.display = 'none';
        document.getElementById('successView').style.display = 'block';
      } catch (err) {
        showAlert(err.message || 'Unable to reset password. Please request a new link.');
        submitBtn.disabled = false;
        btnText.textContent = 'Save & Set New Password';
        btnSpinner.style.display = 'none';
      }
    }
  </script>
</body>
</html>`;
}
