class Settings {
    private settingsButton: HTMLButtonElement;
    private settingsModal: HTMLDivElement;
    private closeButton: HTMLButtonElement;
    private settingsContainer: HTMLDivElement;
    private settings: { [key: string]: any } = {};

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
                font-size: 18px;
                font-weight: bold;
                margin-top: 20px;
                margin-bottom: 10px;
            }

            .settings-container .settings-category-title:first-of-type:first-child {
                margin-top: 10px;
            }

            .settings-category-separator {
                border-top: 1px solid #3e3e3e;
                margin-bottom: 10px;
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
        this.settingsContainer.appendChild(setting);
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
        this.settingsContainer.appendChild(setting);
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

        const separator = document.createElement('div');
        separator.classList.add('settings-category-separator');

        this.settingsContainer.appendChild(categoryTitle);
        this.settingsContainer.appendChild(separator);
    }

    getSetting(id: string) {
        return this.settings[id];
    }
}

export { Settings };
