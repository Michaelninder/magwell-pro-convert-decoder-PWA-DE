const statusDisplay = document.getElementById('status-display');
const clockDisplay = document.getElementById('clock-display');
const tabs = document.querySelectorAll('.tab');
const tabButtons = document.querySelectorAll('.tabs-navigation button');
const sourceCards = document.querySelectorAll('.source-card');
const pingButton = document.getElementById('ping-button');
const loginModal = document.getElementById('login-modal');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutButton = document.getElementById('logout-button');

const API_baseURL = "http://192.168.2.14/mwapi";
const API_statusCodesMap = {
    0: "MW_STATUS_SUCCESS",
    1: "MW_STATUS_PENDING",
    2: "MW_STATUS_TIMEOUT",
    3: "MW_STATUS_INTERRUPTED",
    4: "MW_STATUS_TRY_AGAIN",
    5: "MW_STATUS_NOT_IMPLEMENTED",
    6: "MW_STATUS_UNKNOWN_ERROR",
    7: "MW_STATUS_INVALID_ARG",
    8: "MW_STATUS_NO_MEMORY",
    9: "MW_STATUS_UNSUPPORTED",
    10: "MW_STATUS_FILE_BUSY",
    11: "MW_STATUS_DEVICE_BUSY",
    12: "MW_STATUS_DEVICE_LOST",
    13: "MW_STATUS_IO_FAILED",
    14: "MW_STATUS_READ_FAILED",
    15: "MW_STATUS_WRITE_FAILED",
    16: "MW_STATUS_NOT_EXIST",
    17: "MW_STATUS_TOO_MANY",
    18: "MW_STATUS_TOO_LARGE",
    19: "MW_STATUS_OVERFLOW",
    20: "MW_STATUS_UNDERFLOW",
    21: "MW_STATUS_FORMAT_ERROR",
    22: "MW_STATUS_FILE_EXISTS",
    23: "MW_STATUS_FILE_TYPE_ERROR",
    24: "MW_STATUS_DEVICE_TYPE_ERROR",
    25: "MW_STATUS_IS_DIRECTORY",
    26: "MW_STATUS_READ_ONLY",
    27: "MW_STATUS_RANGE_ERROR",
    28: "MW_STATUS_BROKEN_PIPE",
    29: "MW_STATUS_NO_SPACE",
    30: "MW_STATUS_NOT_DIRECTORY",
    31: "MW_STATUS_NOT_PERMITTED",
    32: "MW_STATUS_BAD_ADDRESS",
    33: "MW_STATUS_SEEK_ERROR",
    34: "MW_STATUS_CROSS_DEVICE_LINK",
    35: "MW_STATUS_NOT_INITIALIED",
    36: "MW_STATUS_AUTH_FAILED",
    37: "MW_STATUS_NOT_LOGGED_IN",
    38: "MW_STATUS_WRONG_STATE",
    39: "MW_STATUS_MISMATCH",
    40: "MW_STATUS_VERIFY_FAILED",
    41: "MW_STATUS_CONSTRAINT_VIOLATION"
};

function showLoginModal() {
    loginModal.style.display = 'block';
}

function hideLoginModal() {
    loginModal.style.display = 'none';
}

async function handleLogin(event) {
    event.preventDefault();
    const username = loginForm.username.value;
    const password = loginForm.password.value;

    if (typeof md5 !== 'function') {
        loginError.textContent = 'MD5 library not loaded.';
        return;
    }

    const hashedPassword = md5(password);
    try {
        const response = await fetch(`${API_baseURL}?method=login&id=${username}&pass=${hashedPassword}`);
        const data = await response.json();

        if (data.status === 0) {
            sessionStorage.setItem('isAuthenticated', 'true');
            hideLoginModal();
            logoutButton.style.display = 'block';
            checkAPIStatus();
        } else {
            loginError.textContent = `Login failed: ${API_statusCodesMap[data.status] || 'Unknown error'}`;
        }
    } catch (error) {
        loginError.textContent = 'Login request failed.';
    }
}

async function handleLogout() {
    try {
        await fetch(`${API_baseURL}?method=logout`);
    } catch (error) {
        console.error('Logout request failed:', error);
    } finally {
        sessionStorage.removeItem('isAuthenticated');
        showLoginModal();
        logoutButton.style.display = 'none';
        setStatus('offline');
    }
}

function setStatus(status) {
    statusDisplay.className = '';
    let text;
    switch (status) {
        case 'online':
            statusDisplay.classList.add('online');
            text = 'Online';
            break;
        case 'offline':
            statusDisplay.classList.add('offline');
            text = 'Offline';
            break;
        default:
            statusDisplay.classList.add('unknown');
            text = 'Unbekannt';
    }
    statusDisplay.textContent = text;
}

async function checkAPIStatus() {
    if (sessionStorage.getItem('isAuthenticated') !== 'true') {
        showLoginModal();
        return;
    }
    try {
        const response = await fetch(`${API_baseURL}?method=ping`);
        if (response.ok) {
            const data = await response.json();
            if (data.status === 37) { // MW_STATUS_NOT_LOGGED_IN
                handleLogout();
            } else {
                setStatus('online');
            }
        } else {
            setStatus('offline');
        }
    } catch (error) {
        setStatus('offline');
    }
}

function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    clockDisplay.textContent = `${hours}:${minutes}:${seconds}`;
}

function showTab(tabId) {
    tabs.forEach(tab => tab.classList.remove('shown'));
    tabButtons.forEach(button => button.classList.remove('active'));

    const activeTab = document.getElementById(tabId);
    const activeButton = document.querySelector(`.tabs-navigation button[data-tab="${tabId}"]`);

    if (activeTab) {
        activeTab.classList.add('shown');
    }
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

function selectSource(selectedCard) {
    sourceCards.forEach(card => card.classList.remove('selected'));
    selectedCard.classList.add('selected');
    const sourceId = selectedCard.dataset.source;
}

loginForm.addEventListener('submit', handleLogin);
logoutButton.addEventListener('click', handleLogout);

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        showTab(button.dataset.tab);
    });
});

sourceCards.forEach(card => {
    card.addEventListener('click', () => {
        selectSource(card);
    });
});

pingButton.addEventListener('click', checkAPIStatus);

setInterval(updateClock, 1000);
updateClock();
checkAPIStatus();

showTab('signal-info-tab');
