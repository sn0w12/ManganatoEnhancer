type LogType = "error" | "warning" | "success" | "info" | "dev";
type categoryType = "img" | "info" | "bookmarks" | "";

/**
 * Logger class provides methods to log messages to the console with different log levels and categories,
 * and to display popup notifications on the web page.
 *
 * @class
 * @param {string} prefix - The prefix to be added to each log message.
 */
class Logger {
    private prefix: string;
    private prefixColor: string;
    private popups: HTMLDivElement[] = [];
    private typeColorMap: { [key in LogType]: string } = {
        error: "#f15e55",
        warning: "#ff5417",
        success: "#1c8a52",
        info: "#7dc4ca",
        dev: "#bc42f5",
    };
    private categoryColorMap: { [key in categoryType]: string } = {
        img: "#f15e55",
        info: "#bc7690",
        bookmarks: "#7dc4ca",
        "": "",
    }

    constructor(prefix: string, prefixColor: string = "#881798") {
        this.prefix = prefix;
        this.prefixColor = prefixColor;
        this.addCss();
    }

    private addCss() {
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

    /**
     * Logs a message to the console with a specific category and type, optionally including a detailed message.
     *
     * @param message - The main message to log. Can be of any type.
     * @param category - The category of the log message. Defaults to an empty string.
     * @param type - The type of the log message. Defaults to "info". Can be "info", "warn", "error", etc.
     * @param detailMessage - An optional detailed message to log.
     */
    log(message: any, category: categoryType = "", type: LogType = "info", detailMessage: any = "") {
        if (type === "dev" && process.env.NODE_ENV === "production") {
            return;
        }

        const parts = [
            {
                name: this.prefix,
                color: this.prefixColor,
            },
            {
                name: type,
                color: this.typeColorMap[type],
            },
            {
                name: category,
                color: this.categoryColorMap[category],
            },
        ];

        const logMessage = this.generateLogCss(parts);
        logMessage.push(message);

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

    private generateLogCss(parts: { name: string, color: string }[]): string[] {
        if (parts.length === 1) {
            const part = parts[0];
            return [
                `%c${this.getLogText(part.name)}`,
                `border-radius: 3px; background-color: ${part.color}; color: ${Logger.getTextColorBasedOnBg(part.color)}; padding: 2px 6px;`
            ];
        }

        let logMessage = "";
        let logCss = [];

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const textColor = Logger.getTextColorBasedOnBg(part.color);
            let css = `background-color: ${part.color}; color: ${textColor}; padding: 2px 7px 2px 6px; margin-left: -1px;`;
            logMessage += `%c${this.getLogText(part.name)}`;

            switch (i) {
                case 0: // First
                    logCss.push(`border-radius: 3px 0 0 3px; ${css}`);
                    break;
                case parts.length - 1: // Last
                    logCss.push(`border-radius: 0 3px 3px 0; border-left: 1px solid ${textColor}; ${css}`);
                    break;
                default:
                    logCss.push(`border-radius: 0; border-left: 1px solid ${textColor}; ${css}`);
                    break;
            }
        }

        return [logMessage, ...logCss];
    }

    private getLogText(text: string, maxLength: number = 10): string {
        if (text.length <= maxLength) {
            return text;
        }

        const extractUppercase = (str: string) => {
            const matches = str.match(/[A-Z]/g);
            return matches ? matches.join('') : "";
        };
        const uppercaseText = extractUppercase(text);
        return uppercaseText.length > 0 ? uppercaseText : text.slice(0, maxLength);
    }

    /**
     * Displays a popup message on the screen with a specified type, detail message, and timeout.
     *
     * @param message - The main message to display in the popup.
     * @param type - The type of the log message, which determines the color of the popup.
     * @param detailMessage - An optional detailed message to display below the main message.
     * @param timeOut - The duration (in milliseconds) for which the popup should be displayed before disappearing.
     */
    popup(message: any, type: LogType = "info", detailMessage: string = "", timeOut: number = 2500) {
        const color = this.typeColorMap[type];

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