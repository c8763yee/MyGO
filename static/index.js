const API_URL = 'https://mygo-api.c8763yee.qzz.io/api';

// --- 初始化 Offcanvas 內容 ---
const sidebarContainer = document.getElementById('sidebar-container');
const offcanvasContent = document.getElementById('offcanvas-content');

function syncSidebar() {
    if (window.innerWidth < 768) {
        if (offcanvasContent && !offcanvasContent.contains(sidebarContainer)) {
            offcanvasContent.appendChild(sidebarContainer);
        }
    } else {
        const desktopSidebar = document.getElementById('sidebar-wrapper');
        if (desktopSidebar && !desktopSidebar.contains(sidebarContainer)) {
            desktopSidebar.appendChild(sidebarContainer);
        }
    }
}

window.addEventListener('resize', syncSidebar);
syncSidebar();

const getCurrentFetchConfig = ({ json = false, headers = {} } = {}) => ({
    mode: 'cors',
    headers: {
        ...(json ? { 'Content-Type': 'application/json' } : {}),
        ...headers
    }
});

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function buildUrl(path, params) {
    const url = new URL(`${API_URL}${path}`);
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
    });
    return url.toString();
}

function safeFilePart(s) {
    return String(s).replace(/[^\w.-]+/g, '_').replace(/^_+|_+$/g, '') || 'mygo';
}

// --- UI 控制 ---
const themeToggle = document.getElementById("theme-toggle");
const html = document.documentElement;
const icon = themeToggle?.querySelector("i");

if (themeToggle) {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
        html.setAttribute("data-bs-theme", savedTheme);
        if (icon) icon.className = savedTheme === "dark" ? "fas fa-moon" : "fas fa-sun";
    }

    themeToggle.addEventListener("click", () => {
        const currentTheme = html.getAttribute("data-bs-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        html.setAttribute("data-bs-theme", newTheme);
        if (icon) icon.className = newTheme === "dark" ? "fas fa-moon" : "fas fa-sun";
        localStorage.setItem("theme", newTheme);
    });
}

// 影片播放器控制
const videoPlayer = document.getElementById("video-player");
const playPauseBtn = document.getElementById("play-pause");
const videoProgress = document.getElementById("video-progress");
const timeDisplay = document.getElementById("time-display");
const videoPreview = document.getElementById("video-preview");

function updateVideoPreview() {
    const videoName = document.getElementById("gif-video_name").value;
    const episode = document.getElementById("gif-episode").value;

    if (videoName && episode) {
        const videoUrl = `${API_URL}/video/${videoName}/${episode}`;
        const source = videoPlayer.querySelector("source");
        if (source) source.src = videoUrl;
        videoPlayer.load();
        videoPreview.style.display = "block";
    } else {
        videoPreview.style.display = "none";
    }
}

document.getElementById("gif-video_name")?.addEventListener("change", updateVideoPreview);
document.getElementById("gif-episode")?.addEventListener("change", updateVideoPreview);

videoPlayer?.addEventListener("loadedmetadata", () => {
    const totalFrames = Math.floor(videoPlayer.duration * 30);
    const startInput = document.getElementById("gif-start");
    const endInput = document.getElementById("gif-end");
    if (startInput) startInput.max = totalFrames;
    if (endInput) endInput.max = totalFrames;
    if (videoProgress) videoProgress.disabled = false;
});

const PLAY_ICON = '<i class="fas fa-play" style="font-size: 0.8rem;"></i>';
const PAUSE_ICON = '<i class="fas fa-pause" style="font-size: 0.8rem;"></i>';

playPauseBtn?.addEventListener("click", () => {
    if (videoPlayer.paused) {
        videoPlayer.play();
        playPauseBtn.innerHTML = PAUSE_ICON;
    } else {
        videoPlayer.pause();
        playPauseBtn.innerHTML = PLAY_ICON;
    }
});

videoPlayer?.addEventListener("ended", () => {
    if (playPauseBtn) playPauseBtn.innerHTML = PLAY_ICON;
});

videoPlayer?.addEventListener("pause", () => {
    if (playPauseBtn) playPauseBtn.innerHTML = PLAY_ICON;
});

videoPlayer?.addEventListener("play", () => {
    if (playPauseBtn) playPauseBtn.innerHTML = PAUSE_ICON;
});

videoPlayer?.addEventListener("timeupdate", () => {
    const duration = videoPlayer.duration;
    const hasDuration = Number.isFinite(duration) && duration > 0;
    if (videoProgress && hasDuration) {
        videoProgress.value = (videoPlayer.currentTime / duration) * 100;
    }
    if (timeDisplay) {
        const currentMin = Math.floor(videoPlayer.currentTime / 60);
        const currentSec = Math.floor(videoPlayer.currentTime % 60);
        const durationMin = hasDuration ? Math.floor(duration / 60) : 0;
        const durationSec = hasDuration ? Math.floor(duration % 60) : 0;
        timeDisplay.textContent = `${currentMin}:${currentSec.toString().padStart(2, "0")} / ${durationMin}:${durationSec.toString().padStart(2, "0")}`;
    }
});

