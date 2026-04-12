/**
 * UI façade - re-exports specialized UI modules to keep existing imports stable.
 */

import { toggleTheme } from "./ui/theme.js";
import {
  initBackgroundVideo,
  openVideoModal,
  closeVideoModal,
} from "./ui/video.js";
import { togglePrintOptions, closePrintOptions } from "./ui/printMenu.js";
import { initMobilePreviewTooltips } from "./ui/previewTooltip.js";

export {
  toggleTheme,
  initBackgroundVideo,
  openVideoModal,
  closeVideoModal,
  togglePrintOptions,
  closePrintOptions,
  initMobilePreviewTooltips,
};

// Keep global window bindings for HTML inline handlers
window.openVideoModal = openVideoModal;
window.closeVideoModal = closeVideoModal;
window.toggleTheme = toggleTheme;
window.togglePrintOptions = togglePrintOptions;
