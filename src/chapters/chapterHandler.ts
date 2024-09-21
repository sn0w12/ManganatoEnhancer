import { PageHandler } from "./pageHandler";
import { Logger } from "../utility/logger";
import { Settings } from "../utility/settings";
import { ShortcutManager } from "../utility/shortcutManager";
import { Manganato } from "../manganato";

class ChapterHandler {
    private logger = new Logger("Manganato");
    private pageHandler = new PageHandler(this, this.settings);
    private shortcutManager = new ShortcutManager();

    private progressBar = document.createElement("div");
    private pageCount = document.createElement("div");

    public totalPages = 0;
    public currentPage = -1;
    private maxChapters = 20;

    public images!: NodeListOf<HTMLImageElement>;
    public navigationPanel!: Element;

    public isStrip = false;

    constructor(private settings: Settings, private manganato: Manganato) {
        this.settings = settings;
        this.manganato = manganato;
    }

    public initialize() {
        console.log("Chapter Handler initialized.");
        this.initializeImages();
        this.addMangaProgress();
        this.addNavigationBoxes();
        this.addMangaButtons();
        this.fixChapterStyles();
    }

    private fixChapterStyles() {
        const containers = document.querySelectorAll<HTMLDivElement>(".container");
        if (containers) {
            containers.forEach(container => {
                container.style.zIndex = "1000";
                container.style.position = "relative";
            });
        }

        const targetDivs = document.querySelectorAll('div[style*="text-align: center;"][style*="max-width: 620px;"]');
        targetDivs.forEach(div => {
            div.remove();
        })
    }

    private getMangaChapterKey() {
        const url = window.location.href;
        const regex = /manga-([a-zA-Z0-9]+)\/chapter-([0-9]+)/;
        const match = url.match(regex);
        if (match) {
            return `manga-${match[1]}/chapter-${match[2]}`;
        }
    }

    private getChapterFromLocalStorage(mangaChapterKey: string) {
        return localStorage.getItem(mangaChapterKey);
    }

