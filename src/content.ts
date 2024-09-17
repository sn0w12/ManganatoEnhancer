import { Logger } from "./logger";
import { Settings } from "./settings";

class MangaNato {
    private logger = new Logger("Manganato");
    private progressBar = document.createElement("div");
    private totalPages = 0;
    private images!: NodeListOf<HTMLImageElement>;
    private settings: Settings = new Settings();
    static maxChapters = 50;

    constructor() {
        this.addSettings();
        this.initializeImages();
        this.addCss();
        this.adjustImageHeight();
        this.removeAdDivs();
        this.fixStyles();
        this.scrollToSavedImage();
        this.addMangaButtons();
        this.addGeneralShortcuts();
        this.addMangaProgress();
        this.addNavigationBoxes();
    }

    static saveChapterToLocalStorage(mangaChapterKey: string, closestImageIndex: number) {
        const savedChapters = JSON.parse(localStorage.getItem('savedChapters') || '[]');

        if (!savedChapters.includes(mangaChapterKey)) {
            if (savedChapters.length >= MangaNato.maxChapters) {
                const oldestKey = savedChapters.shift();
                localStorage.removeItem(oldestKey);
            }
            savedChapters.push(mangaChapterKey);
            localStorage.setItem('savedChapters', JSON.stringify(savedChapters));
        }

        // Save the current page (closest image index) to localStorage
        localStorage.setItem(mangaChapterKey, closestImageIndex.toString());
    }

    static getChapterFromLocalStorage(mangaChapterKey: string) {
        return localStorage.getItem(mangaChapterKey);
    }

    static getMangaChapterKey() {
        const url = window.location.href;
        const regex = /manga-([a-zA-Z0-9]+)\/chapter-([0-9]+)/;
        const match = url.match(regex);
        if (match) {
            return `manga-${match[1]}/chapter-${match[2]}`;
        }
    }

    private addSettings() {
        this.settings.addCategory('General Settings');
        this.settings.addCheckboxSetting('smoothScrolling', 'Smooth Scrolling', false);
        this.settings.addCategory('Shortcut Keys');
        this.settings.addTextInputSetting('nextKeys', 'Next Page', 'ArrowRight');
        this.settings.addTextInputSetting('lastKeys', 'Last Page', 'ArrowLeft');
    }

    initializeImages() {
        const pageDiv = document.querySelector(".container-chapter-reader");
        if (!pageDiv) {
            this.logger.log("Not on manga page.")
            return;
        }
        this.images = pageDiv.querySelectorAll('img');
        this.totalPages = this.images.length;
    }

    scrollToImage(index: number, position: 'start' | 'center' | 'end' | 'nearest') {
        const behavior = this.settings.getSetting("smoothScrolling") ? 'smooth' : 'auto';
        if (index >= 0 && index < this.totalPages) {
            this.images[index].scrollIntoView({ behavior: behavior, block: position });
            //closestImageIndex = index; // Update the current image index
        }
    }

    scrollToSavedImage() {
        const mangaChapterKey = MangaNato.getMangaChapterKey();
        if (mangaChapterKey) {
            const savedPage = MangaNato.getChapterFromLocalStorage(mangaChapterKey);
            if (savedPage) {
                this.scrollToImage(parseInt(savedPage), "start");
            }
        }
    }

    addCss() {
        const style = document.createElement('style');
        style.innerHTML = `
.progressbar-parent {
    height: 100vh;
    position: fixed;
    top: 0px;
    right: 0px;
    width: 15px;
    padding: 5px;
    box-sizing: border-box;
    background-color: transparent;
}
.progress-bar {
    height: 100%;
    width: 100%;
    background-color: transparent;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 2.5px;
    align-items: center;
}
.page-rect {
    width: 100%;
    flex-grow: 1;
    background-color: #3e3e3e;
    border-radius: 4px;
    transition: background-color 0.25s ease;
    cursor: pointer;
}
.page-rect.selected {
    background-color: #ff5417 !important;
}
.page-rect:hover {
    background-color: #ff9069 !important;
}
.navigation-box {
    position: fixed;
    top: 0;
    bottom: 0;
    width: 40vw;
    background-color: rgba(0, 0, 0, 0);
    z-index: 100;
    cursor: pointer;
}
.navigation-box.left {
    width: 30vw;
    left: 30px;
}
.navigation-box.right {
    right: 30px;
}`;
        document.head.appendChild(style);
    }

