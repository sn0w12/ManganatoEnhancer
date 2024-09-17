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
        const keys = [];

        // Treat Control and Meta as interchangeable
        if (event.ctrlKey || event.metaKey) keys.push('Control');
        if (event.shiftKey) keys.push('Shift');
        if (event.altKey) keys.push('Alt');

        // Exclude modifier-only keys
        if (!['Control', 'Shift', 'Alt', 'Meta'].includes(event.key)) {
            keys.push(event.key);
        } else if (keys.length === 0) {
            // Ignore events where only a modifier key is pressed
            return '';
        }

        return keys.join('+');
    }

    private handleKeyDown(event: KeyboardEvent) {
        const keyCombination = this.normalizeKey(event);

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

    public registerShortcut(keys: string | string[], action: () => void, condition?: () => boolean) {
        if (typeof keys === 'string') {
            keys = [keys];
        }
        this.shortcuts.push({ keys, action, condition });
    }
}
