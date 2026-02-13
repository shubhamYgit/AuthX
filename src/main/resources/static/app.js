
const API_BASE_URL = "";

const AuthState = {
    accessToken: localStorage.getItem('accessToken'),
    userEmail: localStorage.getItem('userEmail'),
    userRole: localStorage.getItem('userRole'),
    expiresAt: Number(localStorage.getItem('expiresAt')) || 0,
    _refreshTimer: null,
    _countdownTimer: null,

    setAuth(accessToken, expiresIn, email, role) {
        this.accessToken = accessToken;
        this.userEmail = email;
        this.userRole = role;
        this.expiresAt = Date.now() + expiresIn * 1000;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userRole', role);
        localStorage.setItem('expiresAt', String(this.expiresAt));

        this.scheduleRefresh(expiresIn);
    },

    clearAuth() {
        this.accessToken = null;
        this.userEmail = null;
        this.userRole = null;
        this.expiresAt = 0;

        localStorage.removeItem('accessToken');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
        localStorage.removeItem('expiresAt');

        clearTimeout(this._refreshTimer);
        clearInterval(this._countdownTimer);
    },

    isAuthenticated() {
        return !!this.accessToken && Date.now() < this.expiresAt;
    },

    scheduleRefresh(expiresIn) {
        clearTimeout(this._refreshTimer);
        const refreshIn = Math.max((expiresIn * 0.8) * 1000, 5000);
        this._refreshTimer = setTimeout(async () => {
            try {
                await ApiService.refreshToken();
            } catch {
            }
        }, refreshIn);
    },

    startCountdown() {
        clearInterval(this._countdownTimer);
        this._countdownTimer = setInterval(() => {
            const remaining = Math.max(0, Math.floor((this.expiresAt - Date.now()) / 1000));
            const el = document.getElementById('timer-text');
            if (el) {
                const m = String(Math.floor(remaining / 60)).padStart(2, '0');
                const s = String(remaining % 60).padStart(2, '0');
                el.textContent = `${m}:${s}`;
            }
            if (remaining <= 0) {
                clearInterval(this._countdownTimer);
            }
        }, 1000);
    },

    getRoleDisplay() {
        return (this.userRole || '').replace('ROLE_', '');
    },

    getInitials() {
        const email = this.userEmail || '';
        return email.charAt(0).toUpperCase();
    }
};

function decodeJWT(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const decode = (s) => JSON.parse(atob(s.replace(/-/g, '+').replace(/_/g, '/')));
        return { header: decode(parts[0]), payload: decode(parts[1]) };
    } catch { return null; }
}

function getPasswordStrength(pw) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
    return { score, label: labels[score] };
}

class ApiService {
    static async login(email, password) {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) {
            if (res.status === 401) throw new Error('Invalid email or password');
            throw new Error('Login failed. Please try again.');
        }
        return res.json();
    }

    static async signup(email, password) {
        const res = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) {
            if (res.status === 409) throw new Error('An account with this email already exists');
            throw new Error('Signup failed. Please try again.');
        }
        return true;
    }

    static async refreshToken() {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include'
        });
        if (!res.ok) throw new Error('Refresh failed');
        const data = await res.json();
        AuthState.setAuth(data.accessToken, data.expiresIn, AuthState.userEmail, AuthState.userRole);
        return data;
    }

    static async authenticatedRequest(url, options = {}) {
        const headers = {
            'Authorization': `Bearer ${AuthState.accessToken}`,
            ...options.headers
        };

        const res = await fetch(url, { ...options, headers, credentials: 'include' });

        if (res.status === 401) {
            try {
                await this.refreshToken();
                headers['Authorization'] = `Bearer ${AuthState.accessToken}`;
                return fetch(url, { ...options, headers, credentials: 'include' });
            } catch {
                AuthState.clearAuth();
                Router.navigate('login');
                throw new Error('Session expired. Please login again.');
            }
        }

        if (res.status === 403) {
            const text = await res.text();
            throw new Error(text || 'Access denied — insufficient permissions');
        }

        return res;
    }

    static async getUserTest() {
        const res = await this.authenticatedRequest(`${API_BASE_URL}/auth/user/test`);
        return res.text();
    }

    static async getAdminTest() {
        const res = await this.authenticatedRequest(`${API_BASE_URL}/auth/admin/test`);
        return res.text();
    }
}

