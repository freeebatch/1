
function sendVideoUrl(element) {
    const videoUrl = element.getAttribute('video-url');
    const backendEndpoint = `/play?videoUrl=${encodeURIComponent(videoUrl)}`;
    window.location.href = backendEndpoint;
}

function freeVideoUrl(element) {
    const videoUrl = element.getAttribute('video-url');
    window.location.href = videoUrl;
}

function downloadPdf(url, filename) {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
}

function playVideoOnVlc(button, videoId) {
    const qualityOptions = `
        <a href="/redirect-to-vlc?v=${videoId}&quality=240" target="_blank">240p</a>
        <a href="/redirect-to-vlc?v=${videoId}&quality=360" target="_blank">360p</a>
        <a href="/redirect-to-vlc?v=${videoId}&quality=480" target="_blank">480p</a>
        <a href="/redirect-to-vlc?v=${videoId}&quality=720" target="_blank">720p</a>
    `;
    button.innerHTML = qualityOptions;
}

function copyDownloadLink(videoId, event) {
    const dashboardLink = `https://1-navy-nine.vercel.app/download/${videoId}/master.m3u8`;
    const tempInput = document.createElement('input');
    tempInput.value = dashboardLink;
    document.body.appendChild(tempInput);
    tempInput.select();
    tempInput.setSelectionRange(0, 99999);
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    alert("1dm download link copied to your clipbord ✅✅")
}

function extractVideoId(link) {
    const parts = link.split('/');
    const code = parts[parts.length - 2];
    return code;
}


document.addEventListener('DOMContentLoaded', async function () {
    const buttons = document.querySelectorAll('.list button');

    buttons.forEach(button => {
        button.addEventListener('click', async function () {
            buttons.forEach(btn => {
                btn.classList.remove('active');
                btn.classList.add('inactive');
            });
            this.classList.remove('inactive');
            this.classList.add('active');

            const contentParagraphs = document.querySelectorAll('#content div');
            contentParagraphs.forEach(paragraph => {
                paragraph.style.display = 'none';
            });

            const buttonId = this.id;
            const contentId = `${buttonId}-content`;
            const contentElement = document.getElementById(contentId);
            if (contentElement) {
                const batchNameSlug = contentElement.getAttribute("batchNameSlug")
                const subjectSlug = contentElement.getAttribute("subjectSlug")
                const chapterSlug = contentElement.getAttribute("chapterSlug")
                contentElement.style.display = 'block';
                console.log(contentElement)
                const contentElementContainer = document.querySelector(`#${contentId} .container`);
                const url = `/batches/${batchNameSlug}/subject/${subjectSlug}/contents/${chapterSlug}/${buttonId}`;
                try {
                    const response = await fetch(url);
                    if (buttonId == "lectures" || buttonId == "dppVideos") {
                        const videosBatch = await response.json();
                        if (videosBatch.data.length > 0) {
                            videosBatch.data.forEach(video => {
                                contentElementContainer.innerHTML += `
                    <div class="video-card" onclick="${video.videoDetails.videoUrl ? 'sendVideoUrl(this)' : 'freeVideoUrl(this)'}" video-url="${video.videoDetails.videoUrl ? video.videoDetails.videoUrl : video.videoDetails.embedCode}">
                        <div class="thumbnail-container">
                            <img class="thumbnail" src="${video.videoDetails.image}" alt="Thumbnail">
                            <img class="play-icon" src="/images/blue-play-icon.svg" alt="Play icon">
                        </div>
                        <div class="info">
                            <div class="info__time">
                                <div class="date">${video.date}</div>
                                <div class="duration">
                                    <img class="clock-icon" src="/images/clock.svg" alt="Clock">
                                    <span>${video.videoDetails.duration}</span>
                                </div>
                            </div>
                            <p class="title">${video.videoDetails.name.split(' ').length > 10 ? video.videoDetails.name.split(' ').slice(0, 10).join(' ') + ' ...' : video.videoDetails.name}</p>
                        </div>
                                ${video.videoDetails.videoUrl ? `
                        <div class="download" onclick="event.stopPropagation(); copyDownloadLink('${extractVideoId(video.videoDetails.videoUrl)}')">
                            <button>1dm Download Link</button>
                        </div>` : ''}
                    </div>`;

                            });
                        } else {
                            contentElementContainer.innerHTML = `<img src="/images/coming-soon.png" alt="">`
                        }
                    }
                    else if (buttonId == 'notes' || buttonId == 'dpp') {
                        const videoNotes = await response.json();
                        if (videoNotes.data.length > 0) {
                            videoNotes.data.forEach(pdf => {
                                contentElementContainer.innerHTML += `
                                    <div class="container" onclick="downloadPdf('${pdf.pdfUrl}', '${pdf.pdfName}')">
                                        <div class="card__pdf">
                                            <div class="content__pdf">
                                                <p class="attachment-text">${pdf.topic.split(' ').length > 10 ? pdf.topic.split(' ').slice(0, 10).join(' ') + ' ...' : pdf.topic}</p>
                                            </div>
                                            <div class="play-div">
                                                <i class="ri-file-pdf-2-fill"></i>
                                                <i class="ri-download-fill"></i>
                                            </div>
                                        </div>
                                    </div>
                            `;
                            });
                        } else {
                            contentElementContainer.innerHTML = `<img src="/images/coming-soon.png" alt="">`
                        }
                    }
                } catch (error) {
                    console.error('Error fetching data:', error);
                }

            }
        });
    });
});
