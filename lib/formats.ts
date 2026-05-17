import type { PdfFormat, PdfOrientation } from "@/lib/schema";

type FormatPreset = {
  label: string;
  width: number;
  height: number;
  unit: "px" | "mm";
  pdfFormat?: "A4";
};

export const FORMAT_PRESETS: Record<PdfFormat, FormatPreset> = {
  A4: {
    label: "A4",
    width: 210,
    height: 297,
    unit: "mm",
    pdfFormat: "A4",
  },
  "1080x1920": {
    label: "1080 x 1920",
    width: 1080,
    height: 1920,
    unit: "px",
  },
  "1080x1080": {
    label: "1080 x 1080",
    width: 1080,
    height: 1080,
    unit: "px",
  },
};

export function getFormatSize(format: PdfFormat, orientation: PdfOrientation) {
  const preset = FORMAT_PRESETS[format];
  const shouldFlip = orientation === "horizontal" && preset.width < preset.height;

  return {
    ...preset,
    width: shouldFlip ? preset.height : preset.width,
    height: shouldFlip ? preset.width : preset.height,
  };
}

export function getCssPageSize(format: PdfFormat, orientation: PdfOrientation) {
  const size = getFormatSize(format, orientation);

  return {
    width: `${size.width}${size.unit}`,
    minHeight: `${size.height}${size.unit}`,
    aspectRatio: `${size.width} / ${size.height}`,
  };
}

export function getPreviewPixelSize(format: PdfFormat, orientation: PdfOrientation) {
  if (format === "1080x1920") {
    return orientation === "horizontal" ? { width: 1920, height: 1080 } : { width: 1080, height: 1920 };
  }

  if (format === "1080x1080") {
    return { width: 1080, height: 1080 };
  }

  return orientation === "horizontal" ? { width: 1123, height: 794 } : { width: 794, height: 1123 };
}
