type LogType = "error" | "warning" | "success" | "info";
type categoryType = "img" | "info" | "";

class Logger {
    private prefix: string;
    private popups: HTMLDivElement[] = [];
    private typeColorMap: { [key in LogType]: string } = {
        error: " background-color: #f15e55;",
        warning: " background-color: #ff5417;",
        success: " background-color: #1c8a52;",
        info: " background-color: #7dc4ca;",
    };
    private categoryColorMap: { [key in categoryType]: string } = {
        img: " background-color: #f15e55;",
        info: " background-color: #bc7690;",
        "": "",
    }

    constructor(prefix: string) {
        this.prefix = prefix;
    }

    static hexToRgb(hex: string, opacity: number) {
        // Remove the hash at the start if it's there
        hex = hex.replace(/^#/, '');

        // Parse the r, g, b values
        let bigint = parseInt(hex, 16);
        let r = (bigint >> 16) & 255;
        let g = (bigint >> 8) & 255;
        let b = bigint & 255;

        return `rgb(${r}, ${g}, ${b}, ${opacity})`;
    }

    static getLuminance(hexColor: string): number {
        // Convert hex to RGB
        const rgb = parseInt(hexColor.slice(1), 16); // Remove "#" and convert to integer
        const r = (rgb >> 16) & 0xff;
        const g = (rgb >> 8) & 0xff;
        const b = (rgb >> 0) & 0xff;

        // Convert RGB to relative luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance;
    }

    // Function to choose black or white text color based on luminance
    static getTextColorBasedOnBg(bgColor: string): string {
        const luminance = Logger.getLuminance(bgColor);
        return luminance > 0.5 ? '#000000' : '#FFFFFF'; // Black text for bright bg, white text for dark bg
    }

    log(message: any, category: categoryType = "", type: LogType = "info", detailMessage: string = "") {
        const generalCss = 'color: white; padding: 2px 6px 2px 6px; '
        const typeColor = this.typeColorMap[type];
        const typeTextColor = Logger.getTextColorBasedOnBg(typeColor)
        let customCSS = generalCss + typeColor + ` color: ${typeTextColor}; border-radius: 3px;`;

        let logMessage = [`%c${this.prefix}`, `${customCSS} ${typeColor}`, message]
        if (category != "") {
            const categoryColor = this.categoryColorMap[category];
            const categoryTextColor = Logger.getTextColorBasedOnBg(categoryColor)

            const categoryCSS = `${categoryColor} color: ${categoryTextColor}; border-radius: 0 3px 3px 0; margin-left: -5px;`
            logMessage = [`%c${this.prefix}%c${category}`, `${customCSS.replace("6px", "10px")} ${typeColor}`, `${generalCss}${categoryCSS}`, message]
        }

        if (type == "error") {
            console.error(...logMessage);
            return;
        }

        console.groupCollapsed(...logMessage);
        if (detailMessage != "") {
            console.log(detailMessage);
        }
        console.trace();
        console.groupEnd();
    }

    getTotalPopupHeight() {
        let totalHeight = 0;
        this.popups.forEach(cachedPopup => {
            totalHeight += cachedPopup.offsetHeight + 10;
        });
        return totalHeight;
    }

    popup(message: any, type: LogType = "info", detailMessage: string = "", timeOut: number = 2500) {
        const color = this.typeColorMap[type].substring(19).slice(0, -1);

        // Create the popup element
        const popup = document.createElement('div');
        popup.style.backgroundColor = Logger.hexToRgb(color, 0.65);
        popup.style.border = `1px solid ${Logger.hexToRgb(color, 1)}`;
        popup.style.color = 'white';
        popup.style.padding = '15px';
        popup.style.marginBottom = '10px';
        popup.style.borderRadius = '5px';
        popup.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        popup.style.opacity = '0';
        popup.style.transform = 'translateY(-10px)';
        popup.style.transition = '0.3s ease-in-out';
        popup.style.position = 'fixed';
        popup.style.right = '10px';
        popup.style.zIndex = '1000';  // Ensure popups are on top of other elements

        // Add the content
        let content = `<strong>${message}</strong>`;
        if (detailMessage) {
            content += `<p style="text-align: center; margin: 10px 0 0 0;">${detailMessage}</p>`;
        }
        popup.innerHTML = content;

        // Append the popup to the container
        document.body.appendChild(popup);

        // Calculate position and show the popup
        setTimeout(() => {
            const currentHeight = this.popups.reduce((acc, el) => acc + el.offsetHeight + 10, 10);
            this.popups.push(popup);
            popup.style.top = `${currentHeight}px`;
            popup.style.opacity = '1';
            popup.style.transform = 'translateY(0)';
        }, 100);

        // Remove the popup after the specified timeout
        setTimeout(() => {
            popup.style.opacity = '0';
            popup.style.transform = 'translateY(-10px)';

            setTimeout(() => {
                popup.remove();

                // Remove the popup from the array
                const index = this.popups.indexOf(popup);
                if (index !== -1) {
                    this.popups.splice(index, 1);
                }

                // Adjust positions of remaining popups
                this.popups.forEach((cachedPopup, idx) => {
                    const newHeight = this.popups
                        .slice(0, idx)
                        .reduce((acc, el) => acc + el.offsetHeight + 10, 10);
                    cachedPopup.style.top = `${newHeight}px`;
                });
            }, 300);  // Wait for the animation to finish before removing
        }, timeOut);
    }
}

class MangaNato {
    private logger = new Logger("Manganato");

