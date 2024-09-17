class Settings {
    private settingsButton: HTMLButtonElement;
    private settingsModal: HTMLDivElement;
    private closeButton: HTMLButtonElement;
    private settingsContainer: HTMLDivElement;
    private settings: { [key: string]: any } = {};
    private currentCategoryContainer: HTMLDivElement | null = null;

    constructor() {
        this.addCss();
        this.settingsButton = this.createSettingsButton();
        this.settingsModal = this.createSettingsModal();
        this.closeButton = this.settingsModal.querySelector('.close-button') as HTMLButtonElement;
        this.settingsContainer = this.settingsModal.querySelector('.settings-container') as HTMLDivElement;

        this.loadSettings();
        this.addEventListeners();
        document.body.appendChild(this.settingsButton);
        document.body.appendChild(this.settingsModal);
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
                width: 300px;
            }

            .settings-modal .close-button {
                background-color: #dc3545;
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
                margin-top: 20px;
                margin-bottom: 10px;
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

            .settings-container .settings-category-title:first-of-type:first-child {
                margin-top: 10px;
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

    private addEventListeners() {
        this.settingsButton.addEventListener('click', () => this.showModal());
        this.closeButton.addEventListener('click', () => this.hideModal());
    }

    private showModal() {
        this.settingsModal.style.display = 'block';
    }

    private hideModal() {
        this.settingsModal.style.display = 'none';
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
        setting.innerHTML = `
            <label>
                <input type="checkbox" id="${id}" ${defaultValue ? 'checked' : ''} />
                ${label}
            </label>
        `;

        if (this.currentCategoryContainer) {
            this.currentCategoryContainer.appendChild(setting);
        } else {
            this.settingsContainer.appendChild(setting);
        }

        this.settings[id] = defaultValue;
        setting.querySelector('input')?.addEventListener('change', (event) => {
            this.settings[id] = (event.target as HTMLInputElement).checked;
            this.saveSettings();
        });
    }

    addTextInputSetting(id: string, label: string, defaultValue: string) {
        const setting = document.createElement('div');
        setting.innerHTML = `
            <label>
                ${label}
                <input type="text" id="${id}" value="${defaultValue}" />
            </label>
        `;

        if (this.currentCategoryContainer) {
            this.currentCategoryContainer.appendChild(setting);
        } else {
            this.settingsContainer.appendChild(setting);
        }

        this.settings[id] = defaultValue;
        setting.querySelector('input')?.addEventListener('input', (event) => {
            this.settings[id] = (event.target as HTMLInputElement).value;
            this.saveSettings();
        });
    }

    addCategory(title: string) {
        const categoryTitle = document.createElement('div');
        categoryTitle.classList.add('settings-category-title');
        categoryTitle.innerText = title;

        const toggleButton = document.createElement('button');
        toggleButton.innerText = 'Toggle';
        toggleButton.addEventListener('click', () => {
            settingsContainer.classList.toggle('collapsed');
        });

        const separator = document.createElement('div');
        separator.classList.add('settings-category-separator');

        const settingsContainer = document.createElement('div');
        settingsContainer.classList.add('settings-category-container');

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
