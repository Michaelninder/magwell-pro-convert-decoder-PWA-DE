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
const loginButton = document.getElementById('login-button');
const refreshSignalInfoButton = document.getElementById('refresh-signal-info');
const videoInfoData = document.getElementById('video-info-data');
const audioInfoData = document.getElementById('audio-info-data');
const hdmiInfoData = document.getElementById('hdmi-info-data');
const sdiInfoData = document.getElementById('sdi-info-data');

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

function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function eraseCookie(name) {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

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
        const response = await fetch(`${API_baseURL}?method=login&id=${username}&pass=${hashedPassword}`, { credentials: 'include' });
        const data = await response.json();

        if (data.status === 0) {
            // The API sets a cookie on successful login. We just need to check for it.
            // We'll set our own cookie to track auth state on the client side.
            setCookie('isAuthenticated', 'true', 1);
            hideLoginModal();
            loginButton.style.display = 'none';
            logoutButton.style.display = 'block';
            checkAPIStatus();
        } else {
            loginError.textContent = `Login failed: ${API_statusCodesMap[data.status] || 'Unknown error'}`;
        }
    } catch (error) {
        console.error('Login request failed:', error);
        loginError.textContent = 'Login request failed. Check console for details.';
    }
}

async function handleLogout() {
    try {
        await fetch(`${API_baseURL}?method=logout`, { credentials: 'include' });
    } catch (error) {
        console.error('Logout request failed:', error);
    } finally {
        eraseCookie('isAuthenticated');
        eraseCookie('sid');
        showLoginModal();
        loginButton.style.display = 'block';
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
    if (getCookie('isAuthenticated') !== 'true') {
        showLoginModal();
        loginButton.style.display = 'block';
        logoutButton.style.display = 'none';
        return;
    }
    loginButton.style.display = 'none';
    logoutButton.style.display = 'block';
    try {
        const response = await fetch(`${API_baseURL}?method=ping`, { credentials: 'include' });
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

async function getSignalInfo() {
    if (getCookie('isAuthenticated') !== 'true') {
        showLoginModal();
        return;
    }
    try {
        const response = await fetch(`${API_baseURL}?method=get-signal-info`, { credentials: 'include' });
        if (response.ok) {
            const data = await response.json();
            if (data.status === 0) {
                videoInfoData.textContent = JSON.stringify(data['video-info'], null, 2);
                audioInfoData.textContent = JSON.stringify(data['audio-info'], null, 2);
                hdmiInfoData.textContent = JSON.stringify(data['hdmi-info'], null, 2);
                sdiInfoData.textContent = JSON.stringify(data['sdi-info'], null, 2);
            } else if (data.status === 37) { // MW_STATUS_NOT_LOGGED_IN
                handleLogout();
            } else {
                videoInfoData.textContent = `Error: ${API_statusCodesMap[data.status] || 'Unknown error'}`;
            }
        } else {
            videoInfoData.textContent = 'Error fetching signal info.';
        }
    } catch (error) {
        videoInfoData.textContent = 'Error fetching signal info. Check console for details.';
        console.error('Get signal info request failed:', error);
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

    if (tabId === 'signal-info-tab') {
        getSignalInfo();
    }
}

function selectSource(selectedCard) {
    sourceCards.forEach(card => card.classList.remove('selected'));
    selectedCard.classList.add('selected');
    const sourceId = selectedCard.dataset.source;
}

loginForm.addEventListener('submit', handleLogin);
loginButton.addEventListener('click', showLoginModal);
logoutButton.addEventListener('click', handleLogout);
refreshSignalInfoButton.addEventListener('click', getSignalInfo);

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
