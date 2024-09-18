import { Logger } from "./logger";
import { Settings } from "./settings";
import { ShortcutManager } from "./shortcutManager";

class MangaNato {
    private logger = new Logger("Manganato");
    private shortcutManager = new ShortcutManager();
    private progressBar = document.createElement("div");
    private pageCount = document.createElement("div");
    private totalPages = 0;
    private currentPage = -1;
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

        this.logger.log("MangaNato Enhancer initialized.", "info");
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
        this.settings.addCheckboxSetting('showPageCount', 'Show Page Count', false, () => {
            this.updatePageCount();
        });

        this.settings.addCategory('Shortcut Keys', '', false);
        this.settings.addKeyBindingSetting('homeKeys', 'Home', 'Control+m');
        this.settings.addKeyBindingSetting('bookmarksKeys', 'Bookmarks', 'Control+b');

        this.settings.addCategory('Manga Shortcut Keys', '', false);
        this.settings.addKeyBindingSetting('nextKeys', 'Next Page', 'ArrowRight');
        this.settings.addKeyBindingSetting('previousKeys', 'Previous Page', 'ArrowLeft');
        this.settings.addKeyBindingSetting('lastPageKeys', 'Last Page', 'Shift+ArrowRight');
        this.settings.addKeyBindingSetting('firstPageKeys', 'First Page', 'Shift+ArrowLeft');
        this.settings.addKeyBindingSetting('nextChapterKeys', 'Next Chapter', 'Control+ArrowRight');
        this.settings.addKeyBindingSetting('previousChapterKeys', 'Previous Chapter', 'Control+ArrowLeft');
        this.settings.addKeyBindingSetting('bookmarkKeys', 'Bookmark', 'Control+Enter');
        this.settings.addKeyBindingSetting('serverKeys', 'Image Server', 'Control+i');

        this.settings.addCategory('Manga Page Shortcut Keys', 'On a mangas main page.', false);
        this.settings.addKeyBindingSetting('firstChapterKey', 'First Chapter', 'Control+Enter');

