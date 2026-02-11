const storageKey = "authx.session";

const output = document.getElementById("output");
const roleNode = document.getElementById("role");
const accessTokenNode = document.getElementById("access-token");
const refreshTokenNode = document.getElementById("refresh-token");

const signupForm = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");
const adminTestBtn = document.getElementById("admin-test-btn");
const clearSessionBtn = document.getElementById("clear-session-btn");

function setOutput(text) {
    output.textContent = text;
}

function loadSession() {
    try {
        const serialized = localStorage.getItem(storageKey);
        return serialized ? JSON.parse(serialized) : null;
    } catch (error) {
        console.error(error);
        return null;
    }
}

function saveSession(session) {
    localStorage.setItem(storageKey, JSON.stringify(session));
    renderSession(session);
}

function clearSession() {
    localStorage.removeItem(storageKey);
    renderSession(null);
}

function renderSession(session) {
    roleNode.textContent = session?.role || "—";
    accessTokenNode.value = session?.accessToken || "";
    refreshTokenNode.value = session?.refreshToken || "";
}

async function postJson(url, body) {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    return {
        ok: response.ok,
        status: response.status,
        data: response.status !== 204 ? await response.json().catch(() => null) : null
    };
}

signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;

    const result = await postJson("/auth/signup", { email, password });
    if (result.status === 201) {
        setOutput("Signup successful. You can now log in.");
        signupForm.reset();
        return;
    }

    if (result.status === 409) {
        setOutput("Signup failed: email already exists.");
        return;
    }

    setOutput(`Signup failed (${result.status}).`);
});

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    const result = await postJson("/auth/login", { email, password });

    if (!result.ok || !result.data) {
        setOutput(result.status === 401
            ? "Login failed: invalid credentials."
            : `Login failed (${result.status}).`);
        return;
    }

    saveSession(result.data);
    setOutput("Login successful. Session saved locally.");
});

adminTestBtn.addEventListener("click", async () => {
    const session = loadSession();

    if (!session?.accessToken) {
        setOutput("No access token available. Please log in first.");
        return;
    }

    const response = await fetch("/auth/admin/test", {
        headers: {
            Authorization: `Bearer ${session.accessToken}`
        }
    });

    const text = await response.text();
    setOutput(`Status: ${response.status}\n${text}`);
});

clearSessionBtn.addEventListener("click", () => {
    clearSession();
    setOutput("Local session cleared.");
});

renderSession(loadSession());
