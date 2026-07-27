import moduleData from "@static/module.json" with { type: "json" };

export const MODULE_ID = moduleData.id;

export const MODULE_IDS = {
    UI_EXTENDER: "lib-dfreds-ui-extender",
};

export const UNREAD_PIP_LEVELS = {
    ALL: "all",
    WARNING: "warning",
    ERROR: "error",
    NONE: "none",
} as const;

export type UnreadPipLevel = (typeof UNREAD_PIP_LEVELS)[keyof typeof UNREAD_PIP_LEVELS];
