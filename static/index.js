// ... existing constants ...
const API_URL = 'https://mygo-api.c8763yee.qzz.io/api';

// --- 初始化 Offcanvas 內容 ---
const sidebarContainer = document.getElementById('sidebar-container');
const offcanvasContent = document.getElementById('offcanvas-content');

function syncSidebar() {
    if (window.innerWidth < 768) {
        if (!offcanvasContent.contains(sidebarContainer)) {
            offcanvasContent.appendChild(sidebarContainer);
        }
    } else {
        const desktopSidebar = document.getElementById('sidebar-wrapper');
        if (!desktopSidebar.contains(sidebarContainer)) {
            desktopSidebar.appendChild(sidebarContainer);
        }
    }
}

window.addEventListener('resize', syncSidebar);
syncSidebar();

// 判斷是否為本地開發環境
const isLocalDevelopment = window.location.protocol === 'file:' || window.location.hostname === 'localhost';

const getCurrentFetchConfig = (additionalHeaders = {}) => ({
    credentials: 'include',
    mode: 'cors',
    headers: {
        'Content-Type': 'application/json',
        ...additionalHeaders
    }
});

// HTML escape，避免把搜尋結果（含使用者可見字串）插進 DOM/onclick 時被注入
function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

// --- UI 控制 ---
const themeToggle = document.getElementById("theme-toggle");
const html = document.documentElement;
const icon = themeToggle.querySelector("i");

const savedTheme = localStorage.getItem("theme");
if (savedTheme) {
    html.setAttribute("data-bs-theme", savedTheme);
    icon.className = savedTheme === "dark" ? "fas fa-moon" : "fas fa-sun";
}

themeToggle.addEventListener("click", () => {
    const currentTheme = html.getAttribute("data-bs-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    html.setAttribute("data-bs-theme", newTheme);
    icon.className = newTheme === "dark" ? "fas fa-moon" : "fas fa-sun";
    localStorage.setItem("theme", newTheme);
});

// 影片播放器控制
const videoPlayer = document.getElementById("video-player");
const playPauseBtn = document.getElementById("play-pause");
const videoProgress = document.getElementById("video-progress");
const timeDisplay = document.getElementById("time-display");
const videoPreview = document.getElementById("video-preview");
const gifForm = document.getElementById("gif-form");
const generatedWebmPreview = document.getElementById("generated-webm-preview");
const generatedVideo = document.getElementById("generated-video");
const downloadWebmBtn = document.getElementById("download-webm");

function updateVideoPreview() {
    const videoName = document.getElementById("gif-video_name").value;
    const episode = document.getElementById("gif-episode").value;

    if (videoName && episode) {
        const videoUrl = `${API_URL}/video/${videoName}/${episode}`;
        videoPlayer.querySelector("source").src = videoUrl;
        videoPlayer.load();
        videoPreview.style.display = "block";
    } else {
        videoPreview.style.display = "none";
    }
}

document.getElementById("gif-video_name").addEventListener("change", updateVideoPreview);
document.getElementById("gif-episode").addEventListener("change", updateVideoPreview);

videoPlayer.addEventListener("loadedmetadata", () => {
    const totalFrames = Math.floor(videoPlayer.duration * 30);
    document.getElementById("gif-start").max = totalFrames;
    document.getElementById("gif-end").max = totalFrames;
    videoProgress.disabled = false;
});

playPauseBtn.addEventListener("click", () => {
    if (videoPlayer.paused) {
        videoPlayer.play();
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
        videoPlayer.pause();
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
});

videoPlayer.addEventListener("timeupdate", () => {
    const progress = (videoPlayer.currentTime / videoPlayer.duration) * 100;
    videoProgress.value = progress;
    const currentMin = Math.floor(videoPlayer.currentTime / 60);
    const currentSec = Math.floor(videoPlayer.currentTime % 60);
    const durationMin = Math.floor(videoPlayer.duration / 60);
    const durationSec = Math.floor(videoPlayer.duration % 60);
    timeDisplay.textContent = `${currentMin}:${currentSec.toString().padStart(2, "0")} / ${durationMin}:${durationSec.toString().padStart(2, "0")}`;
});

videoProgress.addEventListener("input", () => {
    const time = (videoProgress.value / 100) * videoPlayer.duration;
    videoPlayer.currentTime = time;
});

// --- 輔助函式 ---
function showLoading() {
    const resultsContent = document.getElementById('results-content');
    resultsContent.innerHTML = Array(8).fill(0).map(() => `
        <div class="col-md-6 col-lg-3">
            <div class="result-card skeleton" style="min-height: 300px;"></div>
        </div>
    `).join('');
    document.getElementById('display-title').textContent = '正在搜尋中...';
}

function showError(message) {
    const resultsContent = document.getElementById('results-content');
    resultsContent.innerHTML = `
        <div class="col-12">
            <div class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-circle me-2"></i> ${message}
            </div>
        </div>
    `;
}

function closeMobileSidebar() {
    const offcanvasElement = document.getElementById('mobileSidebar');
    const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement);
    if (bsOffcanvas) bsOffcanvas.hide();
}

// --- 搜索功能 ---
let currentSearchData = { query: '', episode: '', video_name: '', paged_by: 20 };
let currentPage = 1;

document.getElementById('search-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    currentSearchData.query = document.getElementById('search-query').value.trim();
    currentSearchData.episode = document.getElementById('search-episode').value;
    currentSearchData.video_name = document.getElementById('search-video_name').value;
    currentSearchData.paged_by = parseInt(document.getElementById('search-paged_by').value) || 20;
    currentPage = 1;

    if (!currentSearchData.query) return alert('請輸入關鍵字');

    closeMobileSidebar();
    await performSearch();
});

