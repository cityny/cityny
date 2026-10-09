/**
 * Preview tooltip positioning helpers
 */

function updatePreviewTooltipPosition(container) {
  const tooltip = container.querySelector(".preview-tooltip");
  if (!tooltip) return;

  // Prefer the job-title as anchor; fall back to any inline icon if present.
  const anchor =
    container.querySelector(".job-title") ||
    container.querySelector(".material-symbols-outlined");
  const containerRect = container.getBoundingClientRect();
  const anchorRect = anchor ? anchor.getBoundingClientRect() : containerRect;

  // Measure tooltip width (ensure it's visible when measuring)
  let tooltipWidth =
    tooltip.offsetWidth || tooltip.getBoundingClientRect().width;
  const viewportWidth = window.innerWidth;

  // Compute ideal left in viewport coordinates (centered on anchor)
  const anchorCenterViewport = anchorRect.left + anchorRect.width / 2;
  const idealLeftViewport = anchorCenterViewport - tooltipWidth / 2;

  // Clamp to viewport edges with 8px padding
  const minViewportLeft = 8;
  const maxViewportLeft = Math.max(
    minViewportLeft,
    viewportWidth - tooltipWidth - 8,
  );
  const clampedLeftViewport = Math.max(
    minViewportLeft,
    Math.min(idealLeftViewport, maxViewportLeft),
  );

  // Convert to container-relative left
  const leftRelative = clampedLeftViewport - containerRect.left;

  tooltip.style.left = `${leftRelative}px`;
  tooltip.style.right = "auto";
  tooltip.style.transform = "none";

  // Calculate arrow offset (anchor center relative to tooltip left) and expose via CSS variable
  const arrowOffset = Math.round(anchorCenterViewport - clampedLeftViewport);
  tooltip.style.setProperty("--arrow-pos", `${arrowOffset}px`);
}

function clearPreviewTooltipPosition(container) {
  const tooltip = container.querySelector(".preview-tooltip");
  if (!tooltip) return;
  tooltip.style.left = "";
  tooltip.style.right = "";
  tooltip.style.transform = "";
  tooltip.style.removeProperty("--arrow-pos");
}

export function initMobilePreviewTooltips() {
  // Attach behavior for both touch and pointer devices. We recalculate position
  // on click (toggle) and on mouseenter (hover) so the tooltip never overflows.
  const previewContainers = document.querySelectorAll(
    ".project-preview-container",
  );
  if (!previewContainers.length) return;

  previewContainers.forEach((container) => {
    const tooltip = container.querySelector(".preview-tooltip");
    if (!tooltip) return;

    // Prefer the focusable job-title inside the container when present
    const anchor = container.querySelector(".job-title");

    container.addEventListener("click", (event) => {
      event.stopPropagation();
      const isActive = container.classList.contains("tooltip-active");
      document
        .querySelectorAll(".project-preview-container.tooltip-active")
        .forEach((activeContainer) => {
          if (activeContainer !== container) {
            activeContainer.classList.remove("tooltip-active");
            clearPreviewTooltipPosition(activeContainer);
            const activeAnchor = activeContainer.querySelector(".job-title");
            if (activeAnchor)
              activeAnchor.setAttribute("aria-expanded", "false");
          }
        });

      if (isActive) {
        container.classList.remove("tooltip-active");
        clearPreviewTooltipPosition(container);
        if (anchor) anchor.setAttribute("aria-expanded", "false");
      } else {
        container.classList.add("tooltip-active");
        if (anchor) anchor.setAttribute("aria-expanded", "true");
        // Wait a frame so CSS visibility/layout updates and we can measure width
        requestAnimationFrame(() => updatePreviewTooltipPosition(container));
      }
    });

    // Keyboard support: Enter or Space should toggle the preview when focused
    if (anchor) {
      anchor.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          container.click();
        }
      });
    }

    // For pointer/desktop devices, recalc on hover and clear on leave
    container.addEventListener("mouseenter", () => {
      requestAnimationFrame(() => updatePreviewTooltipPosition(container));
    });
    container.addEventListener("mouseleave", () => {
      clearPreviewTooltipPosition(container);
    });
  });

  window.addEventListener("resize", () => {
    document
      .querySelectorAll(".project-preview-container.tooltip-active")
      .forEach((container) => updatePreviewTooltipPosition(container));
  });

  document.addEventListener("click", () => {
    document
      .querySelectorAll(".project-preview-container.tooltip-active")
      .forEach((container) => {
        container.classList.remove("tooltip-active");
        clearPreviewTooltipPosition(container);
      });
  });
}
