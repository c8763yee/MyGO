const API_URL = 'https://tomorin.mooo.com:9527/api';
// const API_URL = 'http://192.168.191.52:8080/api';

// 判斷是否為本地開發環境
const isLocalDevelopment = window.location.protocol === 'file:' || window.location.hostname === 'localhost';

// fetch 配置
const fetchConfig = {
    production: {
        credentials: 'include',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            'Origin': window.location.origin
        }
    },
    development: {
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        }
    }
};

// 獲取當前環境的 fetch 配置
const getCurrentFetchConfig = (additionalHeaders = {}) => {
    const baseConfig = isLocalDevelopment ? fetchConfig.development : fetchConfig.production;
    return {
        ...baseConfig,
        headers: {
            ...baseConfig.headers,
            ...additionalHeaders
        }
    };
};

// 主題切換功能
const themeToggle = document.getElementById("theme-toggle");
const html = document.documentElement;
const icon = themeToggle.querySelector("i");

// 檢查本地存儲的主題設置
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

    // 保存主題設置到本地存儲
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

// 當選擇影片和集數時顯示預覽
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

// 監聽影片和集數選擇變化
document
    .getElementById("gif-video_name")
    .addEventListener("change", updateVideoPreview);
document
    .getElementById("gif-episode")
    .addEventListener("change", updateVideoPreview);

// 更新開始和結束幀輸入框的最大值
videoPlayer.addEventListener("loadedmetadata", () => {
    const totalFrames = Math.floor(videoPlayer.duration * 30); // 假設 30fps
    document.getElementById("gif-start").max = totalFrames;
    document.getElementById("gif-end").max = totalFrames;
    videoProgress.disabled = false;
});

