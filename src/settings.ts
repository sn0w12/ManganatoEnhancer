class Settings {
    private settingsButton: HTMLButtonElement;
    private settingsModal: HTMLDivElement;
    private overlay: HTMLDivElement;
    private closeButton: HTMLButtonElement;
    private settingsContainer: HTMLDivElement;
    private settings: { [key: string]: any } = {};
    private currentCategoryContainer: HTMLDivElement | null = null;

    constructor() {
        this.addCss();
        this.loadSettings();
        this.settingsButton = this.createSettingsButton();
        this.settingsModal = this.createSettingsModal();
        this.overlay = this.createOverlay();
        this.closeButton = this.settingsModal.querySelector('.close-button') as HTMLButtonElement;
        this.settingsContainer = this.settingsModal.querySelector('.settings-container') as HTMLDivElement;

        this.addEventListeners();
        document.body.appendChild(this.settingsButton);
        document.body.appendChild(this.settingsModal);
        document.body.appendChild(this.overlay);
    }

    private addCss() {
        const style = document.createElement('style');
        style.innerHTML = `
            .settings-button {
                position: fixed;
                top: 10px;
                left: 15px;
                z-index: 1000;
                background-color: #ff5417;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                transition: background-color 0.25s ease;
            }

            .settings-button:hover {
                background-color: #ff9069;
            }

            .settings-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                z-index: 1000; /* Ensure it is below the modal */
                display: none;
            }

            .settings-modal {
                position: fixed;
                max-height: 90%;
                overflow-y: auto;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: #2b2b2b;
                color: #d0d0d0;
                padding: 20px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
                z-index: 1001;
                display: none;
                border-radius: 10px;
                width: -webkit-fill-available;
            }

            .settings-modal .close-button {
                background-color: #ff5417;
                width: 100%;
                color: white;
                border: none;
                padding: 5px 10px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
                float: right;
            }

            .settings-modal .close-button:hover {
                background-color: #c82333;
            }

            .settings-container label {
                display: block;
                margin-bottom: 10px;
            }

            .settings-container input[type="text"] {
                width: 100%;
                padding: 5px;
                box-sizing: border-box;
                background-color: #2b2b2b;
                color: #d0d0d0;
                border: 1px solid #3e3e3e;
                border-radius: 5px;
            }

            .settings-container input[type="checkbox"] {
                accent-color: #ff5417;
            }

            .settings-category-title {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 18px;
                font-weight: bold;
                margin-top: 10px;
                margin-bottom: 10px;
            }

            .settings-container .settings-category-title:first-of-type:first-child {
                margin-top: 00px;
            }

            .settings-category-title button {
                background-color: #ff5417;
                color: white;
                border: none;
                padding: 5px 10px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
                transition: background-color 0.25s ease;
            }

            .settings-category-title button:hover {
                background-color: #ff9069;
            }

            .settings-category-separator {
                border-top: 1px solid #ff5417;
            }

            .settings-category-separator:last-of-type {
                display: none;
            }

            .settings-category-container.collapsed {
                display: none;
            }

            .info-icon {
                cursor: pointer;
                padding: 0 8px 2px;
                margin-left: 5px;
                border: 2px solid #ff5417;
                border-radius: 50%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                background-color: #2b2b2b;
                color: #ff5417;
            }

            .tooltip {
                display: none;
                opacity: 0;
                position: absolute;
                background-color: #333;
                color: #fff;
                padding: 5px;
                border-radius: 5px;
                white-space: normal;
                max-width: 300px;
                overflow-wrap: break-word;
                z-index: 1002;
                transition: opacity 0.5s ease;
            }

            .tooltip a {
                color: #ff5417;
                text-decoration: underline;
            }

            .settings-modal::-webkit-scrollbar {
                width: 12px;
            }

            .settings-modal::-webkit-scrollbar-track {
                background: #2b2b2b;
            }

            .settings-modal::-webkit-scrollbar-thumb {
                background-color: #ff5417;
                border-radius: 10px;
                border: 3px solid #2b2b2b;
            }

            .settings-modal::-webkit-scrollbar-thumb:hover {
                background-color: #ff9069;
            }
        `;
        document.head.appendChild(style);
    }

    private createSettingsButton(): HTMLButtonElement {
        const button = document.createElement('button');
        button.innerText = 'Settings';
        button.classList.add('settings-button');
        return button;
    }

    private createSettingsModal(): HTMLDivElement {
        const modal = document.createElement('div');
        modal.classList.add('settings-modal');
        modal.innerHTML = `
            <div class="settings-container"></div>
            <button class="close-button">Close</button>
        `;
        return modal;
    }

    private createOverlay(): HTMLDivElement {
        const overlay = document.createElement('div');
        overlay.classList.add('settings-overlay');
        return overlay;
    }

    private addEventListeners() {
        this.settingsButton.addEventListener('click', () => this.showModal());
        this.closeButton.addEventListener('click', () => this.hideModal());
        this.overlay.addEventListener('click', () => this.hideModal());
    }

    private showModal() {
        this.settingsModal.style.display = 'block';
        this.overlay.style.display = 'block';
    }

    private hideModal() {
        this.settingsModal.style.display = 'none';
        this.overlay.style.display = 'none';
    }

    private saveSettings() {
        localStorage.setItem('settings', JSON.stringify(this.settings));
    }

    private loadSettings() {
        const savedSettings = JSON.parse(localStorage.getItem('settings') || '{}');
        this.settings = savedSettings;
    }

    addCheckboxSetting(id: string, label: string, defaultValue: boolean) {
        const setting = document.createElement('div');
        const value = id in this.settings ? this.settings[id] : defaultValue;
        setting.innerHTML = `
            <label>
                <input type="checkbox" id="${id}" ${value ? 'checked' : ''} />
                ${label}
            </label>
        `;

        if (this.currentCategoryContainer) {
            this.currentCategoryContainer.appendChild(setting);
        } else {
            this.settingsContainer.appendChild(setting);
        }

        if (!(id in this.settings)) {
            this.settings[id] = defaultValue;
        }
        setting.querySelector('input')?.addEventListener('change', (event) => {
            this.settings[id] = (event.target as HTMLInputElement).checked;
            this.saveSettings();
        });
    }

    addTextInputSetting(id: string, label: string, defaultValue: string) {
        const setting = document.createElement('div');
        const value = id in this.settings ? this.settings[id] : defaultValue;
        setting.innerHTML = `
            <label>
                ${label}
                <input type="text" id="${id}" value="${value}" />
            </label>
        `;

        if (this.currentCategoryContainer) {
            this.currentCategoryContainer.appendChild(setting);
        } else {
            this.settingsContainer.appendChild(setting);
        }

        if (!(id in this.settings)) {
            this.settings[id] = defaultValue;
        }
        setting.querySelector('input')?.addEventListener('input', (event) => {
            this.settings[id] = (event.target as HTMLInputElement).value;
            this.saveSettings();
        });
    }

    addCategory(title: string, tooltipText: string = "") {
        const categoryTitle = document.createElement('div');
        categoryTitle.classList.add('settings-category-title');

        const titleContainer = document.createElement('div');
        titleContainer.innerText = title;

        if (tooltipText !== "") {
            const infoIcon = document.createElement('span');
            infoIcon.innerHTML = 'ℹ️';
            infoIcon.classList.add('info-icon');

            const tooltip = document.createElement('div');
            tooltip.classList.add('tooltip');
            tooltip.innerHTML = tooltipText; // Use innerHTML to allow HTML content

            document.body.appendChild(tooltip);

            let hideTimeout: number;

            const showTooltip = (event: MouseEvent) => {
                clearTimeout(hideTimeout);
                const rect = (event.target as HTMLElement).getBoundingClientRect();
                tooltip.style.left = `${rect.right + 5 + window.scrollX}px`;
                tooltip.style.top = `${rect.top - 3 + window.scrollY}px`;
                tooltip.style.display = 'inline-block';
                tooltip.style.opacity = '1';
            };

            const hideTooltip = () => {
                tooltip.style.opacity = '0';
                hideTimeout = window.setTimeout(() => {
                    tooltip.style.display = 'none';
                }, 300); // Delay to allow moving to the tooltip
            };

            infoIcon.addEventListener('mouseenter', showTooltip);
            infoIcon.addEventListener('mouseleave', (event) => {
                if (!tooltip.contains(event.relatedTarget as Node)) {
                    hideTooltip();
                }
            });

            tooltip.addEventListener('mouseenter', () => {
                clearTimeout(hideTimeout);
                tooltip.style.opacity = '1';
            });
            tooltip.addEventListener('mouseleave', (event) => {
                if (!infoIcon.contains(event.relatedTarget as Node)) {
                    hideTooltip();
                }
            });

            titleContainer.appendChild(infoIcon);

            window.addEventListener('scroll', () => {
                if (tooltip.style.display === 'inline-block') {
                    const rect = infoIcon.getBoundingClientRect();
                    tooltip.style.left = `${rect.right + 5 + window.scrollX}px`;
                    tooltip.style.top = `${rect.top - 3 + window.scrollY}px`;
                }
            });
        }

        const toggleButton = document.createElement('button');
        toggleButton.innerText = 'Close';
        toggleButton.addEventListener('click', () => {
            settingsContainer.classList.toggle('collapsed');
            toggleButton.innerText = settingsContainer.classList.contains('collapsed') ? 'Open' : 'Close';
        });

        const separator = document.createElement('div');
        separator.classList.add('settings-category-separator');

        const settingsContainer = document.createElement('div');
        settingsContainer.classList.add('settings-category-container');

        categoryTitle.appendChild(titleContainer);
        categoryTitle.appendChild(toggleButton);
        this.settingsContainer.appendChild(categoryTitle);
        this.settingsContainer.appendChild(settingsContainer);
        this.settingsContainer.appendChild(separator);

        this.currentCategoryContainer = settingsContainer;
    }

    getSetting(id: string) {
        return this.settings[id];
    }
}

export { Settings };
