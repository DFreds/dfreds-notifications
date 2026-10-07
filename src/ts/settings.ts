import { MODULE_ID, UNREAD_PIP_LEVELS } from "./constants.ts";
import type { UnreadPipLevel } from "./constants.ts";

/**
 * Module settings.
 */
class Settings {
    // Config keys
    #POSITION = "position";
    #MAX_ACTIVE = "maxActive";
    #DURATION = "duration";
    #UNREAD_PIP = "unreadPip";
    #MUTED_MESSAGES = "mutedMessages";

    register(): void {
        game.settings.register(MODULE_ID, this.#POSITION, {
            name: "DFredsNotifications.Settings.Position.Name",
            hint: "DFredsNotifications.Settings.Position.Hint",
            scope: "client",
            config: true,
            default: "topCenter",
            choices: {
                topLeft: game.i18n.localize("DFredsNotifications.Settings.Position.TopLeft"),
                topCenter: game.i18n.localize("DFredsNotifications.Settings.Position.TopCenter"),
                topRight: game.i18n.localize("DFredsNotifications.Settings.Position.TopRight"),
                center: game.i18n.localize("DFredsNotifications.Settings.Position.Center"),
                bottomLeft: game.i18n.localize("DFredsNotifications.Settings.Position.BottomLeft"),
                bottomCenter: game.i18n.localize("DFredsNotifications.Settings.Position.BottomCenter"),
                bottomRight: game.i18n.localize("DFredsNotifications.Settings.Position.BottomRight"),
            },
            type: String,
        });

        game.settings.register(MODULE_ID, this.#MAX_ACTIVE, {
            name: "DFredsNotifications.Settings.MaxActive.Name",
            hint: "DFredsNotifications.Settings.MaxActive.Hint",
            scope: "client",
            config: true,
            type: new foundry.data.fields.NumberField({
                min: 1,
                max: 10,
                step: 1,
                initial: 5,
            }),
        });

        game.settings.register(MODULE_ID, this.#DURATION, {
            name: "DFredsNotifications.Settings.Duration.Name",
            hint: "DFredsNotifications.Settings.Duration.Hint",
            scope: "client",
            config: true,
            type: new foundry.data.fields.NumberField({
                min: 1,
                max: 30,
                step: 1,
                initial: 5,
            }),
        });

        game.settings.register(MODULE_ID, this.#UNREAD_PIP, {
            name: "DFredsNotifications.Settings.UnreadPip.Name",
            hint: "DFredsNotifications.Settings.UnreadPip.Hint",
            scope: "client",
            config: true,
            default: UNREAD_PIP_LEVELS.ALL,
            choices: {
                [UNREAD_PIP_LEVELS.ALL]: game.i18n.localize("DFredsNotifications.Settings.UnreadPip.All"),
                [UNREAD_PIP_LEVELS.WARNING]: game.i18n.localize("DFredsNotifications.Settings.UnreadPip.Warning"),
                [UNREAD_PIP_LEVELS.ERROR]: game.i18n.localize("DFredsNotifications.Settings.UnreadPip.Error"),
                [UNREAD_PIP_LEVELS.NONE]: game.i18n.localize("DFredsNotifications.Settings.UnreadPip.None"),
            },
            type: String,
        });

        game.settings.register(MODULE_ID, this.#MUTED_MESSAGES, {
            name: "Muted Messages",
            scope: "client",
            config: false,
            default: [],
            type: Array,
        });
    }

    /**
     * Returns the game setting for where notifications appear on screen
     *
     * @returns an iziToast position value
     */
    get position(): string {
        return game.settings.get(MODULE_ID, this.#POSITION) as unknown as string;
    }

    /**
     * Returns the game setting for the maximum number of notifications displayed
     * at once
     *
     * @returns a number representing the concurrency cap
     */
    get maxActive(): number {
        return game.settings.get(MODULE_ID, this.#MAX_ACTIVE) as unknown as number;
    }

    /**
     * Returns the game setting for how long a non-permanent notification is
     * displayed. The setting itself is stored in seconds.
     *
     * @returns a number representing the duration in milliseconds
     */
    get durationMs(): number {
        return (game.settings.get(MODULE_ID, this.#DURATION) as unknown as number) * 1000;
    }

    /**
     * Returns the game setting for which notification types light the unread
     * indicator on the sidebar tab
     *
     * @returns the lowest severity that marks the history unread
     */
    get unreadPipLevel(): UnreadPipLevel {
        return game.settings.get(MODULE_ID, this.#UNREAD_PIP) as unknown as UnreadPipLevel;
    }

    /**
     * Returns the game setting for messages that are recorded in the history
     * but never displayed
     *
     * @returns the raw message or localization key of each muted notification
     */
    get mutedMessages(): string[] {
        return game.settings.get(MODULE_ID, this.#MUTED_MESSAGES) as unknown as string[];
    }

    /**
     * Sets the game setting for muted messages
     *
     * @param messages The raw message or localization key of each muted notification
     * @returns a promise that resolves when the setting is saved
     */
    async setMutedMessages(messages: string[]): Promise<unknown> {
        return game.settings.set(MODULE_ID, this.#MUTED_MESSAGES, messages);
    }
}

export { Settings };
