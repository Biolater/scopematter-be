export const ServiceErrorCodes = {
    // Project
    PROJECT_NOT_FOUND: "PROJECT_NOT_FOUND",

    // ScopeItem
    SCOPE_ITEM_NOT_FOUND: "SCOPE_ITEM_NOT_FOUND",

    // Request
    REQUEST_NOT_FOUND: "REQUEST_NOT_FOUND",
    REQUEST_NOT_ELIGIBLE: "REQUEST_NOT_ELIGIBLE",

    // ChangeOrder
    CHANGE_ORDER_NOT_FOUND: "CHANGE_ORDER_NOT_FOUND",
    INVALID_STATUS_UPDATE: "INVALID_STATUS_UPDATE",

    // ShareLink
    SHARE_LINK_NOT_FOUND: "SHARE_LINK_NOT_FOUND",
    SHARE_LINK_NOT_ACTIVE: "SHARE_LINK_NOT_ACTIVE",
    SHARE_LINK_EXPIRED: "SHARE_LINK_EXPIRED",
} as const;

export type ServiceErrorCode =
    typeof ServiceErrorCodes[keyof typeof ServiceErrorCodes];
