// Shared by every QR-code component in Phase 12 (ShareStorefront,
// StorefrontQRGenerator, EventQRCode) — renders the react-qr-code SVG
// already on the page to a canvas and downloads it as a PNG. Consolidates
// on react-qr-code everywhere (the plan's Phase 0 decision) instead of
// the source's mix of html2canvas (ShareStorefront.jsx) and two separate
// api.qrserver.com image requests (EventQRCode.jsx) — one dependency, no
// external QR-image-service availability risk, and no extra library
// (html2canvas) for what a plain SVG→canvas draw already does.
export function downloadSvgAsPng(svgElement: SVGSVGElement, filename: string, size = 512): Promise<void> {
  return new Promise((resolve, reject) => {
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas 2D context unavailable"));
        return;
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Failed to render PNG"));
          return;
        }
        const link = document.createElement("a");
        link.download = filename;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
        resolve();
      }, "image/png");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load QR image"));
    };
    img.src = url;
  });
}

export function slugifyForFilename(value: string | null | undefined): string {
  return (value || "qr")
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
