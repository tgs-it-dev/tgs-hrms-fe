/**
 * Layout dimension constants.
 *
 * These values are used across Navbar, Sidebar, and Layout components.
 * Keep in sync with the Zustand uiStore DEFAULT_SIDEBAR_WIDTH if applicable.
 */

/** Default sidebar width in pixels (collapsed breakpoints use 240px) */
export const SIDEBAR_WIDTH = 280;

/** Collapsed sidebar width used on xs/sm viewports */
export const SIDEBAR_WIDTH_COLLAPSED = 240;

/** Navbar / app-bar height in pixels */
export const NAVBAR_HEIGHT = 64;

/** z-index for modal dialogs — matches MUI default modal z-index */
export const MODAL_Z_INDEX = 1300;