class Router {
    static currentView = null;

    static navigate(view) {
        this.currentView = view;
        this.render();
    }

    static render() {
        const app = document.getElementById('app');
        app.innerHTML = '';

        if (!AuthState.isAuthenticated() && this.currentView !== 'signup') {
            this.renderLogin();
        } else if (this.currentView === 'login') {
            this.renderLogin();
        } else if (this.currentView === 'signup') {
            this.renderSignup();
        } else {
            this.renderDashboard();
        }
    }

    static renderLogin() {
        const tpl = document.getElementById('login-template');
        document.getElementById('app').appendChild(tpl.content.cloneNode(true));

        document.getElementById('login-form').addEventListener('submit', this.handleLogin);
        document.getElementById('goto-signup').addEventListener('click', (e) => {
            e.preventDefault();
            this.navigate('signup');
        });
    }

    static renderSignup() {
        const tpl = document.getElementById('signup-template');
        document.getElementById('app').appendChild(tpl.content.cloneNode(true));

        document.getElementById('signup-form').addEventListener('submit', this.handleSignup);
        document.getElementById('goto-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.navigate('login');
        });

        const pwInput = document.getElementById('signup-password');
        const strengthContainer = document.getElementById('password-strength');
        const strengthBar = document.getElementById('strength-bar');
        const strengthLabel = document.getElementById('strength-label');