    constructor() {
        this.adjustImageHeight();
        this.removeAdDivs();
        this.fixStyles();
        this.addScrollButtons();
        this.addGeneralShortcuts();
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

        if (allImagesBelowThreshold) {
            images.forEach(img => img.style.height = '100vh');
        }
        else {
            images.forEach(img => img.style.width = '450px');
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
                    firstChapter.click();
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

    addScrollButtons() {
        let closestImageIndex = -1; // Keeps track of the current image index
        let scrollTimeout: number;
        const logger = this.logger;

        // Get all images
        const pageDiv = document.querySelector(".container-chapter-reader");
        if (!pageDiv) {
            logger.log("Not on manga page.")
            return;
        }
        const images = pageDiv.querySelectorAll('img');
        logger.log(`Total images: ${images.length}`, "img");

        const navigationPanel = document.querySelectorAll(".panel-navigation")[1]

        // Function to scroll to a specific image
        function scrollToImage(index: number, position: 'start' | 'center' | 'end' | 'nearest') {
            if (index >= 0 && index < images.length) {
                images[index].scrollIntoView({ behavior: 'smooth', block: position });
                closestImageIndex = index; // Update the current image index
            }
        }

        function isNavigationPanelInView() {
            const navigationPanelRect = navigationPanel.getBoundingClientRect();
            const isNavigationPanelInView = navigationPanelRect.top < window.innerHeight && navigationPanelRect.bottom > 0;
            return isNavigationPanelInView;
        }

        // Function to find the closest image initially
        function findClosestImage() {
            const maxDistance = 100;
            let closestDistance = Infinity;

            // If the navigation panel is in view, set closestImageIndex to the last image
            if (isNavigationPanelInView()) {
                closestImageIndex = images.length;
                logger.log(`Outside of reader.`, "info");
                return;
            }

            images.forEach((img, index) => {
                const distance = Math.abs(img.getBoundingClientRect().top);
                if (distance < closestDistance && distance < maxDistance) {
                    closestDistance = distance;
                    closestImageIndex = index;
                }
            });

            logger.log(`Closest image index: ${closestImageIndex}`, "img");
        }

        // Find the closest image when the script runs
        findClosestImage();

        let keysPressed: { [key: string]: boolean } = {};
        const rightKeys = ["ArrowRight", "d"];
        const leftKeys = ["ArrowLeft", "a"];

        window.addEventListener('keyup', (event) => {
            delete keysPressed[event.key]; // Remove the key from the pressed keys list
        });

        // Event listener for key presses
        window.addEventListener('keydown', (event) => {
            keysPressed[event.key] = true;

            // Key combinations
            if (keysPressed['Shift'] && rightKeys.includes(event.key)) {
                navigationPanel.scrollIntoView({ behavior: 'smooth', block: "end" });
                findClosestImage();
                return;
            }
            if (keysPressed['Shift'] && leftKeys.includes(event.key)) {
                scrollToImage(0, 'start');
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

            // If at top of page scroll to first image.
            if (window.scrollY <= 100) {
                if (rightKeys.includes(event.key)) {
                    scrollToImage(0, 'start');
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
                    scrollToImage(closestImageIndex + 1, 'end');
                } else if (closestImageIndex == images.length - 1) {
                    navigationPanel.scrollIntoView({ behavior: 'smooth', block: "end" });
                }
            }
            if (leftKeys.includes(event.key)) {
                // Scroll to the previous image (top)
                if (closestImageIndex > 0) {
                    scrollToImage(closestImageIndex - 1, 'start');
                } else if (closestImageIndex == 0) {
                    scrollToImage(closestImageIndex, 'start');
                }
            }
        });

        function onScrollStop() {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                findClosestImage(); // Update closest image after scrolling has stopped
            }, 50);
        }

        // Reset closest image on scroll to re-evaluate when scrolling has stopped
        window.addEventListener('scroll', onScrollStop);
    }
}

const mangaNatoHandler = new MangaNato;
