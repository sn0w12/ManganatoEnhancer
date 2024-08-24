type LogType = "error" | "warning" | "success" | "info";
type categoryType = "img" | "info" | "";

class Logger {
    private prefix: string;
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

    log(message: string, category: categoryType = "", type: LogType = "info", detailMessage: string = "") {
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

        console.groupCollapsed(...logMessage);
        if (detailMessage != "") {
            console.log(detailMessage);
        }
        console.trace();
        console.groupEnd();
    }
}

class MangaNato {
    private logger = new Logger("Manganato");

    constructor() {
        this.adjustImageHeight();
        this.removeAdDivs();
        this.fixStyles();
        this.addScrollButtons();
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

        // Function to find the closest image initially
        function findClosestImage() {
            const maxDistance = 100;
            let closestDistance = Infinity;
            const navigationPanelRect = navigationPanel.getBoundingClientRect();
            const isNavigationPanelInView = navigationPanelRect.top < window.innerHeight && navigationPanelRect.bottom > 0;

            // If the navigation panel is in view, set closestImageIndex to the last image
            if (isNavigationPanelInView) {
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

        window.addEventListener('keyup', (event) => {
            delete keysPressed[event.key]; // Remove the key from the pressed keys list
        });

        // Event listener for key presses
        window.addEventListener('keydown', (event) => {
            keysPressed[event.key] = true;

            // Key combinations
            if (keysPressed['Shift'] && keysPressed['ArrowRight']) {
                navigationPanel.scrollIntoView({ behavior: 'smooth', block: "end" });
                findClosestImage();
                return;
            }
            if (keysPressed['Shift'] && keysPressed['ArrowLeft']) {
                scrollToImage(0, 'start');
                findClosestImage();
                return;
            }

            // If at top of page scroll to first image.
            if (window.scrollY <= 100) {
                if (event.key === 'ArrowRight') {
                    scrollToImage(0, 'start');
                    return; // Exit the function to prevent further execution
                }
            }

            if (event.key === 'ArrowRight') {
                // Scroll to the next image (bottom)
                if (closestImageIndex < images.length - 1) {
                    scrollToImage(closestImageIndex + 1, 'end');
                } else if (closestImageIndex == images.length - 1) {
                    navigationPanel.scrollIntoView({ behavior: 'smooth', block: "end" });
                }
            } else if (event.key === 'ArrowLeft') {
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
