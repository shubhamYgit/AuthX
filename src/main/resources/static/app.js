// Configuration
const API_BASE_URL = 'http://localhost:8080';

// Auth State Management
const AuthState = {
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
    userEmail: localStorage.getItem('userEmail'),
    userRole: localStorage.getItem('userRole'),

    setAuth(accessToken, refreshToken, email, role) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.userEmail = email;
        this.userRole = role;

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userRole', role);
    },

    clearAuth() {
        this.accessToken = null;
        this.refreshToken = null;
        this.userEmail = null;
        this.userRole = null;

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
    },

    isAuthenticated() {
        return !!this.accessToken;
    },

    hasRole(role) {
        return this.userRole === role;
    }
};

// API Service
class ApiService {
    static async login(email, password) {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Invalid email or password');
            }
            throw new Error('Login failed. Please try again.');
        }

        return await response.json();
    }

    static async signup(email, password) {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            if (response.status === 409) {
                throw new Error('An account with this email already exists');
            }
            throw new Error('Signup failed. Please try again.');
        }

        return true;
    }

    static async makeAuthenticatedRequest(url, options = {}) {
        const headers = {
            'Authorization': `Bearer ${AuthState.accessToken}`,
            ...options.headers
        };

        console.log('Making authenticated request to:', url);
        console.log('Token:', AuthState.accessToken?.substring(0, 20) + '...');
        console.log('User Role:', AuthState.userRole);

        const response = await fetch(url, {
            ...options,
            headers
        });

        console.log('Response Status:', response.status);

        if (response.status === 401) {
            // Token invalid or expired - logout
            console.log('Authentication failed (401) - logging out');
            AuthState.clearAuth();
            Router.navigate('login');
            throw new Error('Session expired. Please login again.');
        }

        if (response.status === 403) {
            // User is authenticated but not authorized for this resource
            console.log('Authorization failed (403) - user does not have permission');
            const text = await response.text();
            throw new Error(`Access Denied: ${text || 'You do not have permission to access this resource.'}`);
        }

        return response;
    }

    static async getUserTest() {
        const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/auth/user/test`);
        return await response.text();
    }

    static async getAdminTest() {
        const response = await this.makeAuthenticatedRequest(`${API_BASE_URL}/auth/admin/test`);
        return await response.text();
    }
}

// Router
class Router {
    static currentView = null;

    static navigate(view) {
        this.currentView = view;
        this.render();
    }

    static render() {
        const app = document.getElementById('app');
        app.innerHTML = '';

        // Check authentication
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
        const template = document.getElementById('login-template');
        const clone = template.content.cloneNode(true);
        document.getElementById('app').appendChild(clone);

        // Event listeners
        document.getElementById('login-form').addEventListener('submit', this.handleLogin);
        document.getElementById('goto-signup').addEventListener('click', (e) => {
            e.preventDefault();
            this.navigate('signup');
        });
    }

    static renderSignup() {
        const template = document.getElementById('signup-template');
        const clone = template.content.cloneNode(true);
        document.getElementById('app').appendChild(clone);

        // Event listeners
        document.getElementById('signup-form').addEventListener('submit', this.handleSignup);
        document.getElementById('goto-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.navigate('login');
        });
    }

    static renderDashboard() {
        const template = document.getElementById('dashboard-template');
        const clone = template.content.cloneNode(true);
        document.getElementById('app').appendChild(clone);

        // Set user info
        document.getElementById('user-email').textContent = AuthState.userEmail;
        document.getElementById('user-role-badge').textContent = AuthState.userRole;

        // Make all tests available for all roles
        document.getElementById('nav-user-test').style.display = 'block';
        document.getElementById('nav-admin-test').style.display = 'block';

        // Event listeners
        document.getElementById('logout-btn').addEventListener('click', this.handleLogout);

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.getAttribute('data-page');
                this.navigatePage(page);
            });
        });

        // Load default page
        this.navigatePage('overview');
    }

    static navigatePage(page) {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`)?.classList.add('active');

        // Load page content
        const pageContent = document.getElementById('page-content');

        switch(page) {
            case 'overview':
                this.loadOverviewPage(pageContent);
                break;
            case 'user-test':
                this.loadUserTestPage(pageContent);
                break;
            case 'admin-test':
                this.loadAdminTestPage(pageContent);
                break;
        }
    }

    static loadOverviewPage(container) {
        const template = document.getElementById('overview-page');
        container.innerHTML = '';
        const clone = template.content.cloneNode(true);
        container.appendChild(clone);

        // Set dynamic content
        document.getElementById('role-display').textContent = AuthState.userRole.replace('ROLE_', '');
        document.getElementById('email-display').textContent = AuthState.userEmail;

        // Token viewer functionality
        this.setupTokenViewer();
    }

    static setupTokenViewer() {
        const toggleBtn = document.getElementById('toggle-token-btn');
        const copyBtn = document.getElementById('copy-token-btn');
        const tokenDisplay = document.getElementById('token-display');
        const tokenValue = document.getElementById('token-value');
        const copySuccess = document.getElementById('copy-success');
        let isShowing = false;

        // Toggle token visibility
        toggleBtn.addEventListener('click', () => {
            isShowing = !isShowing;
            tokenDisplay.style.display = isShowing ? 'block' : 'none';
            toggleBtn.textContent = isShowing ? 'Hide Token' : 'Show Token';

            if (isShowing) {
                tokenValue.textContent = AuthState.accessToken;
                // Also display decoded token payload
                const payload = this.decodeJWT(AuthState.accessToken);
                if (payload) {
                    console.log('JWT Payload:', payload);
                    console.log('Roles in token:', payload.authorities || payload.roles);
                }
            }
        });

        // Copy token to clipboard
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(AuthState.accessToken);
                copySuccess.style.display = 'block';
                setTimeout(() => {
                    copySuccess.style.display = 'none';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy token:', err);
            }
        });
    }

    static decodeJWT(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;

            const payload = parts[1];
            const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
            return JSON.parse(decoded);
        } catch (error) {
            console.error('Failed to decode JWT:', error);
            return null;
        }
    }

    static async loadUserTestPage(container) {
        const template = document.getElementById('user-test-page');
        container.innerHTML = '';
        const clone = template.content.cloneNode(true);
        container.appendChild(clone);

        try {
            const result = await ApiService.getUserTest();
            document.getElementById('user-test-result').textContent = result;
        } catch (error) {
            document.getElementById('user-test-result').textContent = 'Error: ' + error.message;
        }
    }

    static async loadAdminTestPage(container) {
        const template = document.getElementById('admin-test-page');
        container.innerHTML = '';
        const clone = template.content.cloneNode(true);
        container.appendChild(clone);

        try {
            const result = await ApiService.getAdminTest();
            document.getElementById('admin-test-result').textContent = result;
        } catch (error) {
            console.error('Admin test error:', error);
            document.getElementById('admin-test-result').textContent = 'Error: ' + error.message;
        }
    }

    static async handleLogin(e) {
        e.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const errorDiv = document.getElementById('login-error');
        const submitBtn = document.getElementById('login-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');

        // Hide previous errors
        errorDiv.style.display = 'none';

        // Show loading state
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'block';

        try {
            const response = await ApiService.login(email, password);

            // Store auth data
            AuthState.setAuth(
                response.accessToken,
                response.refreshToken,
                email,
                response.role
            );

            // Navigate to dashboard
            Router.navigate('dashboard');
        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
        } finally {
            submitBtn.disabled = false;
            btnText.style.display = 'block';
            btnLoader.style.display = 'none';
        }
    }

    static async handleSignup(e) {
        e.preventDefault();

        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const passwordConfirm = document.getElementById('signup-password-confirm').value;
        const errorDiv = document.getElementById('signup-error');
        const successDiv = document.getElementById('signup-success');
        const submitBtn = document.getElementById('signup-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');

        // Hide previous messages
        errorDiv.style.display = 'none';
        successDiv.style.display = 'none';

        // Validate passwords match
        if (password !== passwordConfirm) {
            errorDiv.textContent = 'Passwords do not match';
            errorDiv.style.display = 'block';
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'block';

        try {
            await ApiService.signup(email, password);

            // Show success message
            successDiv.textContent = 'Account created successfully! Redirecting to login...';
            successDiv.style.display = 'block';

            // Redirect to login after 2 seconds
            setTimeout(() => {
                Router.navigate('login');
            }, 2000);
        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
            submitBtn.disabled = false;
            btnText.style.display = 'block';
            btnLoader.style.display = 'none';
        }
    }

    static handleLogout() {
        AuthState.clearAuth();
        Router.navigate('login');
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    Router.render();
});