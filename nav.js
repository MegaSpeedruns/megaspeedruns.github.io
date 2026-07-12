(function () {
    function setMessagesVisible(visible) {
        const messagesItem = document.getElementById("messages-nav-item");
        if (messagesItem) messagesItem.style.display = visible ? "" : "none";
    }

    function setLoggedIn(loginEl) {
        loginEl.textContent = "Profile";
        loginEl.href = "Profile.html";
        setMessagesVisible(true);
    }

    function setLoggedOut(loginEl) {
        loginEl.textContent = "Login";
        loginEl.href = "Login.html";
        setMessagesVisible(false);
    }

    function applyLoginState() {
        const loginEl = document.getElementById("login");
        if (!loginEl) return;

        if (localStorage.getItem("username")) {
            setLoggedIn(loginEl);
        } else {
            setLoggedOut(loginEl);
        }

        if (typeof auth === "undefined" || typeof db === "undefined") return;

        auth.onAuthStateChanged(async (user) => {
            if (!user) {
                setLoggedOut(loginEl);
                localStorage.removeItem("username");
                return;
            }
            try {
                const snapshot = await db.ref("users/" + user.uid).once("value");
                const username = snapshot.val()?.username;
                if (username) localStorage.setItem("username", username);
                setLoggedIn(loginEl);
            } catch (err) {
                console.error("Failed to fetch username:", err);
                setLoggedOut(loginEl);
            }

            if (window.DMCrypto) {
                try {
                    await window.DMCrypto.ensureLocalIdentity(user.uid);
                } catch (err) {
                    console.error("Failed to set up messaging identity:", err);
                }
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", applyLoginState);
    } else {
        applyLoginState();
    }
})();
