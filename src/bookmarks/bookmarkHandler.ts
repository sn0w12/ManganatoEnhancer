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
}

export { BookmarkHandler };