    addNavigationBoxes() {
        const leftBox = document.createElement('div');
        leftBox.classList.add('navigation-box', 'left');
        leftBox.addEventListener('click', () => this.emulateKeyPress('ArrowLeft'));

        const rightBox = document.createElement('div');
        rightBox.classList.add('navigation-box', 'right');
        rightBox.addEventListener('click', () => this.emulateKeyPress('ArrowRight'));

        document.body.appendChild(leftBox);
        document.body.appendChild(rightBox);
    }

    emulateKeyPress(key: string) {
        const event = new KeyboardEvent('keydown', {
            key: key,
            code: key,
            keyCode: key === 'ArrowRight' ? 39 : 37,
            which: key === 'ArrowRight' ? 39 : 37,
            bubbles: true,
            cancelable: true,
            ctrlKey: true
        });
        document.dispatchEvent(event);
    }

    adjustImageHeight() {
        const images = document.querySelectorAll<HTMLImageElement>('.container-chapter-reader img');
        let allImagesBelowThreshold = true;

        images.forEach(img => {
            let ratio = img.naturalHeight / img.naturalWidth;
            if (ratio > 2.5) {
                allImagesBelowThreshold = false;
            }
        });

        const imageHeight = allImagesBelowThreshold ? '100vh' : '450px';
        images.forEach(img => {
            img.style.height = imageHeight;
            img.style.zIndex = '10';
            img.style.position = 'relative';
        });
    }

    fixStyles() {
        const topDiv = document.querySelector<HTMLDivElement>(".silder-title");
        if (topDiv) {
            topDiv.style.width = "100%";
            topDiv.style.height = "100%"
        }

        const panelDiv = document.querySelector<HTMLDivElement>(".panel-topview-title");
        if (panelDiv) {
            panelDiv.style.width = "100%";
        }

        const categoryDiv = document.querySelector<HTMLDivElement>(".pn-category-story-title");
        if (categoryDiv) {
            categoryDiv.style.width = "100%";
        }

        const containers = document.querySelectorAll<HTMLDivElement>(".container");
        if (containers) {
            containers.forEach(container => {
                container.style.zIndex = "1000";
                container.style.position = "relative";
            });
        }
    }

    removeAdDivs() {
        const targetDivs = document.querySelectorAll('div[style*="text-align: center;"][style*="max-width: 620px;"]');
        targetDivs.forEach(div => {
            div.remove();
        })
    }

    addGeneralShortcuts() {
        let keysPressed: { [key: string]: boolean } = {};

        function getLastPage() {
            const lastPageElement = document.querySelector<HTMLAnchorElement>(".go-p-end");
            if (lastPageElement != null && lastPageElement.textContent) {
                return parseInt(lastPageElement.textContent.substring(5).slice(0, -1));
            }
            return 0;
        }

        window.addEventListener('keyup', (event) => {
            delete keysPressed[event.key]; // Remove the key from the pressed keys list
        });

        window.addEventListener('keydown', (event) => {
            keysPressed[event.key] = true;

            if ((keysPressed['Control'] || keysPressed['Meta']) && event.key == "b") {
                window.location.href = "https://manganato.com/bookmark";
                return;
            }

            if ((keysPressed['Control'] || keysPressed['Meta']) && event.key == "m") {
                window.location.href = "https://manganato.com/";
                return;
            }

            if ((keysPressed['Control'] || keysPressed['Meta']) && event.key == "Enter") {
                const chapters = document.querySelectorAll<HTMLAnchorElement>(".chapter-name");
                if (chapters) {
                    const firstChapter = chapters[chapters.length - 1]
                    if (firstChapter) {
                        firstChapter.click();
                    }
                }
                return;
            }

            // On bookmark page
            if (window.location.href.includes("bookmark")) {
                if ((keysPressed['Control'] || keysPressed['Meta']) && event.key == "ArrowRight") {
                    let currentPage = 1;
                    const lastPage = getLastPage();
                    if (window.location.href.includes("page")) {
                        const hrefPath = window.location.href.split("/");
                        currentPage = parseInt(hrefPath[hrefPath.length - 1].split("?")[1].substring(5));
                    }
                    if (currentPage < lastPage) {
                        if (keysPressed['Shift']) {
                            window.location.href = `https://manganato.com/bookmark?page=${lastPage}`;
                            return;
                        }
                        window.location.href = `https://manganato.com/bookmark?page=${currentPage + 1}`;
                        return;
                    }
                    this.logger.popup("Already on Last Page", "warning");
                }

                if ((keysPressed['Control'] || keysPressed['Meta']) && event.key == "ArrowLeft") {
                    let currentPage = 1;
                    if (window.location.href.includes("page")) {
                        const hrefPath = window.location.href.split("/");
                        currentPage = parseInt(hrefPath[hrefPath.length - 1].split("?")[1].substring(5));
                    }
                    if (currentPage > 1) {
                        if (keysPressed['Shift']) {
                            window.location.href = `https://manganato.com/bookmark`;
                            return;
                        }
                        window.location.href = `https://manganato.com/bookmark?page=${currentPage - 1}`;
                        return;
                    }
                    this.logger.popup("Already on First Page", "warning");
                }
            }
        });
    }

