import { ChapterHandler } from "./chapterHandler";
import { Settings } from "../utility/settings";

class PageHandler {
    constructor(private chapterHandler: ChapterHandler, private settings: Settings) {
        this.chapterHandler = chapterHandler;
        this.settings = settings;
    }

    scrollToImage(index: number, position: 'start' | 'center' | 'end' | 'nearest') {
        const behavior = this.settings.getSetting("smoothScrolling") ? 'smooth' : 'auto';
        if (index >= 0 && index < this.chapterHandler.totalPages) {
            this.chapterHandler.images[index].scrollIntoView({ behavior: behavior, block: position });
        }
    }

    goToNextPage() {
        if (this.chapterHandler.isNavigationPanelInView()) {
            this.chapterHandler.goToNextChapter();
            return;
        }

        if (this.chapterHandler.isStrip) {
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
        if (this.chapterHandler.currentPage < this.chapterHandler.totalPages - 1) {
            this.chapterHandler.scrollToImage(this.chapterHandler.currentPage + 1, "end");
        } else if (this.chapterHandler.currentPage === this.chapterHandler.totalPages - 1 && this.settings.getSetting("scrollToNav")) {
            this.chapterHandler.navigationPanel.scrollIntoView({ behavior: behavior, block: "end" });
        } else {
            this.chapterHandler.goToNextChapter();
        }
    }

    goToPreviousPage() {
        const behavior = this.settings.getSetting("stripSmoothScrolling") ? "smooth" : "auto";
        if (this.chapterHandler.isStrip) {
            const scrollAmount = parseInt(this.settings.getSetting("stripScroll"));
            window.scrollBy({
                top: -scrollAmount,
                left: 0,
                behavior: behavior,
            });
            return;
        }

        // Scroll to the previous image (top)
        if (this.chapterHandler.currentPage > 0) {
            this.scrollToImage(this.chapterHandler.currentPage - 1, "start");
        } else if (this.chapterHandler.currentPage === 0) {
            this.scrollToImage(this.chapterHandler.currentPage, "start");
        }
    }
}

export { PageHandler };
