import { Logger } from "../utility/logger";

interface Bookmark {
    noteid: string;
    note_story_id: string;
    note_story_name: string;
    chapter_numbernow: string;
    chapter_namenow: string;
    link_chapter_now: string;
    storyid: string;
    storyname: string;
    link_story: string;
    image: string;
    storynameunsigned_storykkl: string;
    chapterlastname: string;
    chapterlastnumber: string;
    chapterlastdateupdate: string;
    link_chapter_last: string;
    isread: string;
}

interface BookmarkResult {
    result: string;
    bm_quantily: string;
    bm_page_now: string;
    bm_page_total: string;
    bm_page_limit: string;
    data: Bookmark[];
}

class BookmarkManager {
    private bookmarkCookieName = 'bookmark-server';
    private userAccCookieName = 'user_acc';
    private objUrlBookmarkBaseSv1 = 'https://user.mngusr.com/';
    private objUrlBookmarkBaseSv2 = 'https://usermn.manganato.com/';
    private logger = new Logger('BookmarkManager');

    // Utility function to get a cookie value by name
    private getCookie(name: string): string | null {
        const cookieStr = document.cookie;
        const cookies = cookieStr ? cookieStr.split('; ') : [];
        for (const cookie of cookies) {
            const [cookieName, ...cookieValue] = cookie.split('=');
            if (cookieName === name) {
                return decodeURIComponent(cookieValue.join('='));
            }
        }
        return null;
    }

    // Utility function to set a cookie
    private setCookie(name: string, value: string, hours: number): void {
        const expires = new Date(Date.now() + hours * 60 * 60 * 1000).toUTCString();
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
    }

    // Function to adjust URL based on 'bookmark-server' cookie
    private cookieGetUrl(url: string): string {
        const cookieValue = this.getCookie(this.bookmarkCookieName);
        if (cookieValue === 'server2') {
            return url.replace(this.objUrlBookmarkBaseSv1, this.objUrlBookmarkBaseSv2);
        }
        return url;
    }

    // Function to set 'bookmark-server' cookie to 'server2' upon error
    private cookieCreateServer2(): void {
        if (this.getCookie(this.bookmarkCookieName) !== 'server2') {
            this.setCookie(this.bookmarkCookieName, 'server2', 12); // Expires in 12 hours
        }
    }

    // Function to extract 'user_data' from 'user_acc' cookie
    private getUserData(): string | null {
        const userAccCookie = this.getCookie(this.userAccCookieName);
        if (userAccCookie) {
            try {
                const userAcc = JSON.parse(userAccCookie);
                return userAcc.user_data;
            } catch (error) {
                console.error('Error parsing user_acc cookie:', error);
                return null;
            }
        }
        return null;
    }

    // Function to handle errors from fetch
    private handleFetchError(error: any): void {
        console.error('Error fetching bookmarks:', error);
        this.cookieCreateServer2(); // Switch to server2 upon error
    }


    /**
     * Fetches all bookmarks for the logged-in user.
     *
     * This method retrieves the user's bookmarks from the server by making
     * multiple paginated requests until all bookmarks are fetched or an error occurs.
     *
     * @returns {Promise<any[]>} A promise that resolves to an array of bookmarks.
     * If the user is not logged in or an error occurs, it returns an empty array.
     *
     * @throws {Error} Throws an error if the HTTP request fails.
     */
    public async getAllBookmarks(): Promise<any[]> {
        const user_data = this.getUserData();
        if (!user_data) {
            console.error('User is not logged in or user_data is missing');
            return [];
        }
        const cachedBookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');

        let url = this.objUrlBookmarkBaseSv1 + 'bookmark_get_list_full';
        url = this.cookieGetUrl(url);

        const allBookmarks: any[] = [];
        let currentPage = 1;
        const bm_source = 'manganato';

        try {
            while (true) {
                const data = new URLSearchParams();
                data.append('user_data', user_data);
                data.append('bm_page', currentPage.toString());
                data.append('bm_source', bm_source);
                data.append('out_type', 'json'); // Request JSON output

                const response = await fetch(url, {
                    method: 'POST',
                    body: data.toString(),
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP error ${response.status}: ${errorText}`);
                }

                const result = await response.json();
                if (currentPage === 1) {
                    if (this.isCachedBookmarksValid(result)) {
                        return cachedBookmarks;
                    }
                    localStorage.setItem('bookmarks_first_page', JSON.stringify(result.data));
                    localStorage.setItem('bookmarks_cache_last_update', Date.now().toString());
                }

                const finalPage = result.bm_page_total;

                if (result.result === 'ok') {
                    const bookmarks = result.data.map((bookmark: any) => ({
                        ...bookmark,
                        page: currentPage
                    }));
                    this.logger.log(`${currentPage} / ${finalPage}, ${bookmarks.length}, ${allBookmarks.length + bookmarks.length}`, 'bookmarks', 'dev');

                    if (Array.isArray(bookmarks) && bookmarks.length > 0) {
                        if (currentPage >= finalPage) {
                            allBookmarks.push(...bookmarks);
                            localStorage.setItem('bookmarks', JSON.stringify(allBookmarks));
                            break;
                        } else {
                            allBookmarks.push(...bookmarks);
                            currentPage++;
                        }
                    } else {
                        // No more bookmarks to fetch
                        break;
                    }
                } else {
                    console.error('Error from server:', result.data);
                    break;
                }
            }

            return allBookmarks;
        } catch (error) {
            this.handleFetchError(error);
            return [];
        }
    }

    isCachedBookmarksValid(result: BookmarkResult): boolean {
        const toMilliseconds = (hrs: number, min: number, sec: number) => (hrs*60*60+min*60+sec)*1000;
        let lastUpdate = localStorage.getItem('bookmarks_cache_last_update') || Date.now().toString();

        const isCacheRecent = (lastUpdate: string, duration: number): boolean => {
            return Date.now() - parseInt(lastUpdate) < duration;
        };

        const isSamePage = this.isSameFirstPage(result.data);
        const isRecent = isCacheRecent(lastUpdate, toMilliseconds(0, 30, 0));
        const isSameLength = result.bm_quantily == JSON.parse(localStorage.getItem('bookmarks') || '[]').length;

        if (isSamePage && isRecent && isSameLength) {
            this.logger.log('Valid Cache', 'bookmarks', 'dev');
            return true;
        }
        this.logger.log('Invalid Cache', 'bookmarks', 'dev');
        return false;
    }

    isSameFirstPage(newFirstPage: any[]): boolean {
        const cachedFirstPage = JSON.parse(localStorage.getItem('bookmarks_first_page') || '[]');
        if (newFirstPage.length !== cachedFirstPage.length) {
            return false;
        }
        for (let i = 0; i < newFirstPage.length; i++) {
            if (newFirstPage[i].storyid !== cachedFirstPage[i].storyid) {
                return false;
            }
        }
        return true;
    }
}

export { BookmarkManager };
