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

    register(): void {
        const positions: Record<string, string> = {};
        positions["topLeft"] = game.i18n.localize("DFredsNotifications.Settings.Position.TopLeft");
        positions["topCenter"] = game.i18n.localize("DFredsNotifications.Settings.Position.TopCenter");
        positions["topRight"] = game.i18n.localize("DFredsNotifications.Settings.Position.TopRight");
        positions["center"] = game.i18n.localize("DFredsNotifications.Settings.Position.Center");
        positions["bottomLeft"] = game.i18n.localize("DFredsNotifications.Settings.Position.BottomLeft");
        positions["bottomCenter"] = game.i18n.localize("DFredsNotifications.Settings.Position.BottomCenter");
        positions["bottomRight"] = game.i18n.localize("DFredsNotifications.Settings.Position.BottomRight");

        game.settings.register(MODULE_ID, this.#POSITION, {
            name: "DFredsNotifications.Settings.Position.Name",
            hint: "DFredsNotifications.Settings.Position.Hint",
            scope: "client",
            config: true,
            default: "topCenter",
            choices: positions,
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

        const unreadPipLevels: Record<string, string> = {};
        unreadPipLevels[UNREAD_PIP_LEVELS.ALL] = game.i18n.localize("DFredsNotifications.Settings.UnreadPip.All");
        unreadPipLevels[UNREAD_PIP_LEVELS.WARNING] = game.i18n.localize(
            "DFredsNotifications.Settings.UnreadPip.Warning",
        );
        unreadPipLevels[UNREAD_PIP_LEVELS.ERROR] = game.i18n.localize("DFredsNotifications.Settings.UnreadPip.Error");
        unreadPipLevels[UNREAD_PIP_LEVELS.NONE] = game.i18n.localize("DFredsNotifications.Settings.UnreadPip.None");

        game.settings.register(MODULE_ID, this.#UNREAD_PIP, {
            name: "DFredsNotifications.Settings.UnreadPip.Name",
            hint: "DFredsNotifications.Settings.UnreadPip.Hint",
            scope: "client",
            config: true,
            default: UNREAD_PIP_LEVELS.ALL,
            choices: unreadPipLevels,
            type: String,
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
}

export { Settings };
