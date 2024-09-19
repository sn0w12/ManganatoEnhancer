/**
 * The `ShortcutManager` class is responsible for managing keyboard shortcuts.
 * It allows registering shortcuts with specific key combinations and actions,
 * and handles the execution of these actions when the corresponding keys are pressed.
 *
 * @class
 * @example
 * const manager = new ShortcutManager();
 * manager.registerShortcut('Control+S', () => {
 *     console.log('Save action triggered');
 * });
 */
class ShortcutManager {
    private shortcuts: Array<{
        keys: string[];
        action: () => void;
        condition?: () => boolean;
    }> = [];

    constructor() {
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    private normalizeKey(event: KeyboardEvent): string {
        const modifiers = [];

        // Treat Control and Meta as interchangeable
        if (event.ctrlKey || event.metaKey) modifiers.push('Control');
        if (event.shiftKey) modifiers.push('Shift');
        if (event.altKey) modifiers.push('Alt');

        // Sort modifiers to ensure consistent order
        modifiers.sort();

        let key = event.key;

        // Ignore modifier-only keys
        if (['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
            if (modifiers.length === 0) {
                // Ignore events where only a modifier key is pressed
                return '';
            }
            key = ''; // No key, only modifiers
        }

        return [...modifiers, key].filter(Boolean).join('+');
    }

    private normalizeKeyCombination(keyCombo: string): string {
        const parts = keyCombo.split('+').map(part => part.trim());
        const modifiers = [];
        let key = '';

        for (const part of parts) {
            switch (part.toLowerCase()) {
                case 'control':
                case 'ctrl':
                    modifiers.push('Control');
                    break;
                case 'shift':
                    modifiers.push('Shift');
                    break;
                case 'alt':
                    modifiers.push('Alt');
                    break;
                case 'meta':
                    modifiers.push('Control'); // Treat Meta as Control
                    break;
                default:
                    key = part;
                    break;
            }
        }

        // Sort modifiers to ensure consistent order
        modifiers.sort();

        return [...modifiers, key].filter(Boolean).join('+');
    }

    private handleKeyDown(event: KeyboardEvent) {
        const keyCombination = this.normalizeKey(event);
        if (document.body.getAttribute('data-settings-open') === 'true') {
            return;
        }

        if (!keyCombination) return;

        for (const shortcut of this.shortcuts) {
            if (shortcut.keys.includes(keyCombination)) {
                if (!shortcut.condition || shortcut.condition()) {
                    event.preventDefault();
                    shortcut.action();
                    break;
                }
            }
        }
    }

    /**
     * Registers a keyboard shortcut with the specified keys, action, and optional condition.
     *
     * @param keys - A string or an array of strings representing the key combinations for the shortcut.
     * @param action - A function to be executed when the shortcut is triggered.
     * @param condition - An optional function that returns a boolean indicating whether the shortcut should be active.
     */
    public registerShortcut(
        keys: string | string[],
        action: () => void,
        condition?: () => boolean
    ) {
        if (typeof keys === 'string') {
            keys = [keys];
        }

        // Normalize keys
        keys = keys.map(keyCombo => this.normalizeKeyCombination(keyCombo));

        this.shortcuts.push({ keys, action, condition });
    }
}

export { ShortcutManager };