    addMangaProgress() {
        const progressbarParent = document.createElement("div");
        progressbarParent.classList.add("progressbar-parent");
        this.progressBar.classList.add("progress-bar");

        for (let i = 0; i < this.totalPages; i++) {
            const pageRect = document.createElement("div");
            pageRect.classList.add("page-rect");

            // Add event listener to navigate to the corresponding page
            pageRect.addEventListener("click", () => {
                this.scrollToImage(i, "start");
            });

            this.progressBar.appendChild(pageRect);
        }

        // Append progress bar to parent container and parent container to body
        this.logger.log(this.progressBar);
        progressbarParent.appendChild(this.progressBar);
        document.body.appendChild(progressbarParent);
    }

    updateMangaProgress(currentPage: number) {
        for (let i = 0; i < this.totalPages; i++) {
            const pageRect = this.progressBar.children[i] as HTMLElement;
            if (pageRect) {
                if (i < currentPage + 1) {
                    pageRect.classList.add("selected");
                } else {
                    pageRect.classList.remove("selected");
                }
            }
        }
    }

    addMangaButtons() {
        let closestImageIndex = -1; // Keeps track of the current image index
        let scrollTimeout: number;
        const logger = this.logger;
        const images = this.images;
        logger.log(`Total images: ${this.totalPages}`, "img");

        const navigationPanel = document.querySelectorAll(".panel-navigation")[1];

        function isNavigationPanelInView() {
            const navigationPanelRect = navigationPanel.getBoundingClientRect();
            const isNavigationPanelInView = navigationPanelRect.top < window.innerHeight && navigationPanelRect.bottom > 0;
            return isNavigationPanelInView;
        }

        const localUpdateMangaProgress = this.updateMangaProgress.bind(this);
        // Function to find the closest image initially
        function findClosestImage(shouldLog = true) {
            const maxDistance = 200;
            let closestDistance = Infinity;

            // If the navigation panel is in view, set closestImageIndex to the last image
            if (isNavigationPanelInView()) {
                closestImageIndex = images.length;
                if (shouldLog) {
                    logger.log(`Outside of reader.`, "info");
                }
                localUpdateMangaProgress(closestImageIndex);
                return;
            }

            images.forEach((img, index) => {
                const distance = Math.abs(img.getBoundingClientRect().top);
                if (distance < closestDistance && distance < maxDistance) {
                    closestDistance = distance;
                    closestImageIndex = index;
                }
            });

            localUpdateMangaProgress(closestImageIndex);

            const mangaChapterKey = MangaNato.getMangaChapterKey();
            if (mangaChapterKey) {
                MangaNato.saveChapterToLocalStorage(mangaChapterKey, closestImageIndex);
            }

            if (shouldLog) {
                logger.log(`Closest image index: ${closestImageIndex}`, "img");
            }
        }

        // Find the closest image when the script runs
        findClosestImage();

        let keysPressed: { [key: string]: boolean } = {};
        const rightKeys = this.settings.getSetting("nextKeys").split(",").map((item: string) => item.trim());
        const leftKeys = this.settings.getSetting("lastKeys").split(",").map((item: string) => item.trim());

        window.addEventListener('keyup', (event) => {
            delete keysPressed[event.key]; // Remove the key from the pressed keys list
        });

        // Event listener for key presses
        window.addEventListener('keydown', (event) => {
            keysPressed[event.key] = true;

            // Key combinations
            if (keysPressed['Shift'] && rightKeys.includes(event.key)) {
                const behavior = this.settings.getSetting("smoothScrolling") ? 'smooth' : 'auto';
                navigationPanel.scrollIntoView({ behavior: behavior, block: "end" });
                findClosestImage();
                return;
            }
            if (keysPressed['Shift'] && leftKeys.includes(event.key)) {
                this.scrollToImage(0, 'start');
                findClosestImage();
                return;
            }

            if ((keysPressed['Control'] || keysPressed['Meta']) && rightKeys.includes(event.key)) {
                const nextChapterButton = navigationPanel.querySelector<HTMLButtonElement>(".navi-change-chapter-btn-next");
                if (nextChapterButton) {
                    nextChapterButton.click();
                } else {
                    this.logger.popup("No Next Chapter", "warning");
                }
                return;
            }
            if ((keysPressed['Control'] || keysPressed['Meta']) && leftKeys.includes(event.key)) {
                const lastChapterButton = navigationPanel.querySelector<HTMLButtonElement>(".navi-change-chapter-btn-prev");
                if (lastChapterButton) {
                    lastChapterButton.click();
                } else {
                    this.logger.popup("No Previous Chapter", "warning");
                }
                return;
            }
            if ((keysPressed['Control'] || keysPressed['Meta']) && keysPressed['i']) {
                const serverButtons = document.querySelectorAll<HTMLElement>(".server-image-btn");
                for (let i = 0; i < serverButtons.length; i++) {
                    const dataL = serverButtons[i].getAttribute("data-l"); // Get the value of the data-l attribute
                    if (dataL) {
                        serverButtons[i].click();
                        return;
                    }
                }
                this.logger.popup("No other server found.", "warning")
                return;
            }
            if ((keysPressed['Control'] || keysPressed['Meta']) && keysPressed['Enter']) {
                const currentUrl = window.location.href;
                const url = currentUrl.substring(0, currentUrl.lastIndexOf('/'));

                if (url) {
                    chrome.runtime.sendMessage({
                        action: "openPageAndPressButton",
                        url: url
                    }, (response) => {
                        console.log(response?.success)
                        if (response?.success === 1) {
                            this.logger.popup("Bookmarked!", "success");
                        } else if (response?.success === 2) {
                            this.logger.popup("Already Bookmarked.", "info");
                        } else {
                            this.logger.popup("Failed to Bookmark.", "error");
                        }
                    });
                } else {
                    this.logger.popup("No valid URL found.", "warning");
                }

                return;
              }

            // If at top of page scroll to first image.
            if (window.scrollY <= 100) {
                if (rightKeys.includes(event.key)) {
                    this.scrollToImage(0, 'start');
                    return;
                }
            }

            if (rightKeys.includes(event.key)) {
                if (isNavigationPanelInView()) {
                    const nextChapterButton = navigationPanel.querySelector<HTMLButtonElement>(".navi-change-chapter-btn-next");
                    if (nextChapterButton) {
                        nextChapterButton.click();
                    } else {
                        this.logger.popup("No Next Chapter", "warning");
                    }
                    return;
                }

                // Scroll to the next image (bottom)
                if (closestImageIndex < images.length - 1) {
                    this.scrollToImage(closestImageIndex + 1, 'end');
                } else if (closestImageIndex == images.length - 1) {
                    const behavior = this.settings.getSetting("smoothScrolling") ? 'smooth' : 'auto';
                    navigationPanel.scrollIntoView({ behavior: 'smooth', block: "end" });
                }
            }
            if (leftKeys.includes(event.key)) {
                // Scroll to the previous image (top)
                if (closestImageIndex > 0) {
                    this.scrollToImage(closestImageIndex - 1, 'start');
                } else if (closestImageIndex == 0) {
                    this.scrollToImage(closestImageIndex, 'start');
                }
            }
        });

        function onScrollStop() {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                findClosestImage(); // Update closest image after scrolling has stopped
            }, 50) as unknown as number;
        }

        /*
        setInterval(() => {
            findClosestImage(false);
        }, 100);
        */

        // Reset closest image on scroll to re-evaluate when scrolling has stopped
        window.addEventListener('scroll', onScrollStop);
    }
}

const mangaNatoHandler = new MangaNato;