async function performSearch() {
    showLoading();
    try {
        const response = await fetch(`${API_URL}/search`, {
            method: 'POST',
            ...getCurrentFetchConfig(),
            body: JSON.stringify({ ...currentSearchData, nth_page: currentPage })
        });
        if (!response.ok) throw new Error('連線失敗');
        const data = await response.json();
        renderResults(data);
    } catch (error) {
        showError(error.message);
    }
}

function ensureResultsLayout() {
    let container = document.getElementById('results-container');
    if (!container) {
        document.getElementById('display-area').innerHTML = `
            <div id="results-container">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h4 class="mb-0" id="display-title"></h4>
                    <div id="pagination-top"></div>
                </div>
                <div id="results-content" class="row g-4"></div>
                <div id="pagination-bottom" class="mt-5"></div>
            </div>
        `;
    }
}

function renderResults(data) {
    ensureResultsLayout();
    const resultsContent = document.getElementById('results-content');
    const displayTitle = document.getElementById('display-title');

    displayTitle.innerHTML = `找到 <span class="text-primary">${data.count}</span> 筆結果`;

    if (data.results.length === 0) {
        resultsContent.innerHTML = `
            <div class="col-12 text-center py-5 text-muted">
                <i class="fas fa-ghost fa-4x mb-3 opacity-25"></i>
                <p>找不到相關台詞，試試其他關鍵字？</p>
            </div>
        `;
        renderPagination(0);
        return;
    }

    resultsContent.innerHTML = data.results.map((item, index) => {
        const vn = escapeHtml(item.video_name);
        const text = escapeHtml(item.text);
        const vnAttr = encodeURIComponent(item.video_name);
        return `
        <div class="col-md-6 col-lg-4 col-xl-3 fade-in" style="animation-delay: ${index * 0.05}s">
            <div class="result-card shadow-sm">
                <img src="${API_URL}/frame?episode=${item.episode}&frame=${item.frame_start}&video_name=${vnAttr}"
                     class="card-img-top" alt="Preview" loading="lazy">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="badge ${item.video_name.includes('MyGO') ? 'badge-mygo' : 'badge-ave'}">
                            ${vn}
                        </span>
                        <span class="text-muted small">EP ${item.episode}</span>
                    </div>
                    <h5 class="card-title" title="${text}">${text}</h5>
                    <div class="d-flex gap-1 mt-auto">
                        <button class="btn btn-sm btn-outline-primary flex-grow-1"
                                data-action="frame"
                                data-episode="${item.episode}"
                                data-frame-start="${item.frame_start}"
                                data-video-name="${vn}">
                            <i class="fas fa-image"></i> 提取
                        </button>
                        <button class="btn btn-sm btn-outline-info flex-grow-1"
                                data-action="gif"
                                data-episode="${item.episode}"
                                data-frame-start="${item.frame_start}"
                                data-frame-end="${item.frame_end}"
                                data-video-name="${vn}">
                            <i class="fas fa-film"></i> GIF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    }).join('');

    resultsContent.querySelectorAll('button[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
            const ds = btn.dataset;
            if (ds.action === 'frame') {
                handleGenerateFrame(ds.episode, ds.frameStart, ds.videoName);
            } else {
                handleGenerateGif(ds.episode, ds.frameStart, ds.frameEnd, ds.videoName);
            }
        });
    });

    renderPagination(data.count);
}

function renderPagination(totalCount) {
    const totalPages = Math.ceil(totalCount / currentSearchData.paged_by);
    const topContainer = document.getElementById('pagination-top');
    const bottomContainer = document.getElementById('pagination-bottom');

    const paginationHtml = `
        <nav>
            <ul class="pagination pagination-sm mb-0">
                <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${currentPage - 1}"><i class="fas fa-chevron-left"></i></a>
                </li>
                ${renderPageNumbers(totalPages)}
                <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="${currentPage + 1}"><i class="fas fa-chevron-right"></i></a>
                </li>
            </ul>
        </nav>
    `;

    const render = (el, html) => {
        el.innerHTML = html;
        el.querySelectorAll('a[data-page]').forEach(a => {
            a.addEventListener('click', (ev) => {
                ev.preventDefault();
                const page = parseInt(a.dataset.page);
                if (a.closest('.page-item').classList.contains('disabled')) return;
                if (page < 1 || page > totalPages) return;
                changePage(page);
            });
        });
    };
    render(topContainer, totalPages > 1 ? paginationHtml : '');
    render(bottomContainer, totalPages > 1 ? `<div class="d-flex justify-content-center">${paginationHtml}</div>` : '');
}

function renderPageNumbers(total) {
    let html = '';
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(total, start + 4);
    for (let i = start; i <= end; i++) {
        html += `<li class="page-item ${i === currentPage ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
    }
    return html;
}

function changePage(page) {
    currentPage = page;
    performSearch();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- 生成功能 ---
window.handleGenerateFrame = (episode, frame, video_name) => {
    document.getElementById('frame-episode').value = episode;
    document.getElementById('frame-number').value = frame;
    document.getElementById('frame-video_name').value = video_name;
    document.querySelector('a[href="#frame"]').click();
    if (window.innerWidth < 768) {
        new bootstrap.Offcanvas(document.getElementById('mobileSidebar')).show();
    }
};

window.handleGenerateGif = (episode, start, end, video_name) => {
    document.getElementById('gif-episode').value = episode;
    document.getElementById('gif-start').value = start;
    document.getElementById('gif-end').value = end;
    document.getElementById('gif-video_name').value = video_name;
    document.querySelector('a[href="#gif"]').click();
    if (window.innerWidth < 768) {
        new bootstrap.Offcanvas(document.getElementById('mobileSidebar')).show();
    }
    updateVideoPreview();
};

function renderMediaResult(innerHtml) {
    ensureResultsLayout();
    document.getElementById('pagination-top').innerHTML = '';
    document.getElementById('pagination-bottom').innerHTML = '';
    document.getElementById('results-content').innerHTML = `<div class="col-12">${innerHtml}</div>`;
}

// 處理 Frame 表單
document.getElementById('frame-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const ep = document.getElementById('frame-episode').value;
    const f = document.getElementById('frame-number').value;
    const vn = document.getElementById('frame-video_name').value;

    closeMobileSidebar();
    showLoading();
    document.getElementById('display-title').textContent = `正在生成 EP${ep} 幀數 ${f}...`;

    try {
        const qs = `episode=${encodeURIComponent(ep)}&frame=${encodeURIComponent(f)}&video_name=${encodeURIComponent(vn)}`;
        const res = await fetch(`${API_URL}/frame?${qs}`, {
            method: 'GET', ...getCurrentFetchConfig()
        });
        if (!res.ok) throw new Error(`伺服器回應錯誤 (${res.status})`);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const safeVn = escapeHtml(vn);

        renderMediaResult(`
            <div class="fade-in text-center p-md-5">
                <div class="alert alert-success d-inline-block px-4"><i class="fas fa-check-circle me-2"></i>生成成功</div>
                <div class="mt-4 shadow-lg rounded-3 overflow-hidden d-inline-block">
                    <img src="${url}" class="img-fluid" style="max-height: 70vh">
                </div>
                <div class="mt-4">
                    <a href="${url}" download="frame_${safeVn}_ep${ep}_${f}.webp" class="btn btn-primary btn-lg px-5 shadow">
                        <i class="fas fa-download me-2"></i>下載圖片
                    </a>
                </div>
            </div>
        `);
        document.getElementById('display-title').textContent = '畫面提取結果';
    } catch (err) { showError(err.message); }
});

// 處理 GIF 表單
gifForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const format = document.querySelector('input[name="format"]:checked').value;
    const vn = document.getElementById("gif-video_name").value;
    const ep = document.getElementById("gif-episode").value;
    const start = parseInt(document.getElementById("gif-start").value);
    const end = parseInt(document.getElementById("gif-end").value);

    if (!(end > start)) {
        alert('結束幀必須大於開始幀');
        return;
    }

    closeMobileSidebar();
    showLoading();
    document.getElementById('display-title').textContent = '正在生成動畫，請稍候...';

    try {
        const qs = `video_name=${encodeURIComponent(vn)}&episode=${encodeURIComponent(ep)}&start=${start}&end=${end}&format=${format}`;
        const res = await fetch(`${API_URL}/gif?${qs}`, {
            method: "GET", ...getCurrentFetchConfig()
        });
        if (!res.ok) throw new Error(`伺服器回應錯誤 (${res.status})`);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const safeVn = escapeHtml(vn);
        const fmtUpper = format.toUpperCase();

        renderMediaResult(`
            <div class="fade-in text-center p-md-5">
                <div class="alert alert-success d-inline-block px-4"><i class="fas fa-check-circle me-2"></i>${fmtUpper} 生成成功</div>
                <div class="mt-4 shadow-lg rounded-3 overflow-hidden d-inline-block bg-black">
                    ${format === 'gif'
                        ? `<img src="${url}" class="img-fluid">`
                        : `<video src="${url}" class="img-fluid" controls autoplay loop muted playsinline></video>`}
                </div>
                <div class="mt-4 d-flex justify-content-center gap-3">
                    <a href="${url}" download="${safeVn}_ep${ep}_${start}-${end}.${format}" class="btn btn-primary btn-lg px-5 shadow">
                        <i class="fas fa-download me-2"></i>下載 ${fmtUpper}
                    </a>
                </div>
            </div>
        `);
        document.getElementById('display-title').textContent = `${fmtUpper} 生成結果`;
    } catch (err) { showError(err.message); }
});
