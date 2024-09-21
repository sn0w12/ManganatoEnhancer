import { Settings } from './utility/settings';
import { Logger } from './utility/logger';
import { ShortcutManager } from './utility/shortcutManager';

import { ChapterHandler } from './chapters/chapterHandler';
import { BookmarkHandler } from './bookmarks/bookmarkHandler';

class Manganato {
    private _chapterHandler = new ChapterHandler(this.settings, this);
    private _bookmarkHandler = new BookmarkHandler(this.settings);
    private logger: Logger;
    private shortcutManager: ShortcutManager;

    constructor(private settings: Settings) {
        this.settings = settings;
        this.logger = new Logger("Manganato");
        this.shortcutManager = new ShortcutManager();

        this.addCss();
        this.addSettings();
        this.addGeneralShortcuts();
        this.fixGeneralStyles();
    }

    private fixGeneralStyles() {
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
    }

    public getPageType(): string {
        if (window.location.href.includes("chapter")) {
            return "chapter";
        }
        if (window.location.href.includes("bookmark")) {
            return "bookmark";
        }

        return "unknown";
    }

    public get chapterHandler() {
        return this._chapterHandler;
    }

    public get bookmarkHandler() {
        return this._bookmarkHandler;
    }

    private addSettings() {
        this.settings.addCategory('General Settings');
        this.settings.addSeparator();
        this.settings.addCheckboxSetting('smoothScrolling', 'Manga Smooth Scrolling', false);
        this.settings.addCheckboxSetting('stripSmoothScrolling', 'Strip Smooth Scrolling', true);
        this.settings.addCheckboxSetting('scrollToNav', 'Scroll to Navigation After Chapter', false);
        this.settings.addCheckboxSetting('goToNextChapter', 'Go to Next Chapter After Last Page', true);
        this.settings.addCheckboxSetting('showPageCount', 'Show Page Count', false, () => {
            this.chapterHandler.updatePageCount();
        });
        this.settings.addCheckboxSetting('searchImages', 'Show Search Images', true);
        this.settings.addSeparator();
        this.settings.addCheckboxSetting('showNavigationBoxes', 'Show Navigation Boxes', false, () => {
            this.chapterHandler.addNavigationBoxes();
        });
        this.settings.addTextInputSetting('nextPageNavigationSize', 'Next Page Navigation Size', '40vw', 'text', () => {
            this.updateNavigationBoxes();
        });
        this.settings.addTextInputSetting('previousPageNavigationSize', 'Previous Page Navigation Size', '30vw', 'text', () => {
            this.updateNavigationBoxes();
        });
        this.settings.addSeparator();
        this.settings.addComboSetting('readingDirection', 'Reading Direction', ['Left to Right', 'Right to Left'], 'Left to Right', () => {
            this.chapterHandler.addNavigationBoxes();
        });
        this.settings.addTextInputSetting('pageHeight', 'Manga Page Height', '100vh');
        this.settings.addTextInputSetting('stripWidth', 'Strip Page Width', '450px');
        this.settings.addTextInputSetting('stripScroll', 'Strip Scroll Amount', '750', "number");

        this.settings.addCategory('Bookmark Settings');
        this.settings.addSeparator();
        this.settings.addCheckboxSetting('useBookmarkCache', 'Use Bookmark Cache', true);
        this.settings.addTextInputSetting('bookmarkCacheTime', 'Bookmark Cache Time (hours)', '0.5', 'number');

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

    private updateNavigationBoxes() {
        const nextPageNavigationSize = this.settings.getSetting("nextPageNavigationSize");
        const previousPageNavigationSize = this.settings.getSetting("previousPageNavigationSize");

        if (this.settings.isValidCssSize(nextPageNavigationSize) && this.settings.isValidCssSize(previousPageNavigationSize)) {
            this.addCss();
        }
    }

    private addCss() {
        const existingStyle = document.getElementById('custom-style');
        if (existingStyle) {
            existingStyle.remove();
        }

        const style = document.createElement('style');
        style.id = 'custom-style';
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
    width: ${this.settings.getSetting("nextPageNavigationSize")};
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
    width: ${this.settings.getSetting("previousPageNavigationSize")};
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
            return this.getPageType() === "bookmark";
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
}

export { Manganato };