    private saveChapterToLocalStorage(mangaChapterKey: string, closestImageIndex: number) {
        const savedChapters = JSON.parse(localStorage.getItem('savedChapters') || '[]');

        if (!savedChapters.includes(mangaChapterKey)) {
            if (savedChapters.length >= this.maxChapters) {
                const oldestKey = savedChapters.shift();
                localStorage.removeItem(oldestKey);
            }
            savedChapters.push(mangaChapterKey);
            localStorage.setItem('savedChapters', JSON.stringify(savedChapters));
        }

        // Save the current page (closest image index) to localStorage
        localStorage.setItem(mangaChapterKey, closestImageIndex.toString());
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

    isNavigationPanelInView() {
        if (this.navigationPanel) {
            const navigationPanelRect = this.navigationPanel.getBoundingClientRect();
            return (
                navigationPanelRect.top < window.innerHeight && navigationPanelRect.bottom > 0
            );
        }
        return false;
    };

    scrollToImage(index: number, position: 'start' | 'center' | 'end' | 'nearest') {
        const behavior = this.settings.getSetting("smoothScrolling") ? 'smooth' : 'auto';
        if (index >= 0 && index < this.totalPages) {
            this.images[index].scrollIntoView({ behavior: behavior, block: position });
        }
    }

    scrollToSavedImage() {
        const mangaChapterKey = this.getMangaChapterKey();
        if (mangaChapterKey) {
            const savedPage = this.getChapterFromLocalStorage(mangaChapterKey);
            if (savedPage) {
                this.scrollToImage(parseInt(savedPage), "start");
            }
        }
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
        progressbarParent.appendChild(this.progressBar);
        document.body.appendChild(progressbarParent);

        if (this.settings.getSetting("showPageCount")) {
            this.pageCount.classList.add("page-count", "page-count-absolute");
            this.pageCount.textContent = `${this.currentPage + 1} / ${this.totalPages}`;
            document.body.appendChild(this.pageCount);

            this.updatePageCount();
            window.addEventListener("resize", () => {
                this.updatePageCount();
            });
        }
    }

    private updateMangaProgress(currentPage: number) {
        this.currentPage = currentPage;
        this.updatePageCount();
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

    updatePageCount() {
        if (this.settings.getSetting("showPageCount") === false || this.totalPages === 0 || this.currentPage + 1 > this.totalPages) {
            this.pageCount.style.display = "none";
            return;
        }

        this.pageCount.style.display = "block";
        this.pageCount.innerHTML = `${this.currentPage + 1} <span>/</span> ${this.totalPages}`;
        if (this.images.length === 0) {
            return;
        }
        let closestImage = this.images[this.currentPage];
        if (!closestImage) {
            closestImage = this.images[0];
        }
        const closestImageRect = closestImage.getBoundingClientRect();
        const pageRect = this.pageCount.getBoundingClientRect();
        let leftPosition = closestImageRect.left - pageRect.width - 5;
        if (leftPosition < 0) {
            leftPosition = 0;
        } else if (leftPosition + pageRect.width > window.innerWidth) {
            leftPosition = window.innerWidth - pageRect.width;
        }
        this.pageCount.style.left = `${leftPosition}px`;
    }

    private getReadingDirection() {
        return this.settings.getSetting("readingDirection") === "Left to Right" ? true : false;
    }

    addNavigationBoxes() {
        if (this.manganato.getPageType() !== "chapter") {
            return;
        }

        const existingBoxes = document.querySelectorAll('.navigation-box');
        existingBoxes.forEach(box => box.remove());
        const readingDirection = this.getReadingDirection();

        const leftBox = document.createElement('div');
        leftBox.classList.add('navigation-box', readingDirection ? 'sub' : 'main', 'left');

        const rightBox = document.createElement('div');
        rightBox.classList.add('navigation-box', readingDirection ? 'main' : 'sub', 'right');

        if (this.settings.getSetting("showNavigationBoxes")) {
            leftBox.style.background = 'rgba(0, 0, 0, 0.2)';
            rightBox.style.background = 'rgba(0, 0, 0, 0.2)';
        } else {
            leftBox.style.background = 'none';
            rightBox.style.background = 'none';
        }

        if (readingDirection) {
            // Left to Right reading direction
            leftBox.addEventListener('click', () => this.pageHandler.goToPreviousPage());
            rightBox.addEventListener('click', () => this.pageHandler.goToNextPage());
        } else {
            // Right to Left reading direction
            leftBox.addEventListener('click', () => this.pageHandler.goToNextPage());
            rightBox.addEventListener('click', () => this.pageHandler.goToPreviousPage());
        }

        document.body.appendChild(leftBox);
        document.body.appendChild(rightBox);
    }

    goToNextChapter() {
        if (!this.settings.getSetting("goToNextChapter")) {
            this.logger.popup("Chapter Finished", "info");
            return;
        }
        const nextChapterButton = this.navigationPanel.querySelector<HTMLButtonElement>(
            ".navi-change-chapter-btn-next"
        );
        if (nextChapterButton) {
            nextChapterButton.click();
        } else {
            this.logger.popup("No Next Chapter", "warning");
        }
        return;
    }

    addMangaButtons() {
        let closestImageIndex = -1; // Keeps track of the current image index
        let scrollTimeout: number;
        const logger = this.logger;
        const images = this.images;
        logger.log(`Total images: ${this.totalPages}`, "img");

        this.navigationPanel = document.querySelectorAll(".panel-navigation")[1];
        const localUpdateMangaProgress = this.updateMangaProgress.bind(this);

        // Function to find the closest image initially
        const findClosestImage = (shouldLog = true) => {
            if (!images) {
                return;
            }
            const maxDistance = 200;
            let closestDistance = Infinity;

            // If the navigation panel is in view, set closestImageIndex to the last image
            if (this.isNavigationPanelInView()) {
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

            const mangaChapterKey = this.getMangaChapterKey();
            if (mangaChapterKey) {
                this.saveChapterToLocalStorage(mangaChapterKey, closestImageIndex);
            }

            if (shouldLog) {
                logger.log(`Closest image index: ${closestImageIndex}`, "img");
            }
        };

        // Find the closest image when the script runs
        findClosestImage();
        const chapterCondition = () => {
            return window.location.href.includes("chapter");
        };

        // Initialize the ShortcutManager
        const shortcutManager = this.shortcutManager;

        // Retrieve key settings
        const nextPageKeys = this.settings.getSetting("nextKeys").split(",").map((key: string) => key.trim());
        const previousPageKeys = this.settings.getSetting("previousKeys").split(",").map((key: string) => key.trim());
        const lastPageKeys = this.settings.getSetting("lastPageKeys").split(",").map((key: string) => key.trim());
        const firstPageKeys = this.settings.getSetting("firstPageKeys").split(",").map((key: string) => key.trim());
        const nextChapterKeys = this.settings.getSetting("nextChapterKeys").split(",").map((key: string) => key.trim());
        const previousChapterKeys = this.settings.getSetting("previousChapterKeys").split(",").map((key: string) => key.trim());

        const bookmarkKeys = this.settings.getSetting("bookmarkKeys").split(",").map((key: string) => key.trim());
        const serverKeys = this.settings.getSetting("serverKeys").split(",").map((key: string) => key.trim());

        // Register shortcuts
        shortcutManager.registerShortcut(lastPageKeys, () => {
            const behavior = this.settings.getSetting("smoothScrolling") ? "smooth" : "auto";
            if (this.settings.getSetting('scrollToNav')) {
                this.navigationPanel.scrollIntoView({ behavior: behavior, block: "end" });
            } else {
                this.scrollToImage(this.totalPages - 1, "end");
            }
            findClosestImage();
        }, chapterCondition);

        shortcutManager.registerShortcut(firstPageKeys, () => {
            this.scrollToImage(0, "start");
            findClosestImage();
        }, chapterCondition);

        shortcutManager.registerShortcut(nextChapterKeys, () => {
            const nextChapterButton = this.navigationPanel.querySelector<HTMLButtonElement>(
                ".navi-change-chapter-btn-next"
            );
            if (nextChapterButton) {
                nextChapterButton.click();
            } else {
                this.logger.popup("No Next Chapter", "warning");
            }
        }, chapterCondition);

        shortcutManager.registerShortcut(previousChapterKeys, () => {
            const lastChapterButton = this.navigationPanel.querySelector<HTMLButtonElement>(
                ".navi-change-chapter-btn-prev"
            );
            if (lastChapterButton) {
                lastChapterButton.click();
            } else {
                this.logger.popup("No Previous Chapter", "warning");
            }
        }, chapterCondition);

        shortcutManager.registerShortcut(serverKeys , () => {
            const serverButtons = document.querySelectorAll<HTMLElement>(".server-image-btn");
            for (let i = 0; i < serverButtons.length; i++) {
                const dataL = serverButtons[i].getAttribute("data-l"); // Get the value of the data-l attribute
                if (dataL) {
                    serverButtons[i].click();
                    return;
                }
            }
            this.logger.popup("No other server found.", "warning");
        }, chapterCondition);

        shortcutManager.registerShortcut(bookmarkKeys, () => {
            const currentUrl = window.location.href;
            const url = currentUrl.substring(0, currentUrl.lastIndexOf("/"));

            if (url) {
                chrome.runtime.sendMessage(
                    {
                        action: "openPageAndPressButton",
                        url: url,
                    },
                    (response) => {
                        if (response?.success === 1) {
                            this.logger.popup("Bookmarked!", "success");
                        } else if (response?.success === 2) {
                            this.logger.popup("Already Bookmarked.", "info");
                        } else {
                            this.logger.popup("Failed to Bookmark.", "error");
                        }
                    }
                );
            } else {
                this.logger.popup("No valid URL found.", "warning");
            }
        }, chapterCondition);

        shortcutManager.registerShortcut(
            nextPageKeys,
            () => {
                this.scrollToImage(0, "start");
            },
            () => window.scrollY <= 100 && chapterCondition()
        );

        shortcutManager.registerShortcut(nextPageKeys, () => {
            this.pageHandler.goToNextPage();
        }, chapterCondition);

        shortcutManager.registerShortcut(previousPageKeys, () => {
            this.pageHandler.goToPreviousPage();
        }, chapterCondition);

        const onScrollStop = () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                findClosestImage(); // Update closest image after scrolling has stopped
            }, 50) as unknown as number;
        };

        // Reset closest image on scroll to re-evaluate when scrolling has stopped
        window.addEventListener("scroll", onScrollStop);
    }
}

export { ChapterHandler };
