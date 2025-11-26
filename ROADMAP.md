# Roadmap: Magewell Pro Convert Decoder Integration

This document outlines the plan to integrate the Magewell Pro Convert Decoder API into the existing web application.

## API Overview

The Magewell Pro Convert Decoder API is a simple HTTP-based API that returns JSON data.

-   **Base URL:** `http://<device_ip>/mwapi`
-   **Authentication:** The API uses a simple login/logout mechanism. All API calls that require authentication must be made after a successful login.

---

## Phase 1: Authentication

The first step is to implement user authentication. This will involve creating a login form and handling the login/logout process.

### Login

-   **Method:** `GET`
-   **Endpoint:** `?method=login`
-   **Parameters:**
    -   `id`: User ID
    -   `pass`: MD5 encrypted password
-   **Success Response:** `{"status": 0}`
-   **Failure Response:** `{"status": 36}` (Incorrect credentials)

**Implementation Plan:**

1.  Add a login modal to `index.html`.
2.  The modal will be hidden by default and shown on page load if the user is not authenticated.
3.  Create a function in `script.js` to handle the login form submission.
4.  The function will take the username and password, generate the MD5 hash of the password, and send the login request.
5.  Upon successful login, store the authentication status in a session/local storage and hide the login modal.
6.  If login fails, display an error message.

### Logout

-   **Method:** `GET`
-   **Endpoint:** `?method=logout`
-   **Success Response:** `{"status": 0}`

**Implementation Plan:**

1.  Add a logout button to the `info_bar` in `index.html`.
2.  Create a function in `script.js` to handle the logout process.
3.  The function will clear the authentication status from session/local storage and show the login modal.

---

## Phase 2: Source Management

Once authentication is in place, we can fetch and display the list of available sources.

### List Channels

-   **Method:** `GET`
-   **Endpoint:** `?method=list-channels`
-   **Success Response:**
    ```json
    {
        "status": 0,
        "channels": [
            {
                "name": "Channel 1",
                "url": "rtsp://..."
            },
            {
                "name": "Channel 2",
                "url": "rtmp://..."
            }
        ]
    }
    ```

**Implementation Plan:**

1.  Create a function in `script.js` to fetch the list of channels.
2.  This function will be called after a successful login.
3.  The `source-grid` in `index.html` will be dynamically populated with the channels returned by the API.
4.  The existing `source-card` elements will be used as a template.

### Get NDI Sources

-   **Method:** `GET`
-   **Endpoint:** `?method=get-ndi-sources`

**Implementation Plan:**

1.  Similar to `list-channels`, create a function to fetch NDI sources.
2.  Add a button or a mechanism to switch between "Preset Channels" and "NDI Sources".
3.  Populate the `source-grid` with the NDI sources.

---

## Phase 3: UI/UX Enhancements

After implementing the core functionality, we can improve the user experience.

**Plan:**

1.  **Login Form:**
    -   Add a "Remember Me" option to the login form to persist the session.
    -   Provide clear feedback on login success or failure.
2.  **Source Selection:**
    -   Visually distinguish between preset channels and NDI sources.
    -   Add a "refresh" button to the source list to manually fetch the latest sources.
3.  **Status Display:**
    -   Use the API to get the device status and display more detailed information than just "Online" or "Offline".
4.  **Error Handling:**
    -   Implement global error handling for API requests.
    -   Display user-friendly error messages when an API call fails.
