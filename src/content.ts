import { Logger } from "./logger";
import { Settings } from "./settings";
import { ShortcutManager } from "./shortcutManager";
import { BookmarkManager } from "./bookmarkManager";
import Fuse from 'fuse.js';

class MangaNato {
    private logger = new Logger("Manganato");
    private bookmarkManager = new BookmarkManager();
    private shortcutManager = new ShortcutManager();
    private settings = new Settings();

    private progressBar = document.createElement("div");
    private pageCount = document.createElement("div");

    private totalPages = 0;
    private currentPage = -1;

    private images!: NodeListOf<HTMLImageElement>;
    private navigationPanel!: Element;

    private isStrip = false;
    static maxChapters = 50;

    private bookmarks: any[] | undefined;
    private fuse!: Fuse<any>;

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
        this.addBookmarkSearchBar();

        this.logger.log("MangaNato Enhancer initialized.", "info");
        this.logger.log(localStorage, "", "dev");
        this.bookmarkManager.getAllBookmarks().then(bookmarks => {
            if (bookmarks) {
                this.logger.log('Bookmarks Fetched.', 'info', 'success', bookmarks);
                this.bookmarks = bookmarks;
                const options = {
                    keys: ['storyname'],
                    threshold: 0.4, // Adjust for sensitivity
                };
                this.fuse = new Fuse(this.bookmarks, options);
            } else {
                this.logger.log('No bookmarks found or an error occurred.', 'info', 'error');
            }
        });
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
        this.settings.addSeparator();
        this.settings.addCheckboxSetting('smoothScrolling', 'Manga Smooth Scrolling', false);
        this.settings.addCheckboxSetting('stripSmoothScrolling', 'Strip Smooth Scrolling', true);
        this.settings.addCheckboxSetting('scrollToNav', 'Scroll to Navigation After Chapter', false);
        this.settings.addCheckboxSetting('goToNextChapter', 'Go to Next Chapter After Last Page', true);
        this.settings.addCheckboxSetting('showPageCount', 'Show Page Count', false, () => {
            this.updatePageCount();
        });
        this.settings.addCheckboxSetting('searchImages', 'Show Search Images', true);
        this.settings.addSeparator();
        this.settings.addComboSetting('readingDirection', 'Reading Direction', ['Left to Right', 'Right to Left'], 'Left to Right', () => {
            this.addNavigationBoxes();
        });
        this.settings.addTextInputSetting('pageHeight', 'Manga Page Height', '100vh');
        this.settings.addTextInputSetting('stripWidth', 'Strip Page Width', '450px');
        this.settings.addTextInputSetting('stripScroll', 'Strip Scroll Amount', '750', "number");

        this.settings.addCategory('Shortcut Keys', '', false);
        this.settings.addSeparator();
        this.settings.addKeyBindingSetting('homeKeys', 'Home', 'Control+m');
        this.settings.addKeyBindingSetting('bookmarksKeys', 'Bookmarks', 'Control+b');

        this.settings.addCategory('Manga Shortcut Keys', '', false);
        this.settings.addSeparator();
        this.settings.addKeyBindingSetting('nextKeys', 'Next Page', 'ArrowRight');
        this.settings.addKeyBindingSetting('previousKeys', 'Previous Page', 'ArrowLeft');
        this.settings.addKeyBindingSetting('lastPageKeys', 'Last Page', 'Shift+ArrowRight');
        this.settings.addKeyBindingSetting('firstPageKeys', 'First Page', 'Shift+ArrowLeft');
        this.settings.addKeyBindingSetting('nextChapterKeys', 'Next Chapter', 'Control+ArrowRight');
        this.settings.addKeyBindingSetting('previousChapterKeys', 'Previous Chapter', 'Control+ArrowLeft');
        this.settings.addKeyBindingSetting('bookmarkKeys', 'Bookmark', 'Control+Enter');
        this.settings.addKeyBindingSetting('serverKeys', 'Image Server', 'Control+i');

