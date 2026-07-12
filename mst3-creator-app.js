(function () {
    if (window.initMST3App) return;

    const NSF_CATEGORIES = ["Boss","Misc","MiscCat","MM&B","MM1","MM2","MM3","MM4","MM5","MM6","MM7","MM8","MM9","MM10","MM11","MMGB","MMWW","MMX","MMZX","Other"];
    const WEEK_NAMES = { 1: "Journey", 2: "Target", 3: "Food", 4: "World Tour", 5: "Fish", 6: "Indie", 7: "Hoot Hoot", 8: "Dejavu", 9: "Hazard", 10: "No Mercy" };

    let currentUID = null;
    let hasAccess = false;
    let musicFiles = [];
    let userColorCache = {};

    let uploadBtn = null;
    let uploadStatus = null;
    let musicInput = null;
    let musicList = null;

    const APP_CSS = `
    #mst3-app {
        --disabled-opacity: 1.0;
        --panel-alpha: 1.0;
        --input-border-alpha: 0.2;
        --input-bg-alpha: 0.06;
        --focus-shadow-alpha: 1.0;
        --card-alpha: 1.0;
        --level-item-alpha: 0.05;
        --pill-alpha: 0.25;
        --danger-bg-alpha: 0.25;
        --danger-border-alpha: 0.5;
        --danger-hover-alpha: 0.4;
        --file-btn-alpha: 0.25;
        --file-btn-hover-alpha: 0.4;
        --accent-bg-alpha: 0.25;
        --accent-border-alpha: 0.5;
        --accent-hover-alpha: 0.4;
        width: 1100px;
        margin: 20px auto;
        padding: 0;
        box-sizing: border-box;
    }
    .mst3-layout {
        display: flex;
        gap: 20px;
        align-items: flex-start;
    }
    .mst3-sidebar {
        flex: 0 0 220px;
        display: flex;
        flex-direction: column;
        gap: 0;
        background-color: #0f172a;
        border: 1px solid #334155;
        border-radius: 14px;
        overflow: hidden;
        padding: 0;
    }
    .mst3-nav-btn {
        background-color: #1e293b;
        color: #f1f5f9;
        border: none;
        border-bottom: 1px solid #334155;
        text-align: left;
        padding: 12px 16px;
        border-radius: 0;
        cursor: pointer;
        font-size: 0.95em;
        font-weight: 500;
        transition: all 0.2s ease;
    }
    .mst3-nav-btn:last-child { border-bottom: none; }
    .mst3-nav-btn:hover {
        background-color: #2563eb;
        color: #fff;
        box-shadow: inset 0 0 10px rgba(96, 165, 250, 0.3);
    }
    .mst3-nav-divider {
        border-top: 1px solid #334155;
        margin: 0;
    }
    .mst3-content {
        flex: 1;
        background-color: rgba(10, 16, 29, var(--panel-alpha));
        border: 1px solid #334155;
        border-radius: 14px;
        padding: 16px;
        min-height: 300px;
    }
    .mst3-section { display: none; }
    .mst3-section.active { display: block; }
    .mst3-content h2 { margin-bottom: 16px; }
    #upload-form {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
        margin: 0;
        padding: 0;
        background: none;
        border: none;
        border-radius: 0;
        text-align: left;
    }
    #upload-form label {
        margin-left: 0;
        margin-bottom: -6px;
        font-size: 0.95em;
    }
    #upload-form input,
    #upload-form select,
    #upload-form textarea {
        width: 100%;
        padding: 10px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, var(--input-border-alpha));
        background-color: rgba(255, 255, 255, var(--input-bg-alpha));
        color: #fff;
        font-size: 1em;
        outline: none;
        transition: border 0.2s ease, box-shadow 0.2s ease;
        box-sizing: border-box;
    }
    #upload-form input[type="file"] { padding: 8px; }
    #upload-form input[type="file"]::file-selector-button,
    #upload-form input[type="file"]::-webkit-file-upload-button {
        background-color: rgba(37, 99, 235, var(--file-btn-alpha));
        color: #fff;
        border: none;
        border-radius: 6px;
        padding: 8px 14px;
        margin-right: 10px;
        font-family: inherit;
        font-size: 0.9em;
        cursor: pointer;
        transition: background-color 0.2s ease;
    }
    #upload-form input[type="file"]::file-selector-button:hover,
    #upload-form input[type="file"]::-webkit-file-upload-button:hover {
        background-color: rgba(37, 99, 235, var(--file-btn-hover-alpha));
    }
    #upload-form input:focus,
    #upload-form select:focus,
    #upload-form textarea:focus {
        border-color: #2563eb;
        box-shadow: 0 0 6px rgba(37, 99, 235, var(--focus-shadow-alpha));
    }
    #upload-form textarea {
        resize: vertical;
        min-height: 90px;
    }
    #upload-form select option { background-color: #222; }
    .field-hint {
        font-size: 0.8em;
        color: #aaa;
        margin-top: -8px;
    }
    #upload-btn {
        margin-top: 6px;
        padding: 12px;
        border: none;
        border-radius: 8px;
        background-color: #2563eb;
        color: #fff;
        font-weight: bold;
        cursor: pointer;
        transition: background-color 0.25s ease;
    }
    #upload-btn:hover { background-color: #1e3a8a; }
    #upload-btn:disabled { opacity: var(--disabled-opacity); cursor: default; }
    #upload-status {
        min-height: 1.2em;
        font-size: 0.95em;
    }
    .week-empty { color: #bbb; font-style: italic; }
    .level-item {
        background-color: rgba(255, 255, 255, var(--level-item-alpha));
        border-radius: 10px;
        padding: 12px 14px;
        margin-bottom: 10px;
    }
    .level-item-body {
        display: flex;
        gap: 12px;
        align-items: flex-start;
    }
    .level-thumb {
        width: 120px;
        height: 105px;
        object-fit: cover;
        border-radius: 5px;
        flex-shrink: 0;
    }
    .level-item-info { flex: 1; min-width: 0; }
    .level-item .title-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
    }
    .level-item .title-row strong { font-size: 1.05em; }
    .status-col {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 6px;
    }
    .status-pill {
        font-size: 0.8em;
        padding: 3px 10px;
        border-radius: 999px;
        white-space: nowrap;
    }
    .status-testbuild { background-color: rgba(255, 193, 7, var(--pill-alpha)); color: #ffd873; }
    .status-unfinished { background-color: rgba(255, 112, 67, var(--pill-alpha)); color: #ffab91; }
    .status-finished { background-color: rgba(76, 175, 80, var(--pill-alpha)); color: #8de892; }
    .level-item p {
        margin: 6px 0 0;
        color: #ddd;
        font-size: 0.9em;
    }
    .level-item .level-links a { margin-right: 10px; }
    .remove-btn {
        background-color: rgba(148, 163, 184, var(--danger-bg-alpha));
        color: #cbd5e1;
        border: 1px solid rgba(148, 163, 184, var(--danger-border-alpha));
        border-radius: 999px;
        padding: 4px 10px;
        cursor: pointer;
        font-size: 0.85em;
        transition: background-color 0.2s ease;
    }
    .remove-btn:hover { background-color: rgba(148, 163, 184, var(--danger-hover-alpha)); }
    .zip-btn {
        display: inline-block;
        background-color: rgba(91, 110, 225, var(--accent-bg-alpha));
        color: #b7c2ff;
        border: 1px solid rgba(91, 110, 225, var(--accent-border-alpha));
        border-radius: 6px;
        padding: 4px 10px;
        cursor: pointer;
        font-size: 0.85em;
        text-decoration: none;
        transition: background-color 0.2s ease;
    }
    .zip-btn:hover {
        background-color: rgba(91, 110, 225, var(--accent-hover-alpha));
        color: #f97316;
        text-decoration: underline;
    }
    .zip-btn:disabled { opacity: var(--disabled-opacity); cursor: default; }
    .music-file-row {
        display: flex;
        align-items: center;
        gap: 8px;
        background-color: rgba(255, 255, 255, var(--card-alpha));
        border-radius: 8px;
        padding: 8px 10px;
        margin-top: 6px;
    }
    .music-file-row .music-file-name {
        flex: 1;
        font-size: 0.9em;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .music-file-row select {
        width: auto;
        flex: 0 0 130px;
        padding: 6px;
        font-size: 0.9em;
    }
    .music-file-row .remove-btn { flex: 0 0 auto; }
    .title-row .remove-btn {
        padding: 0;
        width: 22px;
        height: 22px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        font-size: 1em;
    }
    #music-files-list:empty { display: none; }
    .comment-btn {
        display: inline-block;
        background-color: rgba(91, 110, 225, var(--accent-bg-alpha));
        color: #b7c2ff;
        border: 1px solid rgba(91, 110, 225, var(--accent-border-alpha));
        border-radius: 6px;
        padding: 4px 10px;
        cursor: pointer;
        font-size: 0.85em;
        transition: background-color 0.2s ease;
    }
    .comment-btn:hover { background-color: rgba(91, 110, 225, var(--accent-hover-alpha)); }
    .comments-section {
        display: none;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    .comments-section.expanded { display: block; }
    .comments-list { margin-bottom: 10px; }
    .comment-item {
        background-color: rgba(255, 255, 255, 0.04);
        border-radius: 8px;
        padding: 8px 10px;
        margin-bottom: 8px;
    }
    .comment-item .comment-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        font-size: 0.8em;
        color: #aaa;
        margin-bottom: 4px;
    }
    .comment-item .comment-who { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .comment-item .comment-author { color: #b7c2ff; font-weight: 600; }
    .comment-item .comment-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
    .comment-item .comment-version {
        font-size: 0.78em;
        color: #999;
        background-color: rgba(255, 255, 255, 0.08);
        border-radius: 999px;
        padding: 1px 8px;
        white-space: nowrap;
    }
    .comment-item .comment-right .remove-btn {
        padding: 0;
        width: 18px;
        height: 18px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        font-size: 0.9em;
    }
    .comment-item .comment-body { color: #ddd; font-size: 0.9em; white-space: pre-wrap; }
    .comments-empty { color: #bbb; font-style: italic; font-size: 0.9em; }
    .comment-form { display: flex; gap: 8px; align-items: flex-start; }
    .comment-form textarea {
        flex: 1;
        min-height: 50px;
        padding: 8px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, var(--input-border-alpha));
        background-color: rgba(255, 255, 255, var(--input-bg-alpha));
        color: #fff;
        font-family: inherit;
        font-size: 0.9em;
        resize: vertical;
        box-sizing: border-box;
    }
    .comment-form button {
        flex: 0 0 auto;
        padding: 8px 14px;
        border: none;
        border-radius: 8px;
        background-color: #2563eb;
        color: #fff;
        font-weight: bold;
        cursor: pointer;
        transition: background-color 0.25s ease;
    }
    .comment-form button:hover { background-color: #1e3a8a; }
    .comment-form button:disabled { opacity: var(--disabled-opacity); cursor: default; }
    @media (max-width: 720px) {
        .mst3-layout { flex-direction: column; }
        .mst3-sidebar { flex-direction: row; flex-wrap: wrap; flex: 1; }
    }`;

    function injectStyles() {
        if (document.getElementById("mst3-app-style")) return;
        const style = document.createElement("style");
        style.id = "mst3-app-style";
        style.textContent = APP_CSS;
        document.head.appendChild(style);
    }

    function buildAppTemplate() {
        let sidebarBtns = "";
        let weekOptions = "";
        let weekSections = "";
        for (let w = 1; w <= 10; w++) {
            const label = "Week " + w + " - " + WEEK_NAMES[w];
            sidebarBtns += '<button type="button" class="mst3-nav-btn" data-section="week-' + w + '">' + label + '</button>';
            weekOptions += '<option value="' + w + '">' + label + '</option>';
            weekSections += '<section id="section-week-' + w + '" class="mst3-section"><h2>' + label + '</h2><div class="week-list" id="week-list-' + w + '"></div></section>';
        }
        return '<div class="mst3-layout">'
            + '<aside class="mst3-sidebar" id="mst3-sidebar">'
            + '<button type="button" class="mst3-nav-btn active" data-section="upload">Upload a Level</button>'
            + '<div class="mst3-nav-divider"></div>'
            + sidebarBtns
            + '</aside>'
            + '<div class="mst3-content">'
            + '<section id="section-upload" class="mst3-section active">'
            + '<form id="upload-form">'
            + '<label for="level-title">Level Title</label>'
            + '<input type="text" id="level-title" placeholder="e.g. Frantic Fuse Fortress">'
            + '<p class="field-hint">Leave empty to auto-fill from your .mmlv file name. Uploading with a title you\'ve already used replaces it with a new version.</p>'
            + '<label for="level-thumbnail">Thumbnail (optional)</label>'
            + '<input type="file" id="level-thumbnail" accept="image/*">'
            + '<p class="field-hint">Leave empty when re-uploading to keep the existing thumbnail.</p>'
            + '<label for="level-week">Week</label>'
            + '<select id="level-week">' + weekOptions + '</select>'
            + '<label for="level-status">Status</label>'
            + '<select id="level-status">'
            + '<option value="Unfinished / Test Build">Unfinished / Test Build</option>'
            + '<option value="Full Level">Full Level</option>'
            + '</select>'
            + '<label for="level-notes">Notes (optional)</label>'
            + '<textarea id="level-notes" placeholder="Anything testers/players should know."></textarea>'
            + '<label for="level-main-file">Level File (.mmlv, required)</label>'
            + '<input type="file" id="level-main-file" accept=".mmlv">'
            + '<label for="music-file-input">Music Files (.nsf, optional)</label>'
            + '<input type="file" id="music-file-input" accept=".nsf" multiple>'
            + '<div id="music-files-list"></div>'
            + '<p class="field-hint">Pick a folder after a NSF file is added. Leave this empty when re-uploading to keep your existing NSFs — adding files here replaces your previous set.</p>'
            + '<button type="button" id="upload-btn">Submit Level</button>'
            + '<p id="upload-status"></p>'
            + '</form>'
            + '</section>'
            + weekSections
            + '</div>'
            + '</div>';
    }

    function destroyApp() {
        const el = document.getElementById("mst3-app");
        if (el) el.remove();
        const style = document.getElementById("mst3-app-style");
        if (style) style.remove();
        uploadBtn = uploadStatus = musicInput = musicList = null;
        musicFiles = [];
    }

    function buildApp() {
        if (document.getElementById("mst3-app")) return;

        injectStyles();

        const appEl = document.createElement("div");
        appEl.id = "mst3-app";
        appEl.innerHTML = buildAppTemplate();
        const pageFooter = document.querySelector("footer");
        if (pageFooter) {
            document.body.insertBefore(appEl, pageFooter);
        } else {
            document.body.appendChild(appEl);
        }

        const sidebar = appEl.querySelector("#mst3-sidebar");
        sidebar.addEventListener("click", (e) => {
            const btn = e.target.closest(".mst3-nav-btn");
            if (!btn) return;
            const section = btn.getAttribute("data-section");
            sidebar.querySelectorAll(".mst3-nav-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            appEl.querySelectorAll(".mst3-section").forEach(s => s.classList.remove("active"));
            const target = appEl.querySelector(section === "upload" ? "#section-upload" : "#section-" + section);
            if (target) target.classList.add("active");
        });

        uploadBtn = appEl.querySelector("#upload-btn");
        uploadStatus = appEl.querySelector("#upload-status");
        musicInput = appEl.querySelector("#music-file-input");
        musicList = appEl.querySelector("#music-files-list");

        musicInput.addEventListener("change", () => {
            const files = Array.from(musicInput.files || []);
            if (files.some(f => !isNSF(f))) {
                uploadStatus.textContent = "Music files must be .nsf files (skipped invalid ones).";
            }
            files.filter(isNSF).forEach(f => musicFiles.push({ file: f, category: "Other" }));
            musicInput.value = "";
            renderMusicList();
        });

        appEl.querySelector("#level-main-file").addEventListener("change", (e) => {
            const titleInput = appEl.querySelector("#level-title");
            const file = e.target.files[0];
            if (file && !titleInput.value.trim()) {
                titleInput.value = file.name.replace(/\.mmlv$/i, "");
            }
        });

        uploadBtn.addEventListener("click", onUploadClick);
    }

    function slugify(str) {
        return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    }

    function isNSF(file) { return !!file && file.name.toLowerCase().endsWith(".nsf"); }
    function isMMLV(file) { return !!file && file.name.toLowerCase().endsWith(".mmlv"); }

    function titleCase(str) {
        return (str || "").replace(/[A-Za-z0-9']+/g, w => w.charAt(0).toUpperCase() + w.slice(1));
    }

    function sanitizeFileName(name) {
        return (name || "").replace(/[<>:"/\\|?*\x00-\x1F]/g, "").trim();
    }

    function formatDate(ts) {
        return new Date(ts).toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    }

    async function getUserColor(uid) {
        if (!uid) return "#b7c2ff";
        if (userColorCache[uid]) return userColorCache[uid];
        try {
            const snap = await db.ref("users/" + uid + "/usernameColor").once("value");
            const val = snap.val();
            const color = val ? (val.startsWith("#") ? val : "#" + val) : "#b7c2ff";
            userColorCache[uid] = color;
            return color;
        } catch (err) {
            console.error("Failed to load username color:", err);
            return "#b7c2ff";
        }
    }

    function renderMusicList() {
        if (!musicList) return;
        musicList.innerHTML = "";
        musicFiles.forEach((entry, idx) => {
            const row = document.createElement("div");
            row.className = "music-file-row";

            const name = document.createElement("span");
            name.className = "music-file-name";
            name.textContent = entry.file.name;

            const select = document.createElement("select");
            NSF_CATEGORIES.forEach(cat => {
                const opt = document.createElement("option");
                opt.value = cat;
                opt.textContent = cat;
                if (cat === entry.category) opt.selected = true;
                select.appendChild(opt);
            });
            select.addEventListener("change", () => { musicFiles[idx].category = select.value; });

            const removeBtn = document.createElement("button");
            removeBtn.type = "button";
            removeBtn.className = "remove-btn";
            removeBtn.textContent = "Remove";
            removeBtn.addEventListener("click", () => {
                musicFiles.splice(idx, 1);
                renderMusicList();
            });

            row.appendChild(name);
            row.appendChild(select);
            row.appendChild(removeBtn);
            musicList.appendChild(row);
        });
    }

    async function downloadMainFile(lvl, btn) {
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = "Downloading...";
        try {
            const res = await fetch(lvl.mainFileURL);
            if (!res.ok) throw new Error("Failed to fetch level file");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = sanitizeFileName(titleCase(lvl.title)) + ".mmlv";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Failed to download level file:", err);
            alert("Couldn't download the level. Please try again.");
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }

    function renderLevels(data) {
        for (let w = 1; w <= 10; w++) document.getElementById("week-list-" + w).innerHTML = "";

        const levels = Object.entries(data || {}).map(([key, val]) => ({ key, ...val }));
        levels.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

        const byWeek = {};
        levels.forEach(lvl => {
            byWeek[lvl.week] = byWeek[lvl.week] || [];
            byWeek[lvl.week].push(lvl);
        });

        for (let w = 1; w <= 10; w++) {
            const list = document.getElementById("week-list-" + w);
            const weekLevels = byWeek[w] || [];
            if (weekLevels.length === 0) {
                list.innerHTML = "<p class='week-empty'>No levels uploaded for this week yet.</p>";
                continue;
            }
            weekLevels.forEach(lvl => {
                const item = document.createElement("div");
                item.className = "level-item";
                const pillClass = lvl.status === "Full Level" ? "status-finished" : "status-testbuild";
                const hasMusic = (lvl.musicFiles || []).length > 0;
                const modified = lvl.updatedAt ? formatDate(lvl.updatedAt) : "Unknown";
                const displayTitle = titleCase(lvl.title);
                item.innerHTML = `<div class="level-item-body"><img class="level-thumb" src="${lvl.thumbnailURL || "Mega%20Speedruns_files/placeholder.png"}" alt="${displayTitle}" onerror="this.src='Mega%20Speedruns_files/placeholder.png'"><div class="level-item-info"><div class="title-row"><strong>${displayTitle}</strong><div class="status-col"><span class="status-pill ${pillClass}">${lvl.status || "Test Build"}</span></div></div><p>Creator: ${lvl.uploadedBy || "Unknown"} &nbsp;|&nbsp; Version ${lvl.version || 1} &nbsp;|&nbsp; Last modified: ${modified}</p>${lvl.notes ? `<p>${lvl.notes}</p>` : ""}
                            <p class="level-links">${lvl.mainFileURL ? `<button type="button" class="zip-btn download-main-btn">Download Level</button>` : ""} ${hasMusic ? `<button type="button" class="zip-btn" data-zip-title="${displayTitle.replace(/"/g, "&quot;")}">Download NSFs</button>` : ""} <button type="button" class="comment-btn">Comments</button></p></div></div>
                            <div class="comments-section"><div class="comments-list"></div><div class="comment-form"><textarea class="comment-input" placeholder="Add a comment..."></textarea><button type="button" class="comment-submit-btn">Post</button></div></div>`;

                if (lvl.mainFileURL) {
                    const downloadBtn = item.querySelector("button.download-main-btn");
                    downloadBtn.addEventListener("click", () => downloadMainFile(lvl, downloadBtn));
                }

                if (hasMusic) {
                    const zipBtn = item.querySelector("button.zip-btn:not(.download-main-btn)");
                    zipBtn.addEventListener("click", () => buildMusicZip(lvl, zipBtn));
                }

                const commentBtn = item.querySelector(".comment-btn");
                const commentsSection = item.querySelector(".comments-section");
                const commentsList = commentsSection.querySelector(".comments-list");
                const commentInput = commentsSection.querySelector(".comment-input");
                const commentSubmitBtn = commentsSection.querySelector(".comment-submit-btn");
                let commentsCache = null;
                let commentsPromise = null;
                let commentsRendered = false;

                function updateCommentCount() {
                    commentBtn.textContent = "Comments (" + (commentsCache ? commentsCache.length : 0) + ")";
                }

                function ensureCommentsLoaded() {
                    if (!commentsPromise) {
                        commentsPromise = fetchComments(lvl).then(list => {
                            commentsCache = list;
                            updateCommentCount();
                            return list;
                        });
                    }
                    return commentsPromise;
                }

                function onCommentDeleted(key) {
                    if (commentsCache) commentsCache = commentsCache.filter(c => c.key !== key);
                    updateCommentCount();
                }

                function onCommentPosted(comment) {
                    if (commentsCache) commentsCache.push(comment);
                    updateCommentCount();
                }

                commentBtn.textContent = "Comments (…)";
                ensureCommentsLoaded();

                commentBtn.addEventListener("click", async () => {
                    const expanded = commentsSection.classList.toggle("expanded");
                    if (expanded && !commentsRendered) {
                        commentsRendered = true;
                        commentsList.innerHTML = "<p class='comments-empty'>Loading comments...</p>";
                        const list = await ensureCommentsLoaded();
                        renderCommentList(commentsList, list, lvl, onCommentDeleted);
                    }
                });

                commentSubmitBtn.addEventListener("click", () => postComment(lvl, commentInput, commentsList, commentSubmitBtn, onCommentDeleted, onCommentPosted));

                if (currentUID && lvl.uploadedByUID === currentUID) {
                    const removeBtn = document.createElement("button");
                    removeBtn.type = "button";
                    removeBtn.className = "remove-btn";
                    removeBtn.textContent = "×";
                    removeBtn.title = "Remove level";
                    removeBtn.addEventListener("click", async () => {
                        if (!confirm(`Remove "${displayTitle}"? This can't be undone.`)) return;
                        removeBtn.disabled = true;
                        removeBtn.textContent = "…";
                        try {
                            await db.ref("mst3Levels/" + lvl.key).remove();
                            const urls = [lvl.mainFileURL, lvl.thumbnailURL, ...(lvl.musicFiles || []).map(m => m.url)].filter(Boolean);
                            for (const url of urls) {
                                try {
                                    await firebase.storage().refFromURL(url).delete();
                                } catch (err) {
                                    console.warn("Could not delete storage file:", err);
                                }
                            }
                            item.remove();
                        } catch (err) {
                            console.error("Failed to remove level:", err);
                            alert("Failed to remove level. Please try again.");
                            removeBtn.disabled = false;
                            removeBtn.textContent = "×";
                        }
                    });
                    item.querySelector(".status-col").appendChild(removeBtn);
                }

                list.appendChild(item);
            });
        }
    }

    async function buildMusicZip(lvl, btn) {
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = "Zipping...";
        try {
            const zip = new JSZip();
            const musicFolder = zip.folder("Music");
            for (const m of lvl.musicFiles || []) {
                const cat = m.category || "Other";
                const res = await fetch(m.url);
                if (!res.ok) throw new Error("Failed to fetch " + m.name);
                const blob = await res.blob();
                musicFolder.folder(cat).file(m.name, blob);
            }
            const blob = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = titleCase(lvl.title).replace(/[^a-z0-9]+/gi, "_") + "_Music.zip";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Failed to build music zip:", err);
            alert("Couldn't build the zip. Please try again.");
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }

    function buildCommentEl(lvl, c, onDeleted) {
        const el = document.createElement("div");
        el.className = "comment-item";
        const when = c.timestamp ? formatDate(c.timestamp) : "";
        el.innerHTML = `<div class="comment-meta"><span class="comment-who"><span class="comment-author"></span> &nbsp;|&nbsp; ${when}</span><span class="comment-right"><span class="comment-version">v${c.version || 1}</span></span></div><div class="comment-body"></div>`;
        const authorEl = el.querySelector(".comment-author");
        authorEl.textContent = c.author || "Unknown";
        authorEl.style.color = userColorCache[c.authorUID] || "#b7c2ff";
        el.querySelector(".comment-body").textContent = c.content || "";

        if (currentUID && c.authorUID === currentUID) {
            const delBtn = document.createElement("button");
            delBtn.type = "button";
            delBtn.className = "remove-btn";
            delBtn.textContent = "×";
            delBtn.title = "Delete comment";
            delBtn.addEventListener("click", async () => {
                if (!confirm("Delete this comment?")) return;
                delBtn.disabled = true;
                try {
                    await db.ref("mst3Levels/" + lvl.key + "/comments/" + c.key).remove();
                    el.remove();
                    if (onDeleted) onDeleted(c.key);
                } catch (err) {
                    console.error("Failed to delete comment:", err);
                    alert("Failed to delete comment. Please try again.");
                    delBtn.disabled = false;
                }
            });
            el.querySelector(".comment-right").appendChild(delBtn);
        }

        return el;
    }

    function renderCommentList(listEl, comments, lvl, onDeleted) {
        listEl.innerHTML = "";
        if (comments.length === 0) {
            return;
        }
        comments.forEach(c => listEl.appendChild(buildCommentEl(lvl, c, onDeleted)));
    }

    async function fetchComments(lvl) {
        try {
            const snap = await db.ref("mst3Levels/" + lvl.key + "/comments").once("value");
            const comments = [];
            snap.forEach(child => comments.push({ key: child.key, ...child.val() }));
            comments.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
            const uids = [...new Set(comments.map(c => c.authorUID).filter(Boolean))];
            await Promise.all(uids.map(uid => getUserColor(uid)));
            return comments;
        } catch (err) {
            console.error("Failed to load comments:", err);
            return [];
        }
    }

    async function postComment(lvl, inputEl, listEl, btn, onDeleted, onPosted) {
        const user = auth.currentUser;
        if (!user || !hasAccess) return;

        const content = inputEl.value.trim();
        if (!content) return;

        btn.disabled = true;
        const originalText = btn.textContent;
        btn.textContent = "Posting...";
        try {
            const username = localStorage.getItem("username") || "Unknown";
            const commentRef = db.ref("mst3Levels/" + lvl.key + "/comments").push();
            const comment = {
                author: username,
                authorUID: user.uid,
                content: content,
                version: lvl.version || 1,
                timestamp: Date.now()
            };
            await commentRef.set(comment);
            await getUserColor(user.uid);

            inputEl.value = "";
            const emptyMsg = listEl.querySelector(".comments-empty");
            if (emptyMsg) emptyMsg.remove();
            listEl.appendChild(buildCommentEl(lvl, { ...comment, key: commentRef.key }, onDeleted));
            if (onPosted) onPosted({ ...comment, key: commentRef.key });
        } catch (err) {
            console.error("Failed to post comment:", err);
            alert("Failed to post comment: " + (err && err.message ? err.message : err) + ".");
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }

    async function loadLevels() {
        if (!hasAccess || !document.getElementById("mst3-app")) return;
        try {
            const snap = await db.ref("mst3Levels").once("value");
            renderLevels(snap.val() || {});
        } catch (err) {
            console.error("Failed to load MST3 levels:", err);
        }
    }

    async function onUploadClick() {
        const user = auth.currentUser;
        if (!user || !hasAccess) return;

        const title = document.getElementById("level-title").value.trim();
        const week = parseInt(document.getElementById("level-week").value, 10);
        const status = document.getElementById("level-status").value;
        const notes = document.getElementById("level-notes").value.trim();
        const mainFileInput = document.getElementById("level-main-file");
        const mainFile = mainFileInput.files[0];

        if (!title) { uploadStatus.textContent = "Level title is required."; return; }
        if (!mainFile) { uploadStatus.textContent = "A .mmlv level file is required."; return; }
        if (!isMMLV(mainFile)) { uploadStatus.textContent = "Level file must be a .mmlv file."; return; }

        uploadBtn.disabled = true;
        uploadStatus.textContent = "Uploading...";
        try {
            const username = localStorage.getItem("username") || "Unknown";
            const levelKey = user.uid + "_" + slugify(title);
            const levelRef = db.ref("mst3Levels/" + levelKey);
            const existingSnap = await levelRef.once("value");
            const existing = existingSnap.val();
            const storageRef = firebase.storage().ref("mst3Levels/" + levelKey);

            uploadStatus.textContent = "Uploading level file...";
            const mainRef = storageRef.child("main_" + mainFile.name);
            await mainRef.put(mainFile);
            const mainFileURL = await mainRef.getDownloadURL();

            let thumbnailURL = existing ? existing.thumbnailURL || null : null;
            const thumbInput = document.getElementById("level-thumbnail");
            const thumbFile = thumbInput.files[0];
            if (thumbFile) {
                uploadStatus.textContent = "Uploading thumbnail...";
                const ext = thumbFile.name.split(".").pop();
                await storageRef.child("thumbnail." + ext).put(thumbFile);
                thumbnailURL = await storageRef.child("thumbnail." + ext).getDownloadURL();
            }

            let uploadedMusic = existing ? existing.musicFiles || [] : [];
            if (musicFiles.length > 0) {
                uploadStatus.textContent = "Uploading music files...";
                uploadedMusic = [];
                for (const entry of musicFiles) {
                    const fileRef = storageRef.child(entry.category).child(entry.file.name);
                    await fileRef.put(entry.file);
                    uploadedMusic.push({ name: entry.file.name, category: entry.category, url: await fileRef.getDownloadURL() });
                }
            }

            await levelRef.set({
                title: title,
                titleLower: title.toLowerCase(),
                week: week,
                status: status,
                notes: notes,
                mainFileURL: mainFileURL,
                mainFileName: mainFile.name,
                thumbnailURL: thumbnailURL,
                musicFiles: uploadedMusic,
                uploadedBy: username,
                uploadedByUID: user.uid,
                version: existing ? (existing.version || 1) + 1 : 1,
                createdAt: existing ? existing.createdAt : Date.now(),
                updatedAt: Date.now()
            });

            uploadStatus.textContent = existing ? "Level updated to a new version!" : "Level submitted!";
            document.getElementById("level-title").value = "";
            document.getElementById("level-notes").value = "";
            mainFileInput.value = "";
            thumbInput.value = "";
            musicFiles = [];
            renderMusicList();
            loadLevels();
        } catch (err) {
            console.error("Upload failed:", err);
            uploadStatus.textContent = "Something went wrong. Please try again.";
        } finally {
            if (uploadBtn) uploadBtn.disabled = false;
        }
    }

    window.initMST3App = function (uid) {
        currentUID = uid;
        hasAccess = true;
        buildApp();
        loadLevels();
    };

    window.destroyMST3App = function () {
        hasAccess = false;
        currentUID = null;
        destroyApp();
    };
})();