        pwInput.addEventListener('input', () => {
            const val = pwInput.value;
            if (val.length === 0) {
                strengthContainer.style.display = 'none';
                return;
            }
            strengthContainer.style.display = 'flex';
            const { score, label } = getPasswordStrength(val);
            strengthBar.setAttribute('data-strength', score);
            strengthLabel.textContent = label;
        });
    }

    static renderDashboard() {
        const tpl = document.getElementById('dashboard-template');
        document.getElementById('app').appendChild(tpl.content.cloneNode(true));

        document.getElementById('user-email').textContent = AuthState.userEmail;
        document.getElementById('user-role-badge').textContent = AuthState.getRoleDisplay();
        document.getElementById('user-avatar').textContent = AuthState.getInitials();

        document.getElementById('nav-user-test').style.display = 'block';
        document.getElementById('nav-admin-test').style.display = 'block';

        AuthState.startCountdown();

        document.getElementById('logout-btn').addEventListener('click', this.handleLogout);

        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigatePage(item.getAttribute('data-page'));
            });
        });

        this.navigatePage('overview');
    }

    static navigatePage(page) {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelector(`[data-page="${page}"]`)?.classList.add('active');

        const container = document.getElementById('page-content');

        switch (page) {
            case 'overview': this.loadOverview(container); break;
            case 'user-test': this.loadUserTest(container); break;
            case 'admin-test': this.loadAdminTest(container); break;
        }
    }

    static loadOverview(container) {
        const tpl = document.getElementById('overview-page');
        container.innerHTML = '';
        container.appendChild(tpl.content.cloneNode(true));

        document.getElementById('role-display').textContent = AuthState.getRoleDisplay();
        document.getElementById('email-display').textContent = AuthState.userEmail;

        this.setupTokenViewer();
    }

    static setupTokenViewer() {
        const toggleBtn = document.getElementById('toggle-token-btn');
        const tokenDisplay = document.getElementById('token-display');
        const tokenValue = document.getElementById('token-value');
        const copyBtn = document.getElementById('copy-token-btn');
        const copySuccess = document.getElementById('copy-success');
        const decodedArea = document.getElementById('jwt-decoded');
        let isShowing = false;

        toggleBtn.addEventListener('click', () => {
            isShowing = !isShowing;
            tokenDisplay.style.display = isShowing ? 'block' : 'none';
            toggleBtn.textContent = isShowing ? 'Hide Token' : 'Show Token';

            if (isShowing) {
                tokenValue.textContent = AuthState.accessToken;

                const decoded = decodeJWT(AuthState.accessToken);
                if (decoded) {
                    decodedArea.innerHTML = `
                        <h4>Header</h4>
                        <pre>${JSON.stringify(decoded.header, null, 2)}</pre>
                        <h4>Payload</h4>
                        <pre>${JSON.stringify(decoded.payload, null, 2)}</pre>
                    `;
                }
            }
        });

        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(AuthState.accessToken);
                copySuccess.style.display = 'block';
                setTimeout(() => { copySuccess.style.display = 'none'; }, 2000);
            } catch { }
        });
    }

    static async loadUserTest(container) {
        const tpl = document.getElementById('user-test-page');
        container.innerHTML = '';
        container.appendChild(tpl.content.cloneNode(true));

        const resultEl = document.getElementById('user-test-result');
        const areaEl = document.getElementById('user-test-area');

        try {
            const result = await ApiService.getUserTest();
            areaEl.innerHTML = `
                <div class="test-icon">
                    <div class="icon-circle success-circle">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                    </div>
                </div>
                <h3>${result}</h3>
                <p>User endpoint responded successfully</p>
            `;
        } catch (err) {
            areaEl.innerHTML = `
                <div class="test-icon">
                    <div class="icon-circle error-circle">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </div>
                </div>
                <h3>Error</h3>
                <p>${err.message}</p>
            `;
        }
    }

    static async loadAdminTest(container) {
        const tpl = document.getElementById('admin-test-page');
        container.innerHTML = '';
        container.appendChild(tpl.content.cloneNode(true));

        const areaEl = document.getElementById('admin-test-area');

        try {
            const result = await ApiService.getAdminTest();
            areaEl.innerHTML = `
                <div class="test-icon">
                    <div class="icon-circle accent-circle">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                    </div>
                </div>
                <h3>${result}</h3>
                <p>Admin endpoint responded successfully</p>
            `;
        } catch (err) {
            areaEl.innerHTML = `
                <div class="test-icon">
                    <div class="icon-circle error-circle">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </div>
                </div>
                <h3>Access Denied</h3>
                <p>${err.message}</p>
            `;
        }
    }

    static async handleLogin(e) {
        e.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorDiv = document.getElementById('login-error');
        const btn = document.getElementById('login-btn');
        const btnText = btn.querySelector('.btn-text');
        const btnLoad = btn.querySelector('.btn-loader');

        errorDiv.style.display = 'none';
        btn.disabled = true;
        btnText.style.display = 'none';
        btnLoad.style.display = 'block';

        try {
            const data = await ApiService.login(email, password);
            AuthState.setAuth(data.accessToken, data.expiresIn, email, data.role);
            Router.navigate('dashboard');
        } catch (err) {
            errorDiv.textContent = err.message;
            errorDiv.style.display = 'block';
        } finally {
            btn.disabled = false;
            btnText.style.display = 'block';
            btnLoad.style.display = 'none';
        }
    }

    static async handleSignup(e) {
        e.preventDefault();

        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirm = document.getElementById('signup-password-confirm').value;
        const errorDiv = document.getElementById('signup-error');
        const successDiv = document.getElementById('signup-success');
        const btn = document.getElementById('signup-btn');
        const btnText = btn.querySelector('.btn-text');
        const btnLoad = btn.querySelector('.btn-loader');

        errorDiv.style.display = 'none';
        successDiv.style.display = 'none';

        if (password !== confirm) {
            errorDiv.textContent = 'Passwords do not match';
            errorDiv.style.display = 'block';
            return;
        }

        if (password.length < 8) {
            errorDiv.textContent = 'Password must be at least 8 characters';
            errorDiv.style.display = 'block';
            return;
        }

        btn.disabled = true;
        btnText.style.display = 'none';
        btnLoad.style.display = 'block';

        try {
            await ApiService.signup(email, password);
            successDiv.textContent = 'Account created! Redirecting to login…';
            successDiv.style.display = 'block';
            setTimeout(() => Router.navigate('login'), 2000);
        } catch (err) {
            errorDiv.textContent = err.message;
            errorDiv.style.display = 'block';
            btn.disabled = false;
            btnText.style.display = 'block';
            btnLoad.style.display = 'none';
        }
    }

    static handleLogout() {
        AuthState.clearAuth();
        Router.navigate('login');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (AuthState.accessToken && AuthState.expiresAt > Date.now()) {
        const remaining = Math.floor((AuthState.expiresAt - Date.now()) / 1000);
        AuthState.scheduleRefresh(remaining);
    }
    Router.render();
});