videoProgress?.addEventListener("input", () => {
    if (!Number.isFinite(videoPlayer.duration) || videoPlayer.duration <= 0) return;
    videoPlayer.currentTime = (videoProgress.value / 100) * videoPlayer.duration;
});

// --- 輔助函式 ---
function showLoading() {
    const resultsContent = document.getElementById('results-content');
    resultsContent.innerHTML = Array(8).fill(0).map(() => `
        <div class="col-md-6 col-lg-4 col-xl-3">
            <div class="result-card loading-pulse" style="min-height: 280px; background: var(--glass-bg);"></div>
        </div>
    `).join('');
    document.getElementById('display-title').textContent = 'Searching...';
}

function showError(message) {
    const resultsContent = document.getElementById('results-content');
    resultsContent.innerHTML = `
        <div class="col-12">
            <div class="alert alert-danger glass-panel" role="alert">
                <i class="fas fa-exclamation-circle me-2"></i> ${message}
            </div>
        </div>
    `;
}

function closeMobileSidebar() {
    const offcanvasElement = document.getElementById('mobileSidebar');
    if (offcanvasElement) {
        const bsOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement);
        if (bsOffcanvas) bsOffcanvas.hide();
    }
}

// --- 搜索功能 ---
let currentSearchData = { query: '', episode: '', video_name: '', paged_by: 20 };
let currentPage = 1;

document.getElementById('search-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    currentSearchData.query = document.getElementById('search-query').value.trim();
    currentSearchData.episode = document.getElementById('search-episode').value;
    currentSearchData.video_name = document.getElementById('search-video_name').value;
    currentSearchData.paged_by = parseInt(document.getElementById('search-paged_by').value) || 20;
    currentPage = 1;

    if (!currentSearchData.query) return;

    closeMobileSidebar();
    await performSearch();
});

