import { Settings } from "../utility/settings";
import { Logger } from "../utility/logger";
import { BookmarkManager } from "./bookmarkManager";
import Fuse from 'fuse.js';

class BookmarkHandler {
    private logger = new Logger("Manganato");
    private bookmarkManager = new BookmarkManager(this.settings);
    private fuse!: Fuse<any>;
    private bookmarks: any[] | undefined;
    private searchBar!: HTMLInputElement;

    private MAX_TABS = 5; // Maximum number of tabs to open simultaneously
    private bookmarksCopy!: any[];
    private finishedBookmarks: string[] = [];

    constructor(private settings: Settings) {
        this.settings = settings;
    }

    initialize() {
        this.fixBookmarkStyles();
        this.addBookmarkSearchBar();
        this.addExportBookmarksButton();
        if (process.env.NODE_ENV === "development") {
            this.addMALSyncButton();
        }

        this.bookmarkManager.getAllBookmarks().then(bookmarks => {
            if (bookmarks) {
                this.logger.log('Bookmarks Fetched.', 'info', 'success', bookmarks);
                this.bookmarks = bookmarks;
                this.bookmarksCopy = [...this.bookmarks];
                const options = {
                    keys: ['storyname'],
                    threshold: 0.4, // Adjust for sensitivity
                };
                this.fuse = new Fuse(this.bookmarks, options);
                this.searchBar.disabled = false;
                this.searchBar.placeholder = "Search...";
            } else {
                this.logger.log('No bookmarks found or an error occurred.', 'info', 'error');
            }
        });
    }

    private fixBookmarkStyles() {
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
        searchBar.placeholder = "Fetching Bookmarks...";
        searchBar.disabled = true;
        searchBar.classList.add("custom-search-bar");
        this.searchBar = searchBar;

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

    private addExportBookmarksButton() {
        const userOptions = document.querySelector('.box-user-options');
        if (userOptions) {
            const exportButton = this.createExportButton();
            const insertElement = userOptions.children[3];
            if (insertElement) {
                userOptions.insertBefore(exportButton, insertElement);
            } else {
                userOptions.appendChild(exportButton);
            }
        }
    }

    private addMALSyncButton() {
        const userOptions = document.querySelector('.box-user-options');
        if (userOptions) {
            const button = this.createMALSyncButton();
            const insertElement = userOptions.children[4];
            if (insertElement) {
                userOptions.insertBefore(button, insertElement);
            } else {
                userOptions.appendChild(button);
            }
        }
    }

    private processNextBookmark() {
        if (!this.bookmarksCopy) {
            return;
        }

        if (this.bookmarksCopy.length > 0) {
            const nextBookmark = this.bookmarksCopy.shift();
            if (nextBookmark) {
                chrome.runtime.sendMessage(
                    {
                        action: "processBookmark",
                        url: nextBookmark.link_chapter_now,
                    },
                    (response) => {
                        if (response.success === 0) {
                            this.logger.popup(`Failed to process bookmark: ${nextBookmark.storyname}`, 'error');
                        } else {
                            this.logger.popup(`Processed bookmark: ${nextBookmark.storyname}`, 'success');
                            this.finishedBookmarks.push(nextBookmark.storyname);
                        }
                        setTimeout(() => {
                            this.processNextBookmark();
                        }, 5000); // 5 seconds
                    });
            }
        }
    }

    private createExportButton() {
        const button = document.createElement('button');
        button.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#FFFFFF" fill="none">
    <path d="M20 14V10.6569C20 9.83935 20 9.4306 19.8478 9.06306C19.6955 8.69552 19.4065 8.40649 18.8284 7.82843L14.0919 3.09188C13.593 2.593 13.3436 2.34355 13.0345 2.19575C12.9702 2.165 12.9044 2.13772 12.8372 2.11401C12.5141 2 12.1614 2 11.4558 2C8.21082 2 6.58831 2 5.48933 2.88607C5.26731 3.06508 5.06508 3.26731 4.88607 3.48933C4 4.58831 4 6.21082 4 9.45584V14C4 17.7712 4 19.6569 5.17157 20.8284C6.34315 22 8.22876 22 12 22M13 2.5V3C13 5.82843 13 7.24264 13.8787 8.12132C14.7574 9 16.1716 9 19 9H19.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M17 22C17.6068 21.4102 20 19.8403 20 19C20 18.1597 17.6068 16.5898 17 16M19 19H12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
</svg>
        `
        button.classList.add('manganato-settings-button');
        button.title = 'Export Bookmarks';

        button.addEventListener('click', () => {
            if (!this.bookmarks) {
                this.logger.popup('Bookmarks still fetching.', 'warning');
                return;
            }

            const bookmarksBlob = new Blob([JSON.stringify(this.bookmarks)], { type: 'application/json' });
            const url = URL.createObjectURL(bookmarksBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'bookmarks.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });

        return button;
    }

    private createMALSyncButton() {
        const button = document.createElement('button');
        button.classList.add('manganato-settings-button');
        button.title = 'MALSync';
        button.style.background = '0';

        // Create an img element
        const img = document.createElement('img');
        img.src = 'https://raw.githubusercontent.com/MALSync/MALSync/refs/heads/master/assets/icons/icon128.png';
        img.alt = 'MALSync Icon';
        img.width = 36;
        img.height = 36;

        const timePerBookmark = 10;

        // Append the img element to the button
        button.appendChild(img);
        button.addEventListener('click', () => {
            if (confirm(`Are you sure you want to proceed? It will take approximately ${(((this.bookmarks ? this.bookmarks.length : 0) * timePerBookmark / 60) / this.MAX_TABS * 1.1).toFixed(2)} minutes to process all bookmarks. You need the MAL-Sync extension configured and enabled.`)) {
                for (let i = 0; i < this.MAX_TABS; i++) {
                    this.processNextBookmark();
                }
            }
        });

        return button;
    }
}

export { BookmarkHandler };
