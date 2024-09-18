import { Settings } from "../utility/settings";
import { Logger } from "../utility/logger";
import { BookmarkManager } from "./bookmarkManager";
import Fuse from 'fuse.js';

class BookmarkHandler {
    private logger = new Logger("Manganato");
    private bookmarkManager = new BookmarkManager();
    private fuse!: Fuse<any>;
    private bookmarks: any[] | undefined;

    constructor(private settings: Settings) {
        this.settings = settings;
    }

    initialize() {
        this.fixBookmarkStyles();
        this.addBookmarkSearchBar();
        this.addExportBookmarksButton();

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

    addExportBookmarksButton() {
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
                this.logger.popup('No bookmarks found.', 'error');
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
}

export { BookmarkHandler };
