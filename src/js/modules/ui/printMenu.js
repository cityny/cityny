/**
 * Print menu helpers
 */

export function togglePrintOptions() {
  const options = document.getElementById("print-options");
  if (options) options.classList.toggle("active");
}

export function closePrintOptions() {
  const options = document.getElementById("print-options");
  if (options) options.classList.remove("active");
}
