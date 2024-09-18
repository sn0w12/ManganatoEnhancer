class Settings {
    private settingsButton: HTMLButtonElement;
    private settingsModal: HTMLDivElement;
    private overlay: HTMLDivElement;
    private closeButton: HTMLButtonElement;
    private settingsContainer: HTMLDivElement;
    private settings: { [key: string]: any } = {};
    private currentCategoryContainer: HTMLDivElement | null = null;
    private keyMapping: { [key: string]: string } = {
        'Control': 'Ctrl',
        'ArrowUp': '▲',
        'ArrowDown': '▼',
        'ArrowLeft': '◄',
        'ArrowRight': '►',
    };

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

        this.addGradientEventListeners();
    }

    private addGradientEventListeners() {
        const settingsModal = this.settingsModal; // Assuming this.settingsModal is your modal element
        const settingsContainer = this.settingsContainer; // Assuming this.settingsContainer is your scrollable content

        function updateGradients() {
            const scrollTop = settingsContainer.scrollTop;
            const scrollHeight = settingsContainer.scrollHeight;
            const clientHeight = settingsContainer.clientHeight;

            const fadeDistance = 50; // Adjust this value as needed

            // Calculate top gradient opacity
            const topOpacity = Math.min(scrollTop / fadeDistance, 1);

            // Calculate bottom gradient opacity
            const bottomOpacity = Math.min(
                (scrollHeight - scrollTop - clientHeight) / fadeDistance,
                1
            );

            // Set CSS variables to control the opacity of the pseudo-elements
            settingsModal.style.setProperty('--modal-top-gradient-opacity', topOpacity.toString());
            settingsModal.style.setProperty('--modal-bottom-gradient-opacity', bottomOpacity.toString());
        }

        // Initialize the gradients when the modal opens
        updateGradients();

        // Add scroll event listener
        settingsContainer.addEventListener('scroll', updateGradients);
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

            .settings-container {
                overflow-y: auto;
                max-height: calc(90vh - 40px - 40px);
            }

            .settings-modal {
                position: fixed;
                max-height: 90%;
                overflow-y: hidden;
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

            .settings-modal::before,
            .settings-modal::after {
                opacity: 0;
                content: '';
                position: absolute;
                left: 0;
                right: 0;
                height: 30px; /* Adjust the height as needed */
                pointer-events: none;
                z-index: 1002; /* Ensure it is above the modal content */
                transition: opacity 0.3s ease;
            }

            .settings-modal::before {
                opacity: var(--modal-top-gradient-opacity, 0);
                top: 19px;
                background: linear-gradient(to bottom, rgba(43, 43, 43, 1), rgba(43, 43, 43, 0));
            }

            .settings-modal::after {
                opacity: var(--modal-bottom-gradient-opacity, 0);
                bottom: 40px;
                background: linear-gradient(to top, rgba(43, 43, 43, 1), rgba(43, 43, 43, 0));
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
                z-index: 1003;
                position: relative;
            }

            .settings-modal .close-button:hover {
                background-color: #ff9069;
            }

            .settings-container label {
                display: block;
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

            .keybinding-setting {
                margin-bottom: 10px;
            }

            .keybinding-input-container {
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: nowrap;
                border-radius: 4px;
            }

            .keybinding-tags {
                display: flex;
                flex-wrap: nowrap;
                margin-right: 5px;
            }

            .keybinding-tag {
                border: 1px solid #3e3e3e;
                border-radius: 3px;
                padding: 5px;
                margin: 2px;
                display: flex;
                align-items: center;
            }

            .keybinding-remove {
                background: none;
                border: none;
                cursor: pointer;
                font-size: 14px;
                color: #ff5417;
            }

            .keybinding-remove:hover {
                color: red;
            }

            .keybinding-input-container input {
                border: none;
                outline: none;
                flex-grow: 1;
                width: 30px;
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

            .settings-tooltip {
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

            .settings-tooltip a {
                color: #ff5417;
                text-decoration: underline;
            }

            .settings-container::-webkit-scrollbar {
                width: 12px;
            }

            .settings-container::-webkit-scrollbar-track {
                background: #2b2b2b;
            }

            .settings-container::-webkit-scrollbar-thumb {
                background-color: #ff5417;
                border-radius: 10px;
                border: 3px solid #2b2b2b;
            }

            .settings-container::-webkit-scrollbar-thumb:hover {
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

        document.body.style.overflow = 'hidden';
        document.body.style.height = '100%';
    }

    private hideModal() {
        this.settingsModal.style.display = 'none';
        this.overlay.style.display = 'none';

        document.body.style.overflow = '';
        document.body.style.height = '';
    }

    private saveSettings() {
        localStorage.setItem('settings', JSON.stringify(this.settings));
    }

    private loadSettings() {
        const savedSettings = JSON.parse(localStorage.getItem('settings') || '{}');
        this.settings = savedSettings;
    }

    /**
     * Adds a checkbox setting to the settings container.
     *
     * @param id - The unique identifier for the checkbox setting.
     * @param label - The label text to display next to the checkbox.
     * @param defaultValue - The default checked state of the checkbox.
     */
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

    /**
     * Adds a text input setting to the settings container.
     *
     * @param id - The unique identifier for the setting.
     * @param label - The label to display next to the text input.
     * @param defaultValue - The default value for the text input if the setting is not already defined.
     */
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

    /**
     * Adds a key binding setting to the settings UI.
     *
     * @param id - The unique identifier for the key binding setting.
     * @param label - The label to display for the key binding setting.
     * @param defaultValue - The default value for the key binding setting, defaults to an empty string.
     *
     * This function creates a new key binding setting element and appends it to the settings container.
     * It initializes the setting with the provided default value or the existing value from the settings.
     * The user can add key combinations by pressing keys, which are displayed as tags.
     * Each tag has a remove button to delete the key combination.
     * The settings are updated and saved whenever a key combination is added or removed.
     */
    addKeyBindingSetting(id: string, label: string, defaultValue: string = "") {
        const setting = document.createElement('div');
        setting.classList.add('keybinding-setting');

        const value = id in this.settings ? this.settings[id] : defaultValue;
        let keys: string[] = value ? value.split(',').map((k: string) => k.trim()) : [];

        setting.innerHTML = `
            <label>${label}</label>
            <div class="keybinding-input-container">
                <div class="keybinding-tags" id="${id}-tags"></div>
                <input type="text" id="${id}-input" placeholder="Press a key to add" />
            </div>
        `;

        if (this.currentCategoryContainer) {
            this.currentCategoryContainer.appendChild(setting);
        } else {
            this.settingsContainer.appendChild(setting);
        }

        if (!(id in this.settings)) {
            this.settings[id] = defaultValue;
        }

        const tagsContainer = setting.querySelector(`#${id}-tags`) as HTMLDivElement;
        const inputElement = setting.querySelector(`#${id}-input`) as HTMLInputElement;

        const updateSettings = () => {
            this.settings[id] = keys.join(', ');
            this.saveSettings();
        };

        const renderKeys = () => {
            tagsContainer.innerHTML = '';
            keys.forEach((key, index) => {
                const keyTag = document.createElement('span');
                keyTag.classList.add('keybinding-tag');

                const tempKeys = key.split('+').map((k: string) => this.keyMapping[k] || k);
                keyTag.textContent = tempKeys.join('+');

                const removeButton = document.createElement('button');
                removeButton.classList.add('keybinding-remove');
                removeButton.textContent = '×';
                removeButton.addEventListener('click', () => {
                    keys.splice(index, 1);
                    renderKeys();
                    updateSettings();
                });

                keyTag.appendChild(removeButton);
                tagsContainer.appendChild(keyTag);
            });
        };

        renderKeys();

        inputElement.addEventListener('keydown', (event) => {
            event.preventDefault();
            event.stopPropagation();

            const keyParts = [];
            if (event.ctrlKey && event.key !== 'Control') keyParts.push('Ctrl');
            if (event.shiftKey && event.key !== 'Shift') keyParts.push('Shift');
            if (event.altKey && event.key !== 'Alt') keyParts.push('Alt');
            if (event.metaKey && event.key !== 'Meta') keyParts.push('Meta');

            if (!['Control', 'Shift', 'Alt', 'Meta'].includes(event.key)) {
                keyParts.push(event.key);
            } else if (keyParts.length === 0) {
                return; // Ignore modifier-only keys
            }

            const keyCombination = keyParts.join('+');
            if (keyCombination && !keys.includes(keyCombination)) {
                keys.push(keyCombination);
                renderKeys();
                updateSettings();
            }

            // Clear the input field after capturing the key
            inputElement.value = '';
        });
    }

    /**
     * Adds a new category to the settings container.
     *
     * @param title - The title of the category.
     * @param tooltipText - Optional. The text to display in the tooltip. Defaults to an empty string.
     * @param defaultOpen - Optional. Whether the category should be open by default. Defaults to true.
     *
     * This method creates a new category with a title and an optional tooltip. The category can be toggled open or closed.
     * If a tooltip text is provided, an info icon will be displayed next to the title, and hovering over the icon will show the tooltip.
     */
    addCategory(title: string, tooltipText: string = "", defaultOpen: boolean = true) {
        const categoryTitle = document.createElement('div');
        categoryTitle.classList.add('settings-category-title');

        const titleContainer = document.createElement('div');
        titleContainer.innerText = title;

        if (tooltipText !== "") {
            const infoIcon = document.createElement('span');
            infoIcon.innerHTML = 'ℹ️';
            infoIcon.classList.add('info-icon');

            const tooltip = document.createElement('div');
            tooltip.classList.add('settings-tooltip');
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
            this.settingsContainer.addEventListener('scroll', () => {
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

        if (!defaultOpen) {
            settingsContainer.classList.toggle('collapsed');
            toggleButton.innerText = settingsContainer.classList.contains('collapsed') ? 'Open' : 'Close';
        }

        categoryTitle.appendChild(titleContainer);
        categoryTitle.appendChild(toggleButton);
        this.settingsContainer.appendChild(categoryTitle);
        this.settingsContainer.appendChild(settingsContainer);
        this.settingsContainer.appendChild(separator);

        this.currentCategoryContainer = settingsContainer;
    }

    /**
     * Retrieves the value of a setting by its identifier.
     *
     * @param id - The unique identifier of the setting to retrieve.
     * @returns The value of the setting associated with the given identifier.
     */
    getSetting(id: string) {
        return this.settings[id];
    }
}

export { Settings };
