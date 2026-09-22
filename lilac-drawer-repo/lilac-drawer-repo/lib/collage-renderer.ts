import { formatPriceFixed } from "@/lib/format";

export interface RenderableCollageItem {
  id: string;
  sourceType: "catalog" | "upload";
  productId?: number;
  productSlug?: string;
  title: string;
  imageUrl?: string | null;
  imageLabel?: string;
  priceCents?: number;
  category?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  opacity?: number;
}

// Helper: Draw rounded rectangle path
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Helper: Draw image with object-contain (natural aspect ratio preserved)
function drawImageContained(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const naturalW = img.naturalWidth || w;
  const naturalH = img.naturalHeight || h;
  const imgAspect = naturalW / naturalH;
  const boxAspect = w / h;

  let drawW = w;
  let drawH = h;
  let drawX = x;
  let drawY = y;

  if (imgAspect > boxAspect) {
    drawW = w;
    drawH = w / imgAspect;
    drawY = y + (h - drawH) / 2;
  } else {
    drawH = h;
    drawW = h * imgAspect;
    drawX = x + (w - drawW) / 2;
  }

  ctx.drawImage(img, drawX, drawY, drawW, drawH);
}

/**
 * High-performance client-side collage renderer.
 * Accurately arranges all items, frames them in elegant white shadow cards,
 * displays item title and price tags, and outputs a high-resolution base64 JPEG data URL.
 */
export function renderCollageToDataUrl(
  items: RenderableCollageItem[],
  canvasBg: "cream" | "white" | "mauve" | "sage" = "cream",
  showGrid = true,
  maxDimension = 1400
): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || items.length === 0) {
      resolve("");
      return;
    }

    // 1. Calculate bounding box of all items
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const it of items) {
      minX = Math.min(minX, it.x);
      minY = Math.min(minY, it.y);
      maxX = Math.max(maxX, it.x + it.width);
      maxY = Math.max(maxY, it.y + it.height);
    }

    const margin = 80;
    const headerH = 100;
    const contentW = Math.max(800, maxX - minX);
    const contentH = Math.max(500, maxY - minY);

    const fullW = Math.round(contentW + margin * 2);
    const fullH = Math.round(contentH + margin * 2 + headerH);

    // Limit maximum dimension to prevent huge payloads while keeping crisp clarity
    let scale = 1;
    if (fullW > maxDimension || fullH > maxDimension) {
      scale = Math.min(maxDimension / fullW, maxDimension / fullH);
    }

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = Math.round(fullW * scale);
    exportCanvas.height = Math.round(fullH * scale);

    const ctx = exportCanvas.getContext("2d");
    if (!ctx) {
      resolve("");
      return;
    }

    ctx.scale(scale, scale);

    // Background color
    const bgColor =
      canvasBg === "white"
        ? "#ffffff"
        : canvasBg === "cream"
        ? "#fbf6f0"
        : canvasBg === "mauve"
        ? "#f6eff8"
        : "#edf4ea";

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, fullW, fullH);

    // Optional Dot Grid in background
    if (showGrid) {
      ctx.fillStyle = "rgba(122, 90, 140, 0.15)";
      for (let gx = 0; gx < fullW; gx += 24) {
        for (let gy = 0; gy < fullH; gy += 24) {
          ctx.beginPath();
          ctx.arc(gx, gy, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Header Branding & Timestamp
    ctx.fillStyle = "#4a3058";
    ctx.font = "bold 26px 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Lilac Drawer Moodboard", margin, 50);

    ctx.fillStyle = "#9a8898";
    ctx.font = "13px 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(
      new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      margin,
      74
    );

    // Sort items by zIndex
    const sorted = [...items].sort((a, b) => a.zIndex - b.zIndex);
    let loadedCount = 0;
    const totalCount = sorted.length;
    let completed = false;

    // Timeout guard: if an image fails or takes too long to load, still complete after 4s
    const timeoutId = setTimeout(() => {
      if (!completed) {
        completed = true;
        resolve(exportCanvas.toDataURL("image/jpeg", 0.88));
      }
    }, 4000);

    function checkFinish() {
      if (loadedCount >= totalCount && !completed) {
        completed = true;
        clearTimeout(timeoutId);
        resolve(exportCanvas.toDataURL("image/jpeg", 0.88));
      }
    }

    if (totalCount === 0) {
      checkFinish();
      return;
    }

    sorted.forEach((item) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      const renderCard = (imageLoaded: boolean) => {
        ctx.save();

        const cardW = item.width;
        const cardH = item.height;
        const cardCenterX = item.x - minX + margin + cardW / 2;
        const cardCenterY = item.y - minY + margin + headerH + cardH / 2;

        ctx.translate(cardCenterX, cardCenterY);
        ctx.rotate((item.rotation * Math.PI) / 180);

        if (item.opacity !== undefined && item.opacity < 1) {
          ctx.globalAlpha = item.opacity;
        }

        // 1. Outer white card with subtle shadow
        ctx.shadowColor = "rgba(100, 70, 90, 0.14)";
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 6;
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "rgba(220, 205, 225, 0.85)";
        ctx.lineWidth = 1;

        drawRoundedRect(ctx, -cardW / 2, -cardH / 2, cardW, cardH, 16);
        ctx.fill();
        ctx.shadowColor = "transparent";
        ctx.stroke();

        // 2. Inner image container
        const padding = 12;
        const innerX = -cardW / 2 + padding;
        const innerY = -cardH / 2 + padding;
        const innerW = cardW - padding * 2;
        const innerH = cardH - padding * 2 - 28;

        ctx.fillStyle = "rgba(244, 235, 248, 0.45)";
        drawRoundedRect(ctx, innerX, innerY, innerW, innerH, 10);
        ctx.fill();

        // 3. Draw image with object-contain
        if (imageLoaded && img.naturalWidth) {
          drawImageContained(ctx, img, innerX + 6, innerY + 6, innerW - 12, innerH - 12);
        } else {
          ctx.fillStyle = "#7a5a8c";
          ctx.font = "12px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(item.title, 0, innerY + innerH / 2);
        }

        // 4. Bottom label bar (Title + Price)
        const labelY = innerY + innerH + 18;
        ctx.fillStyle = "#4a3058";
        ctx.font = "bold 12px sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";

        const priceText = item.priceCents != null ? formatPriceFixed(item.priceCents) : "";
        const priceWidth = priceText ? ctx.measureText(priceText).width + 12 : 0;
        const maxTitleWidth = innerW - priceWidth;

        let displayTitle = item.title;
        if (ctx.measureText(displayTitle).width > maxTitleWidth) {
          while (displayTitle.length > 3 && ctx.measureText(displayTitle + "…").width > maxTitleWidth) {
            displayTitle = displayTitle.slice(0, -1);
          }
          displayTitle += "…";
        }
        ctx.fillText(displayTitle, innerX + 2, labelY);

        if (priceText) {
          ctx.fillStyle = "#d4708f";
          ctx.font = "bold 12px sans-serif";
          ctx.textAlign = "right";
          ctx.fillText(priceText, innerX + innerW - 2, labelY);
        }

        ctx.restore();

        loadedCount++;
        checkFinish();
      };

      img.onload = () => renderCard(true);
      img.onerror = () => renderCard(false);
      img.src = item.imageUrl || "/placeholder.png";
    });
  });
}