        this.settings.addCategory('Bookmarks Page Shortcut Keys', 'In your bookmarks page.', false);
        this.settings.addKeyBindingSetting('nextBookmarkPageKeys', 'Next Page', 'Control+ArrowRight');
        this.settings.addKeyBindingSetting('previousBookmarkPageKeys', 'Previous Page', 'Control+ArrowLeft');
        this.settings.addKeyBindingSetting('lastBookmarkPageKeys', 'Last Page', 'Control+Shift+ArrowRight');
        this.settings.addKeyBindingSetting('firstBookmarkPageKeys', 'First Page', 'Control+Shift+ArrowLeft');
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
}
.page-count {
    position: fixed;
    bottom: 5px;
    left: 0;
    padding: 5px;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;
    z-index: 100;
    border-radius: 5px;
}
.page-count span {
    color: #ff5417;
}
`;
        document.head.appendChild(style);
    }

    addNavigationBoxes() {
        const leftBox = document.createElement('div');
        leftBox.classList.add('navigation-box', 'left');
        leftBox.addEventListener('click', () => this.scrollToImage(this.currentPage - 1, 'start'));

        const rightBox = document.createElement('div');
        rightBox.classList.add('navigation-box', 'right');
        rightBox.addEventListener('click', () => {
            if (this.currentPage + 1 < this.totalPages) {
                this.scrollToImage(this.currentPage + 1, 'start')
                return;
            } else {
                const nextChapterButton = document.querySelector<HTMLButtonElement>(".navi-change-chapter-btn-next");
                if (nextChapterButton) {
                    nextChapterButton.click();
                } else {
                    this.logger.popup("No Next Chapter", "warning");
                }
            }
        });

        document.body.appendChild(leftBox);
        document.body.appendChild(rightBox);
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
        const shortcutManager = this.shortcutManager;

        // Helper functions
        const navigateTo = (url: string) => {
            if (window.location.href === url) {
                return;
            }
            if (!url.startsWith("http")) {
                this.logger.log("Invalid URL", "", "error");
                return;
            }
            window.location.href = url;
        };

        const isOnBookmarkPage = () => {
            return window.location.href.includes("bookmark");
        };

        const getCurrentBookmarkPage = (): number => {
            const match = window.location.href.match(/page=(\d+)/);
            return match ? parseInt(match[1]) : 1;
        };

        const getLastBookmarkPage = (): number => {
            const lastPageElement = document.querySelector<HTMLAnchorElement>(".go-p-end");
            if (lastPageElement && lastPageElement.textContent) {
                return parseInt(lastPageElement.textContent.replace(/[^\d]/g, ''));
            }
            return 1;
        };

        // Load user settings
        const homeKeys = this.settings.getSetting("homeKeys").split(",").map((key: string) => key.trim());
        const bookmarksKeys = this.settings.getSetting("bookmarksKeys").split(",").map((key: string) => key.trim());
        const firstChapterKey = this.settings.getSetting("firstChapterKey").split(",").map((key: string) => key.trim());

        const nextBookmarkPageKeys = this.settings.getSetting("nextBookmarkPageKeys").split(",").map((key: string) => key.trim());
        const previousBookmarkPageKeys = this.settings.getSetting("previousBookmarkPageKeys").split(",").map((key: string) => key.trim());
        const lastBookmarkPageKeys = this.settings.getSetting("lastBookmarkPageKeys").split(",").map((key: string) => key.trim());
        const firstBookmarkPageKeys = this.settings.getSetting("firstBookmarkPageKeys").split(",").map((key: string) => key.trim());

        // Register shortcuts
        shortcutManager.registerShortcut(
            homeKeys,
            () => navigateTo("https://manganato.com/")
        );

        shortcutManager.registerShortcut(
            bookmarksKeys,
            () => navigateTo("https://manganato.com/bookmark")
        );

        shortcutManager.registerShortcut(
            firstChapterKey,
            () => {
                const chapters = document.querySelectorAll<HTMLAnchorElement>(".chapter-name");
                if (chapters.length > 0) {
                    const firstChapter = chapters[chapters.length - 1];
                    firstChapter.click();
                }
            }
        );

        // Bookmark page navigation
        const bookmarkNavigationCondition = isOnBookmarkPage;

        shortcutManager.registerShortcut(
            nextBookmarkPageKeys,
            () => {
                const currentPage = getCurrentBookmarkPage();
                const lastPage = getLastBookmarkPage();
                if (currentPage < lastPage) {
                    navigateTo(`https://manganato.com/bookmark?page=${currentPage + 1}`);
                } else {
                    this.logger.popup("Already on Last Page", "warning");
                }
            },
            bookmarkNavigationCondition
        );

        shortcutManager.registerShortcut(
            lastBookmarkPageKeys,
            () => {
                const lastPage = getLastBookmarkPage();
                navigateTo(`https://manganato.com/bookmark?page=${lastPage}`);
            },
            bookmarkNavigationCondition
        );

        shortcutManager.registerShortcut(
            previousBookmarkPageKeys,
            () => {
                const currentPage = getCurrentBookmarkPage();
                if (currentPage > 1) {
                    navigateTo(`https://manganato.com/bookmark?page=${currentPage - 1}`);
                } else {
                    this.logger.popup("Already on First Page", "warning");
                }
            },
            bookmarkNavigationCondition
        );

        shortcutManager.registerShortcut(
            firstBookmarkPageKeys,
            () => {
                navigateTo("https://manganato.com/bookmark");
            },
            bookmarkNavigationCondition
        );
    }

    updatePageCount() {
        if (this.settings.getSetting("showPageCount") === false) {
            this.pageCount.style.display = "none";
            return;
        }

        this.pageCount.style.display = "block";
        this.pageCount.innerHTML = `${this.currentPage + 1} <span>/</span> ${this.totalPages}`;
        if (this.images.length === 0) {
            return;
        }
        const firstImage = this.images[0];
        const firstImageRect = firstImage.getBoundingClientRect();
        const pageRect = this.pageCount.getBoundingClientRect();
        const leftPosition = firstImageRect.left - pageRect.width - 5;
        this.pageCount.style.left = `${leftPosition}px`;
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

    updateMangaProgress(currentPage: number) {
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

    addMangaButtons() {
        let closestImageIndex = -1; // Keeps track of the current image index
        let scrollTimeout: number;
        const logger = this.logger;
        const images = this.images;
        logger.log(`Total images: ${this.totalPages}`, "img");

        const navigationPanel = document.querySelectorAll(".panel-navigation")[1];

        const isNavigationPanelInView = () => {
            if (navigationPanel) {
                const navigationPanelRect = navigationPanel.getBoundingClientRect();
                return (
                    navigationPanelRect.top < window.innerHeight && navigationPanelRect.bottom > 0
                );
            }
            return false;
        };

        const localUpdateMangaProgress = this.updateMangaProgress.bind(this);

        // Function to find the closest image initially
        const findClosestImage = (shouldLog = true) => {
            if (!images) {
                return;
            }
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
            navigationPanel.scrollIntoView({ behavior: behavior, block: "end" });
            findClosestImage();
        }, chapterCondition);

        shortcutManager.registerShortcut(firstPageKeys, () => {
            this.scrollToImage(0, "start");
            findClosestImage();
        }, chapterCondition);

        shortcutManager.registerShortcut(nextChapterKeys, () => {
            const nextChapterButton = navigationPanel.querySelector<HTMLButtonElement>(
                ".navi-change-chapter-btn-next"
            );
            if (nextChapterButton) {
                nextChapterButton.click();
            } else {
                this.logger.popup("No Next Chapter", "warning");
            }
        }, chapterCondition);

        shortcutManager.registerShortcut(previousChapterKeys, () => {
            const lastChapterButton = navigationPanel.querySelector<HTMLButtonElement>(
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
            if (isNavigationPanelInView()) {
                const nextChapterButton = navigationPanel.querySelector<HTMLButtonElement>(
                    ".navi-change-chapter-btn-next"
                );
                if (nextChapterButton) {
                    nextChapterButton.click();
                } else {
                    this.logger.popup("No Next Chapter", "warning");
                }
                return;
            }

            // Scroll to the next image (bottom)
            if (closestImageIndex < images.length - 1) {
                this.scrollToImage(closestImageIndex + 1, "end");
            } else if (closestImageIndex === images.length - 1) {
                const behavior = this.settings.getSetting("smoothScrolling") ? "smooth" : "auto";
                navigationPanel.scrollIntoView({ behavior: behavior, block: "end" });
            }
        }, chapterCondition);

        shortcutManager.registerShortcut(previousPageKeys, () => {
            // Scroll to the previous image (top)
            if (closestImageIndex > 0) {
                this.scrollToImage(closestImageIndex - 1, "start");
            } else if (closestImageIndex === 0) {
                this.scrollToImage(closestImageIndex, "start");
            }
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

const mangaNatoHandler = new MangaNato;