        this.settings.addCategory('Manga Page Shortcut Keys', 'On a mangas main page.', false);
        this.settings.addSeparator();
        this.settings.addKeyBindingSetting('firstChapterKey', 'First Chapter', 'Control+Enter');

        this.settings.addCategory('Bookmarks Page Shortcut Keys', 'In your bookmarks page.', false);
        this.settings.addSeparator();
        this.settings.addKeyBindingSetting('nextBookmarkPageKeys', 'Next Page', 'Control+ArrowRight');
        this.settings.addKeyBindingSetting('previousBookmarkPageKeys', 'Previous Page', 'Control+ArrowLeft');
        this.settings.addKeyBindingSetting('lastBookmarkPageKeys', 'Last Page', 'Control+Shift+ArrowRight');
        this.settings.addKeyBindingSetting('firstBookmarkPageKeys', 'First Page', 'Control+Shift+ArrowLeft');
    }

    addBookmarkSearchBar() {
        if (!window.location.href.includes("bookmark")) {
            return;
        }

        const sideContainer = document.querySelector(".container-main-right");
        const topView = sideContainer?.children[1];

        const searchBody = document.createElement("div");
        searchBody.classList.add("panel-topview");

        const searchHeader = document.createElement("h2");
        searchHeader.textContent = "Search Bookmarks";
        searchHeader.classList.add("panel-topview-title");
        searchHeader.style.width = "100%";

        const searchBar = document.createElement("input");
        searchBar.type = "text";
        searchBar.placeholder = "Search...";
        searchBar.classList.add("custom-search-bar");

        const resultsContainer = document.createElement("div");
        resultsContainer.classList.add("bookmark-search-results-dropdown");
        resultsContainer.style.display = "none"; // Initially hidden

        // Event listeners
        searchBar.addEventListener("input", async (event) => {
            const query = searchBar.value.trim().toLowerCase();

            if (query === "") {
                // Hide modal if search is empty
                resultsContainer.style.display = "none";
                return;
            }

            if (!this.bookmarks || this.bookmarks.length === 0) {
                // Show placeholder and fetch bookmarks
                resultsContainer.innerHTML = "<p>Fetching bookmarks...</p>";
                resultsContainer.style.display = "block";
                return;
            }

            if (this.bookmarks.length === 0) {
                // No bookmarks found after fetching
                resultsContainer.innerHTML = "<p>No bookmarks found.</p>";
                resultsContainer.style.display = "block";
                return;
            }

            // Filter bookmarks based on the query
            /*
            const filteredBookmarks = this.bookmarks.filter((bookmark) =>
                bookmark.storyname.toLowerCase().includes(query)
            );
            */

            const fuseResults = this.fuse.search(query);
            const filteredBookmarks = fuseResults.map(result => result.item);
            this.logger.log(filteredBookmarks, "", "dev");

            // Display the search results
            this.displaySearchResults(filteredBookmarks, resultsContainer);

            // Show modal if there are results or fetching
            resultsContainer.style.display = "block";
        });

        searchBody.appendChild(searchHeader);
        searchBody.appendChild(searchBar);
        searchBody.appendChild(resultsContainer);
        if (topView) {
            sideContainer?.insertBefore(searchBody, topView);
        }
    }

    private displaySearchResults(bookmarks: any[], container: HTMLElement): void {
        container.innerHTML = ""; // Clear previous results

        if (bookmarks.length === 0) {
            container.innerHTML = "<p>No matching bookmarks found.</p>";
            return;
        }

        const list = document.createElement("ul");
        list.classList.add("bookmark-list");

        bookmarks.forEach((bookmark) => {
            const listItem = document.createElement("li");
            listItem.classList.add("bookmark-item");

            if (this.settings.getSetting("searchImages")) {
                const image = document.createElement("img");
                image.src = bookmark.image;
                image.alt = bookmark.storyname;
                listItem.appendChild(image);
            }

            const link = document.createElement("a");
            link.href = bookmark.link_chapter_now;
            link.textContent = bookmark.storyname;

            listItem.appendChild(link);
            list.appendChild(listItem);
        });

        container.appendChild(list);
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
    left: 30px;
}
.navigation-box.right {
    right: 30px;
}
.navigation-box.sub {
    width: 30vw;
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
.page-selector-input {
    width: 50px;
    padding: 8px 12px;
    margin-right: 5px;
    color: #666;
    font: 700 11px sans-serif;
    border: none;
}
.page-selector-input:focus {
    -moz-box-shadow: inset 0 0 0 4px #dedede;
    -webkit-box-shadow: inset 0 0 0 4px #dedede;
    box-shadow: inset 0 0 0 4px #dedede;
}
.custom-search-bar {
    background-color: #3e3e3e;
    color: #d0d0d0;
    width: 100%;
    border: none;
    padding: 10px 5px;
}

/* Position the results container as a dropdown */
.bookmark-search-results-dropdown {
    position: absolute;
    top: 100%; /* Position it below the search bar */
    left: 0;
    right: 0;
    background-color: #3e3e3e;
    border: 1px solid #ccc;
    max-height: 300px;
    overflow-y: auto;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* Search Results */
.bookmark-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.bookmark-item {
    padding: 8px 12px;
    cursor: pointer;
    border-bottom: 1px solid #ccc;
    display: flex;
    align-items: center;
}

.bookmark-item:last-child {
    border-bottom: none;
}

.bookmark-item:hover {
    background-color: #ff5417;
}

.bookmark-item a {
    text-decoration: none;
    color: #d0d0d0;
    display: block;
}

.bookmark-item a:hover {
    text-decoration: none;
}

.bookmark-item img {
    width: 40px;
    height: 40px;
    object-fit: cover;
    margin-right: 10px;
    border-radius: 5px;
}

/* Style for the "No matching bookmarks found" message */
.bookmark-search-results-dropdown p {
    padding: 8px 12px;
    margin: 0;
    color: #d0d0d0;
}
`;
        document.head.appendChild(style);
    }

    getReadingDirection() {
        return this.settings.getSetting("readingDirection") === "Left to Right" ? true : false;
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

    goToNextPage() {
        if (this.isNavigationPanelInView()) {
            this.goToNextChapter();
            return;
        }

        if (this.isStrip) {
            const stripBehavior = this.settings.getSetting("stripSmoothScrolling") ? "smooth" : "auto";
            const scrollAmount = parseInt(this.settings.getSetting("stripScroll"));
            window.scrollBy({
                top: scrollAmount,
                left: 0,
                behavior: stripBehavior,
            });
            return;
        }

        const behavior = this.settings.getSetting("smoothScrolling") ? "smooth" : "auto";
        // Scroll to the next image (bottom)
        if (this.currentPage < this.totalPages - 1) {
            this.scrollToImage(this.currentPage + 1, "end");
        } else if (this.currentPage === this.totalPages - 1 && this.settings.getSetting("scrollToNav")) {
            this.navigationPanel.scrollIntoView({ behavior: behavior, block: "end" });
        } else {
            this.goToNextChapter();
        }
    }

    goToPreviousPage() {
        const behavior = this.settings.getSetting("stripSmoothScrolling") ? "smooth" : "auto";
        if (this.isStrip) {
            const scrollAmount = parseInt(this.settings.getSetting("stripScroll"));
            window.scrollBy({
                top: -scrollAmount,
                left: 0,
                behavior: behavior,
            });
            return;
        }

        // Scroll to the previous image (top)
        if (this.currentPage > 0) {
            this.scrollToImage(this.currentPage - 1, "start");
        } else if (this.currentPage === 0) {
            this.scrollToImage(this.currentPage, "start");
        }
    }

    addNavigationBoxes() {
        if (!window.location.href.includes("chapter")) {
            return;
        }
        const existingBoxes = document.querySelectorAll('.navigation-box');
        existingBoxes.forEach(box => box.remove());
        const readingDirection = this.getReadingDirection();

        const leftBox = document.createElement('div');
        leftBox.classList.add('navigation-box', readingDirection ? 'sub' : 'main', 'left');

        const rightBox = document.createElement('div');
        rightBox.classList.add('navigation-box', readingDirection ? 'main' : 'sub', 'right');

        if (readingDirection) {
            // Left to Right reading direction
            leftBox.addEventListener('click', () => this.goToPreviousPage());
            rightBox.addEventListener('click', () => this.goToNextPage());
        } else {
            // Right to Left reading direction
            leftBox.addEventListener('click', () => this.goToNextPage());
            rightBox.addEventListener('click', () => this.goToPreviousPage());
        }

        document.body.appendChild(leftBox);
        document.body.appendChild(rightBox);
    }

    adjustImageHeight() {
        const images = document.querySelectorAll<HTMLImageElement>('.container-chapter-reader img');
        let allImagesBelowThreshold = true;

        const pageHeight = this.settings.getSetting("pageHeight");
        const stripWidth = this.settings.getSetting("stripWidth");

        images.forEach(img => {
            let ratio = img.naturalHeight / img.naturalWidth;
            if (ratio > 2.5) {
                allImagesBelowThreshold = false;
            }
        });

        const imageHeight = allImagesBelowThreshold ? pageHeight : stripWidth;
        const imageOrientation = allImagesBelowThreshold ? "height" : "width";
        images.forEach(img => {
            img.style[imageOrientation as 'height' | 'width'] = imageHeight;
            img.style.zIndex = '10';
            img.style.position = 'relative';
        });

        if (imageOrientation === "width") {
            this.isStrip = true;
        }
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
        if (containers && window.location.href.includes("chapter")) {
            containers.forEach(container => {
                container.style.zIndex = "1000";
                container.style.position = "relative";
            });
        }

        const logger = this.logger;
        var observer = new MutationObserver(function(mutations){
            const pageSelector = document.querySelector<HTMLDivElement>(".group-page");
            if(pageSelector) {
                observer.disconnect(); // to stop observing the dom

                const lastPageElement = document.querySelector<HTMLAnchorElement>(".go-p-end");
                let lastPage = 100;
                if (lastPageElement && lastPageElement.textContent) {
                    lastPage = parseInt(lastPageElement.textContent.replace(/[^\d]/g, ''));
                }

                const pageSelectorInput = document.createElement("input");
                pageSelectorInput.classList.add("page-selector-input");
                pageSelectorInput.type = "number";
                pageSelectorInput.min = "1";
                pageSelectorInput.max = lastPage.toString();
                pageSelectorInput.placeholder = "...";

                pageSelectorInput.addEventListener('keydown', function(event) {
                    if (event.key === 'Enter') {
                        const pageNumber = parseInt(pageSelectorInput.value);
                        if (!pageSelectorInput.value) {
                            logger.popup("Please enter a page number", "warning");
                            return;
                        }
                        if (pageNumber > lastPage || pageNumber < 1) {
                            logger.popup(`Page ${pageNumber} doesn't exist`, "warning");
                            return;
                        }
                        window.location.href = `https://manganato.com/bookmark?page=${pageNumber}`;
                    }
                });

                const insertElement = pageSelector.children[pageSelector.children.length - 1];
                pageSelector.insertBefore(pageSelectorInput, insertElement);
            }
        })

        const pageSelectorParent = document.querySelector<HTMLDivElement>(".bookmark-content");
        if (pageSelectorParent) {
            observer.observe(pageSelectorParent, {
                childList: true,
                subtree: true
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
        if (this.settings.getSetting("showPageCount") === false || this.totalPages === 0) {
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

    isNavigationPanelInView() {
        if (this.navigationPanel) {
            const navigationPanelRect = this.navigationPanel.getBoundingClientRect();
            return (
                navigationPanelRect.top < window.innerHeight && navigationPanelRect.bottom > 0
            );
        }
        return false;
    };

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
            this.navigationPanel.scrollIntoView({ behavior: behavior, block: "end" });
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
            this.goToNextPage();
        }, chapterCondition);

        shortcutManager.registerShortcut(previousPageKeys, () => {
            this.goToPreviousPage();
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