async function performSearch() {
    showLoading();
    try {
        const response = await fetch(`${API_URL}/search`, {
            method: 'POST',
            ...getCurrentFetchConfig({ json: true }),
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
                <div class="d-flex justify-content-between align-items-end mb-4 px-2">
                    <div>
                        <h2 class="hero-text mb-1" id="display-title"></h2>
                        <p class="text-muted small mb-0 opacity-75">探索迷茫與華麗的樂章台詞</p>
                    </div>
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

    displayTitle.innerHTML = `Found <span style="color: var(--primary-blue)">${data.count}</span> Results`;

    if (data.results.length === 0) {
        resultsContent.innerHTML = `
            <div class="col-12 text-center py-5 fade-in">
                <div class="glass-panel d-inline-block p-5">
                    <i class="fas fa-ghost fa-4x mb-3 opacity-25 text-muted"></i>
                    <p class="text-muted">找不到相關台詞，試試其他關鍵字？</p>
                </div>
            </div>
        `;
        renderPagination(0);
        return;
    }

    resultsContent.innerHTML = data.results.map((item, index) => {
        const vn = escapeHtml(item.video_name);
        const text = escapeHtml(item.text);
        const vnAttr = encodeURIComponent(item.video_name);
        const delay = index * 0.05;
        
        return `
        <div class="col-md-6 col-lg-4 col-xl-3 fade-in" style="animation-delay: ${delay}s">
            <div class="result-card">
                <div class="ratio ratio-16x9 overflow-hidden">
                    <img src="${API_URL}/frame?episode=${item.episode}&frame=${item.frame_start}&video_name=${vnAttr}"
                         class="card-img-top" alt="Preview" loading="lazy">
                </div>
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <span class="badge ${item.video_name.includes('MyGO') ? 'badge-mygo' : 'badge-ave'} rounded-pill px-3">
                            ${vn}
                        </span>
                        <span class="text-muted fw-bold small">EP ${item.episode}</span>
                    </div>
                    <p class="card-title text-truncate-2" title="${text}">${text}</p>
                    <div class="d-flex gap-2 mt-auto">
                        <button class="btn btn-sm btn-primary flex-grow-1"
                                data-action="frame"
                                data-episode="${item.episode}"
                                data-frame-start="${item.frame_start}"
                                data-video-name="${vn}">
                            <i class="fas fa-camera me-1"></i> 提取
                        </button>
                        <button class="btn btn-sm btn-outline-info flex-grow-1"
                                data-action="gif"
                                data-episode="${item.episode}"
                                data-frame-start="${item.frame_start}"
                                data-frame-end="${item.frame_end}"
                                data-video-name="${vn}">
                            <i class="fas fa-film me-1"></i> GIF
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
        if (!el) return;
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
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(total, start + 4);
    start = Math.max(1, end - 4);
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
    const epInput = document.getElementById('frame-episode');
    const fInput = document.getElementById('frame-number');
    const vnInput = document.getElementById('frame-video_name');
    if (epInput) epInput.value = episode;
    if (fInput) fInput.value = frame;
    if (vnInput) vnInput.value = video_name;
    document.querySelector('a[href="#frame"]')?.click();
    if (window.innerWidth < 768) {
        const offcanvas = document.getElementById('mobileSidebar');
        if (offcanvas) {
            const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(offcanvas);
            bsOffcanvas.show();
        }
    }
};

window.handleGenerateGif = (episode, start, end, video_name) => {
    const epInput = document.getElementById('gif-episode');
    const sInput = document.getElementById('gif-start');
    const eInput = document.getElementById('gif-end');
    const vnInput = document.getElementById('gif-video_name');
    if (epInput) epInput.value = episode;
    if (sInput) sInput.value = start;
    if (eInput) eInput.value = end;
    if (vnInput) vnInput.value = video_name;
    document.querySelector('a[href="#gif"]')?.click();
    if (window.innerWidth < 768) {
        const offcanvas = document.getElementById('mobileSidebar');
        if (offcanvas) {
            const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(offcanvas);
            bsOffcanvas.show();
        }
    }
    updateVideoPreview();
};

function renderMediaResult(innerHtml) {
    ensureResultsLayout();
    const topPag = document.getElementById('pagination-top');
    const botPag = document.getElementById('pagination-bottom');
    const resContent = document.getElementById('results-content');
    if (topPag) topPag.innerHTML = '';
    if (botPag) botPag.innerHTML = '';
    if (resContent) resContent.innerHTML = `<div class="col-12">${innerHtml}</div>`;
}

// 處理 Frame 表單
document.getElementById('frame-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ep = document.getElementById('frame-episode').value;
    const f = document.getElementById('frame-number').value;
    const vn = document.getElementById('frame-video_name').value;

    closeMobileSidebar();
    showLoading();
    document.getElementById('display-title').textContent = `Extracting EP${ep} Frame ${f}...`;

    const url = buildUrl('/frame', { episode: ep, frame: f, video_name: vn });
    const safeVn = escapeHtml(safeFilePart(vn));
    const safeEp = escapeHtml(ep);
    const safeFrame = escapeHtml(f);

    renderMediaResult(`
        <div class="fade-in text-center p-md-5">
            <div class="glass-panel d-inline-block p-4 mb-4">
                <img src="${url}" class="img-fluid rounded-3 shadow-lg" style="max-height: 70vh"
                     alt="EP${safeEp} Frame ${safeFrame}"
                     onload="document.getElementById('display-title').textContent = 'Frame Result'"
                     onerror="showError('圖片載入失敗，請確認集數、幀數與系列是否正確')">
            </div>
            <div class="d-flex justify-content-center gap-2 flex-wrap">
                <a href="${url}" download="frame_${safeVn}_ep${safeEp}_${safeFrame}.webp" class="btn btn-primary btn-lg px-5 shadow">
                    <i class="fas fa-download me-2"></i>下載圖片
                </a>
                <a href="${url}" target="_blank" rel="noopener" class="btn btn-outline-info btn-lg px-4 shadow">
                    <i class="fas fa-up-right-from-square me-2"></i>開啟原圖
                </a>
            </div>
        </div>
    `);
});

// 處理 GIF 表單
document.getElementById('gif-form')?.addEventListener("submit", async (e) => {
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
    document.getElementById('display-title').textContent = 'Generating...';

    const url = buildUrl('/gif', { video_name: vn, episode: ep, start, end, format });
    const safeVn = escapeHtml(safeFilePart(vn));
    const safeEp = escapeHtml(ep);
    const safeStart = escapeHtml(start);
    const safeEnd = escapeHtml(end);
    const fmtUpper = format.toUpperCase();

    renderMediaResult(`
        <div class="fade-in text-center p-md-5">
            <div class="glass-panel d-inline-block p-4 mb-4 bg-black">
                ${format === 'gif'
                    ? `<img src="${url}" class="img-fluid rounded-3" alt="${fmtUpper} Result"
                           onload="document.getElementById('display-title').textContent = '${fmtUpper} Result'"
                           onerror="showError('動畫載入失敗，請確認集數、幀數與系列是否正確')">`
                    : `<video src="${url}" class="img-fluid rounded-3" controls autoplay loop muted playsinline
                              onloadeddata="document.getElementById('display-title').textContent = '${fmtUpper} Result'"
                              onerror="showError('動畫載入失敗，請確認集數、幀數與系列是否正確')"></video>`}
            </div>
            <div class="d-flex justify-content-center gap-2 flex-wrap">
                <a href="${url}" download="${safeVn}_ep${safeEp}_${safeStart}-${safeEnd}.${format}" class="btn btn-primary btn-lg px-5 shadow">
                    <i class="fas fa-download me-2"></i>下載 ${fmtUpper}
                </a>
                <a href="${url}" target="_blank" rel="noopener" class="btn btn-outline-info btn-lg px-4 shadow">
                    <i class="fas fa-up-right-from-square me-2"></i>開啟檔案
                </a>
            </div>
        </div>
    `);
});