// 播放/暫停按鈕點擊事件
playPauseBtn.addEventListener("click", () => {
    if (videoPlayer.paused) {
        videoPlayer.play();
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
        videoPlayer.pause();
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
});

// 更新進度條和時間顯示
videoPlayer.addEventListener("timeupdate", () => {
    const progress = (videoPlayer.currentTime / videoPlayer.duration) * 100;
    videoProgress.value = progress;

    const currentMinutes = Math.floor(videoPlayer.currentTime / 60);
    const currentSeconds = Math.floor(videoPlayer.currentTime % 60);
    const durationMinutes = Math.floor(videoPlayer.duration / 60);
    const durationSeconds = Math.floor(videoPlayer.duration % 60);

    timeDisplay.textContent = `${currentMinutes}:${currentSeconds
        .toString()
        .padStart(2, "0")} / ${durationMinutes}:${durationSeconds
            .toString()
            .padStart(2, "0")}`;
});

// 進度條拖曳控制
videoProgress.addEventListener("input", () => {
    const time = (videoProgress.value / 100) * videoPlayer.duration;
    videoPlayer.currentTime = time;
});

// 處理 GIF/WebM 表單提交
gifForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const format = document.querySelector('input[name="format"]:checked').value;
    const videoName = document.getElementById("gif-video_name").value;
    const episode = document.getElementById("gif-episode").value;
    const start = document.getElementById("gif-start").value;
    const end = document.getElementById("gif-end").value;

    if (!videoName) {
        alert('請選擇影片');
        return;
    }

    if (episode === "") {
        alert('請選擇集數');
        return;
    }

    if (isNaN(start) || isNaN(end)) {
        alert('請填寫正確的幀範圍');
        return;
    }

    showLoading();

    try {
        const response = await fetch(`${API_URL}/gif?video_name=${encodeURIComponent(videoName)}&episode=${encodeURIComponent(episode)}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&format=${encodeURIComponent(format)}`, {
            method: "GET",
            ...getCurrentFetchConfig()
        });

        if (!response.ok) throw new Error("生成失敗");

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const fileExtension = format === 'gif' ? 'gif' : 'webm';

        // 顯示成功提示和預覽
        const displayArea = document.getElementById('display-area');
        displayArea.innerHTML = `
            <div class="alert alert-success" role="alert">
                <i class="fas fa-check-circle"></i> ${format.toUpperCase()} 生成成功！
            </div>
            <div class="text-center m-3">
                ${format === 'gif'
                ? `<img src="${url}" alt="Generated GIF" class="img-fluid rounded">`
                : `<video src="${url}" class="img-fluid rounded" controls autoplay loop></video>`
            }
                <p class="mt-2">集數：${episode}，幀範圍：${start} - ${end}，影片：${videoName}</p>
                <a href="${url}" download="${videoName}_${episode}_${start}-${end}.${fileExtension}" class="btn btn-primary download-button">
                    <i class="fas fa-download"></i> 下載 ${format.toUpperCase()}
                </a>
            </div>
        `;

        // 清理之前生成的預覽
        generatedWebmPreview.style.display = "none";

        // 設置下載按鈕
        downloadWebmBtn.onclick = () => {
            const a = document.createElement("a");
            a.href = url;
            a.download = `${videoName}_${episode}_${start}-${end}.${fileExtension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };
    } catch (error) {
        console.error("Error:", error);
        alert(`生成${format === 'webm' ? 'WebM' : 'GIF'}時發生錯誤`);
    }
});

// 異步處理與錯誤反饋
function showLoading() {
    const displayArea = document.getElementById('display-area');
    displayArea.innerHTML = `
        <div class="d-flex justify-content-center align-items-center" style="height: 100%;">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">加載中...</span>
            </div>
        </div>
    `;
}

function showError(message) {
    const displayArea = document.getElementById('display-area');
    displayArea.innerHTML = `
        <div class="alert alert-danger m-3" role="alert">
            <i class="fas fa-exclamation-circle"></i> 發生錯誤：${message}
        </div>
    `;
}

// 全局變量保存當前的排序狀態和頁碼
let currentSortColumn = null;
let currentSortOrder = 'asc'; // 'asc', 'desc', 'none'
let currentPage = 1;

// 處理 Search 表單提交
document.getElementById('search-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = document.getElementById('search-query').value.trim();
    const episode = document.getElementById('search-episode').value;
    const paged_by = parseInt(document.getElementById('search-paged_by').value) || 20;
    currentPage = 1; // 重置頁碼

    if (!query) {
        alert('請輸入關鍵字');
        return;
    }

    showLoading();

    await fetchSearchResults(query, episode, paged_by, currentPage);
});

// 獲取搜索結果函數
async function fetchSearchResults(query, episode, paged_by, page) {
    const video_name = document.getElementById('search-video_name').value;
    try {
        const response = await fetch(`${API_URL}/search`, {
            method: 'POST',
            ...getCurrentFetchConfig(),
            body: JSON.stringify({ query, episode, video_name, paged_by, nth_page: page })
        });
        if (!response.ok) throw new Error('網路錯誤');

        const data = await response.json();

        // 保存原始數據
        window.searchResults = data.results;

        // 重置排序狀態
        currentSortColumn = null;
        currentSortOrder = 'asc';

        // 顯示表格
        renderTable(data.results, data.count);

    } catch (error) {
        showError(error.message);
    }
}

// 渲染表格函數
function renderTable(data, totalCount) {
    const displayArea = document.getElementById('display-area');
    displayArea.innerHTML = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead class="table-primary">
                    <tr>
                        <th data-column="ID">ID <i class="sort-icon"></i></th>
                        <th data-column="text">Text <i class="sort-icon"></i></th>
                        <th data-column="episode">Episode <i class="sort-icon"></i></th>
                        <th data-column="frame_start">Frame Start <i class="sort-icon"></i></th>
                        <th data-column="frame_end">Frame End <i class="sort-icon"></i></th>
                        <th data-column="segment_id">Segment ID <i class="sort-icon"></i></th>
                        <th data-column="video_name">Video Name <i class="sort-icon"></i></th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(item => `
                        <tr>
                            <td>${item.ID}</td>
                            <td>${item.text}</td>
                            <td>${item.episode}</td>
                            <td>${item.frame_start}</td>
                            <td>${item.frame_end}</td>
                            <td>${item.segment_id}</td>
                            <td>${item.video_name}</td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary generate-frame" data-episode="${item.episode}" data-frame="${item.frame_start}" data-video_name="${item.video_name}">生成畫面</button>
                                <button class="btn btn-sm btn-outline-primary generate-gif" data-episode="${item.episode}" data-start="${item.frame_start}" data-end="${item.frame_end}" data-video_name="${item.video_name}">生成GIF</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div class="d-flex justify-content-between align-items-center m-3">
            <button id="prev-page" class="btn btn-secondary"><i class="fas fa-arrow-left"></i> 上一頁</button>
            <span>第 ${currentPage} 頁，共 ${Math.ceil(totalCount / parseInt(document.getElementById('search-paged_by').value || 20))} 頁</span>
            <button id="next-page" class="btn btn-secondary">下一頁 <i class="fas fa-arrow-right"></i></button>
        </div>
        `;

    // 添加排序功能
    const headers = displayArea.querySelectorAll('th');
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const column = header.getAttribute('data-column');
            sortTable(column);
            updateSortIcons(headers, column);
        });
    });

    // 處理上一頁、下一頁按鈕
    document.getElementById('prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            performSearch();
        }
    });

    document.getElementById('next-page').addEventListener('click', () => {
        const totalPages = Math.ceil(totalCount / parseInt(document.getElementById('search-paged_by').value || 20));
        if (currentPage < totalPages) {
            currentPage++;
            performSearch();
        }
    });

    // 添加新按鈕的事件監聽器
    document.querySelectorAll('.generate-frame').forEach(button => {
        button.addEventListener('click', handleGenerateFrame);
    });

    document.querySelectorAll('.generate-gif').forEach(button => {
        button.addEventListener('click', handleGenerateGif);
    });
}

// 執行搜索函數（用於換頁）
function performSearch() {
    const query = document.getElementById('search-query').value.trim();
    const episode = document.getElementById('search-episode').value;
    const paged_by = parseInt(document.getElementById('search-paged_by').value) || 20;

    showLoading();
    fetchSearchResults(query, episode, paged_by, currentPage);
}

// 排序表格函數
function sortTable(column) {
    if (currentSortColumn === column) {
        if (currentSortOrder === 'asc') {
            currentSortOrder = 'desc';
        } else if (currentSortOrder === 'desc') {
            currentSortOrder = 'none';
        } else {
            currentSortOrder = 'asc';
        }
    } else {
        currentSortColumn = column;
        currentSortOrder = 'asc';
    }

    let sortedData = [...window.searchResults];

    if (currentSortOrder !== 'none') {
        sortedData.sort((a, b) => {
            let valA = a[column];
            let valB = b[column];

            // 如果是數字，轉換為數字類型
            if (!isNaN(valA) && !isNaN(valB)) {
                valA = Number(valA);
                valB = Number(valB);
            }

            if (valA < valB) return currentSortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return currentSortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }

    renderTable(sortedData, window.totalCount);
}

// 更新排序圖標
function updateSortIcons(headers, activeColumn) {
    headers.forEach(header => {
        const icon = header.querySelector('.sort-icon');
        if (header.getAttribute('data-column') === activeColumn) {
            if (currentSortOrder === 'asc') {
                icon.className = 'sort-icon fas fa-sort-up';
            } else if (currentSortOrder === 'desc') {
                icon.className = 'sort-icon fas fa-sort-down';
            } else {
                icon.className = 'sort-icon';
            }
        } else {
            header.querySelector('.sort-icon').className = 'sort-icon';
        }
    });
}

// 處理 Frame 表單提交
document.getElementById('frame-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const episode = document.getElementById('frame-episode').value;
    const frame = parseInt(document.getElementById('frame-number').value);
    const video_name = document.getElementById('frame-video_name').value;

    if (!video_name) {
        alert('請選擇影片');
        return;
    }

    if (episode === "") {
        alert('請選擇集數');
        return;
    }

    if (isNaN(frame)) {
        alert('請輸入有效的幀數');
        return;
    }

    showLoading();

    try {
        const response = await fetch(`${API_URL}/frame` + `?episode=${episode}&frame=${frame}&video_name=${video_name}`, {
            method: 'GET',
            ...getCurrentFetchConfig()
        });
        if (!response.ok) throw new Error('網路錯誤');

        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);

        // 顯示成功提示
        const displayArea = document.getElementById('display-area');
        displayArea.innerHTML = `
            <div class="alert alert-success" role="alert">
                <i class="fas fa-check-circle"></i> 圖片生成成功！
            </div>
            <div class="text-center m-3">
                <picture>
                    <source srcset="${imageUrl}" type="image/webp">
                    <img src="${imageUrl}" alt="Frame Image" class="img-fluid rounded">
                </picture>
                <p class="mt-2">集數：${episode}，幀數：${frame}，影片：${video_name}</p>
                <a href="${imageUrl}" download="frame_${episode}_${frame}_${video_name}.webp" class="btn btn-primary download-button">
                    <i class="fas fa-download"></i> 下載圖片
                </a>
            </div>
        `;

    } catch (error) {
        showError(error.message);
    }
});

function handleGenerateFrame(event) {
    const episode = event.target.getAttribute('data-episode');
    const frame = event.target.getAttribute('data-frame');
    const video_name = event.target.getAttribute('data-video_name');
    // 填充 Frame 表單
    document.getElementById('frame-episode').value = episode;
    document.getElementById('frame-number').value = frame;
    document.getElementById('frame-video_name').value = video_name;

    // 切換到 Frame 標籤
    document.querySelector('a[href="#frame"]').click();
}

function handleGenerateGif(event) {
    const episode = event.target.getAttribute('data-episode');
    const start = event.target.getAttribute('data-start');
    const end = event.target.getAttribute('data-end');
    const video_name = event.target.getAttribute('data-video_name');
    // 填充 GIF 表單
    document.getElementById('gif-episode').value = episode;
    document.getElementById('gif-start').value = start;
    document.getElementById('gif-end').value = end;
    document.getElementById('gif-video_name').value = video_name;

    // 切換到 GIF 標籤
    document.querySelector('a[href="#gif"]').click();
}
