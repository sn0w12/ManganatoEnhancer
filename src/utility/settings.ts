/**
 * The `Settings` class provides a user interface for managing application settings.
 * It includes methods for creating and displaying a settings modal, adding various types of settings,
 * and saving/loading settings to/from local storage.
 *
 * @example
 * ```typescript
 * const settings = new Settings();
 * settings.addCategory('General Settings');
 * settings.addCheckboxSetting('darkMode', 'Enable Dark Mode', false);
 * settings.addTextInputSetting('username', 'Username', 'Guest');
 * settings.addKeyBindingSetting('shortcut', 'Shortcut', 'Ctrl+S');
 * ```
 */
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
        this.settingsModal = this.createSettingsModal();
        this.overlay = this.createOverlay();
        this.closeButton = this.settingsModal.querySelector('.close-button') as HTMLButtonElement;
        this.settingsContainer = this.settingsModal.querySelector('.settings-container') as HTMLDivElement;

        const userOptions = document.querySelector('.box-user-options');
        if (!userOptions) {
            this.settingsButton = this.createSettingsButton();
            document.body.appendChild(this.settingsButton);
        } else {
            this.settingsButton = this.createManganatoSettingsButton();
            const secondElement = userOptions.children[2];
            if (secondElement) {
                userOptions.insertBefore(this.settingsButton, secondElement);
            } else {
                userOptions.appendChild(this.settingsButton);
            }
        }

        this.addEventListeners();
        document.body.appendChild(this.settingsModal);
        document.body.appendChild(this.overlay);

        this.addGradientEventListeners();
    }

    private createManganatoSettingsButton() {
        const button = document.createElement('button');
        button.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#FFFFFF" fill="none">
    <path d="M15.5 12C15.5 13.933 13.933 15.5 12 15.5C10.067 15.5 8.5 13.933 8.5 12C8.5 10.067 10.067 8.5 12 8.5C13.933 8.5 15.5 10.067 15.5 12Z" stroke="currentColor" stroke-width="1.5" />
    <path d="M21.011 14.0965C21.5329 13.9558 21.7939 13.8854 21.8969 13.7508C22 13.6163 22 13.3998 22 12.9669V11.0332C22 10.6003 22 10.3838 21.8969 10.2493C21.7938 10.1147 21.5329 10.0443 21.011 9.90358C19.0606 9.37759 17.8399 7.33851 18.3433 5.40087C18.4817 4.86799 18.5509 4.60156 18.4848 4.44529C18.4187 4.28902 18.2291 4.18134 17.8497 3.96596L16.125 2.98673C15.7528 2.77539 15.5667 2.66972 15.3997 2.69222C15.2326 2.71472 15.0442 2.90273 14.6672 3.27873C13.208 4.73448 10.7936 4.73442 9.33434 3.27864C8.95743 2.90263 8.76898 2.71463 8.60193 2.69212C8.43489 2.66962 8.24877 2.77529 7.87653 2.98663L6.15184 3.96587C5.77253 4.18123 5.58287 4.28891 5.51678 4.44515C5.45068 4.6014 5.51987 4.86787 5.65825 5.4008C6.16137 7.3385 4.93972 9.37763 2.98902 9.9036C2.46712 10.0443 2.20617 10.1147 2.10308 10.2492C2 10.3838 2 10.6003 2 11.0332V12.9669C2 13.3998 2 13.6163 2.10308 13.7508C2.20615 13.8854 2.46711 13.9558 2.98902 14.0965C4.9394 14.6225 6.16008 16.6616 5.65672 18.5992C5.51829 19.1321 5.44907 19.3985 5.51516 19.5548C5.58126 19.7111 5.77092 19.8188 6.15025 20.0341L7.87495 21.0134C8.24721 21.2247 8.43334 21.3304 8.6004 21.3079C8.76746 21.2854 8.95588 21.0973 9.33271 20.7213C10.7927 19.2644 13.2088 19.2643 14.6689 20.7212C15.0457 21.0973 15.2341 21.2853 15.4012 21.3078C15.5682 21.3303 15.7544 21.2246 16.1266 21.0133L17.8513 20.034C18.2307 19.8187 18.4204 19.711 18.4864 19.5547C18.5525 19.3984 18.4833 19.132 18.3448 18.5991C17.8412 16.6616 19.0609 14.6226 21.011 14.0965Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
</svg>
        `
        button.classList.add('manganato-settings-button');
        return button;
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

            .manganato-settings-button {
                display: flex;
                align-items: center;
                justify-content: center;
                float: left;
                position: relative;
                height: 35px;
                width: 35px;
                margin-left: 10px;
                cursor: pointer;
                border-radius: 100%;
                border: none;
                background-color: #ff5417;
            }

            .manganato-settings-button svg {
                width: 30px;
                height: 30px;
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
                transition: background-color 0.25s ease;
            }

            .settings-modal .close-button:hover {
                background-color: #ff9069;
            }

            .settings-container label {
                display: block;
            }

            .settings-container input[type="text"],
            .settings-container input[type="number"] {
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

            .custom-setting {
                display: flex !important;
                align-items: center;
                margin-bottom: 10px;
                gap: 5px;
            }

            .custom-setting p {
                white-space: nowrap;
            }

            .combo-container select {
                padding: 5px;
                border-radius: 5px;
                background-color: #2b2b2b;
                color: #d0d0d0;
                border: 1px solid #3e3e3e;
            }

            .combo-container select option:checked {
                background-color: #ff5417;
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

            .settings-category-custom-separator {
                margin-bottom: 5px;
                border-top: 1px solid #7f7f7f;
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
        document.body.setAttribute('data-settings-open', 'true');
    }

    private hideModal() {
        this.settingsModal.style.display = 'none';
        this.overlay.style.display = 'none';

        document.body.style.overflow = '';
        document.body.style.height = '';
        document.body.setAttribute('data-settings-open', 'false');
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
    addCheckboxSetting(id: string, label: string, defaultValue: boolean, onChange: Function = () => {}) {
        const setting = document.createElement('div');
        const value = id in this.settings ? this.settings[id] : defaultValue;
        setting.innerHTML = `
            <label>
                <input type="checkbox" id="${id}" ${value ? 'checked' : ''} />
                ${label}
            </label>
        `;
        setting.style.marginBottom = '10px';

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
            if (onChange) onChange();
        });
    }

    /**
     * Adds a text input setting to the settings container.
     *
     * @param id - The unique identifier for the setting.
     * @param label - The label to display next to the text input.
     * @param defaultValue - The default value for the text input if the setting is not already defined.
     */
    addTextInputSetting(id: string, label: string, defaultValue: string, type: string = 'text', onChange: Function = () => {}) {
        const setting = document.createElement('div');
        const value = id in this.settings ? this.settings[id] : defaultValue;
        setting.innerHTML = `
            <label class="custom-setting">
                <p>${label}</p>
                <input type="${type}" id="${id}" value="${value}" />
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
            onChange();
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

    addComboSetting(id: string, label: string, options: string[], defaultValue: string, onChange: Function = () => {}) {
        const setting = document.createElement('div');
        const value = id in this.settings ? this.settings[id] : defaultValue;

        setting.innerHTML = `
            <label class="custom-setting">
                ${label}
                <div class="combo-container">
                    <select id="${id}-select">
                        ${options.map(option => `<option value="${option}">${option}</option>`).join('')}
                    </select>
                </div>
            </label>
        `;

        if (this.currentCategoryContainer) {
            this.currentCategoryContainer.appendChild(setting);
        } else {
            this.settingsContainer.appendChild(setting);
        }

        const selectElement = setting.querySelector(`#${id}-select`) as HTMLSelectElement;
        selectElement.value = value;

        // Event listener for select change
        selectElement.addEventListener('change', (event) => {
            const selectedValue = (event.target as HTMLSelectElement).value;
            if (options.includes(selectedValue)) {
                this.settings[id] = selectedValue;
                this.saveSettings();
                onChange();
            }
        });
    }

    addSeparator() {
        const separator = document.createElement('div');
        separator.classList.add('settings-category-custom-separator');
        if (this.currentCategoryContainer) {
            this.currentCategoryContainer.appendChild(separator);
        } else {
            this.settingsContainer.appendChild(separator);
        }
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

    /**
     * Checks if a given string is a valid CSS size.
     *
     * @param value - The string to be checked.
     * @returns `true` if the string is a valid CSS size, otherwise `false`.
     */
    isValidCssSize(value: string): boolean {
        const cssSizeRegex = /^-?\d+(\.\d+)?(px|em|rem|%|vh|vw|vmin|vmax|ch|ex|cm|mm|in|pt|pc)$/;
        return cssSizeRegex.test(value);
    }
}

export { Settings };
