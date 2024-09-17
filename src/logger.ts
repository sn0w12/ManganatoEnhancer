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
        this.addCss();
    }

    addCss() {
        const style = document.createElement('style');
        style.innerHTML = `
.popup {
    color: white;
    padding: 15px;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    opacity: 0;
    transform: translateY(-10px);
    transition: 0.3s ease-in-out;
    position: fixed;
    right: 15px;
    z-index: 1000;  // Ensure popups are on top of other elements
}
        `;
        document.head.appendChild(style);
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
        popup.classList.add('popup');
        popup.style.backgroundColor = Logger.hexToRgb(color, 0.65);
        popup.style.border = `1px solid ${Logger.hexToRgb(color, 1)}`;

        // Add the content
        let content = `<strong>${message}</strong>`;
        if (detailMessage) {
            content += `<p style="text-align: center; margin: 10px 0 0 0;">${detailMessage}</p>`;
        }
        popup.innerHTML = content;

        // Append the popup to the container
        document.body.appendChild(popup);

        const offset = 5;
        // Calculate position and show the popup
        setTimeout(() => {
            const currentHeight = this.popups.reduce((acc, el) => acc + el.offsetHeight + offset, offset);
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
                        .reduce((acc, el) => acc + el.offsetHeight + offset, offset);
                    cachedPopup.style.top = `${newHeight}px`;
                });
            }, 300);  // Wait for the animation to finish before removing
        }, timeOut);
    }
}

export { Logger, LogType, categoryType };