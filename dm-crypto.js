(function () {
    const ALG = { name: "ECDH", namedCurve: "P-256" };

    function keyStorageKey(uid) {
        return "dmPrivateKey_" + uid;
    }

    function bufToB64(buf) {
        return btoa(String.fromCharCode(...new Uint8Array(buf)));
    }

    function b64ToBuf(b64) {
        return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    }

    async function importPrivateKeyFromStorage(uid) {
        const raw = localStorage.getItem(keyStorageKey(uid));
        if (!raw) return null;
        try {
            const jwk = JSON.parse(raw);
            return await crypto.subtle.importKey("jwk", jwk, ALG, true, ["deriveKey"]);
        } catch (err) {
            console.error("Failed to import stored DM key:", err);
            return null;
        }
    }

    async function ensureKeyPair(uid) {
        const local = await importPrivateKeyFromStorage(uid);
        if (local) return local;

        const snap = await db.ref("dmKeys/" + uid + "/privateKey").once("value");
        const rawJwk = snap.val();
        if (rawJwk) {
            const jwk = JSON.parse(rawJwk);
            const privateKey = await crypto.subtle.importKey("jwk", jwk, ALG, true, ["deriveKey"]);
            localStorage.setItem(keyStorageKey(uid), rawJwk);
            return privateKey;
        }

        const keyPair = await crypto.subtle.generateKey(ALG, true, ["deriveKey"]);
        const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
        const privateJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);

        await db.ref("users/" + uid + "/publicKey").set(JSON.stringify(publicJwk));
        await db.ref("dmKeys/" + uid + "/privateKey").set(JSON.stringify(privateJwk));

        localStorage.setItem(keyStorageKey(uid), JSON.stringify(privateJwk));
        return keyPair.privateKey;
    }

    async function ensureLocalIdentity(uid) {
        await ensureKeyPair(uid);
    }

    async function getPublicKeyFor(uid) {
        const snap = await db.ref("users/" + uid + "/publicKey").once("value");
        const raw = snap.val();
        if (!raw) return null;
        const jwk = JSON.parse(raw);
        return crypto.subtle.importKey("jwk", jwk, ALG, false, []);
    }

    async function deriveSharedKey(privateKey, publicKey) {
        return crypto.subtle.deriveKey(
            { name: "ECDH", public: publicKey },
            privateKey,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"]
        );
    }

    async function encryptText(sharedKey, text) {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(text);
        const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, sharedKey, encoded);
        return { ciphertext: bufToB64(ciphertext), iv: bufToB64(iv) };
    }

    async function decryptText(sharedKey, ciphertextB64, ivB64) {
        const ciphertext = b64ToBuf(ciphertextB64);
        const iv = b64ToBuf(ivB64);
        const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, sharedKey, ciphertext);
        return new TextDecoder().decode(plainBuf);
    }

    function conversationId(uidA, uidB) {
        return [uidA, uidB].sort().join("_");
    }

    window.DMCrypto = {
        ensureLocalIdentity,
        ensureKeyPair,
        getPublicKeyFor,
        deriveSharedKey,
        encryptText,
        decryptText,
        conversationId
    };
})();
