import type { EmailBlock } from "@/db/schema";

interface GenerateEmailOptions {
  subject?: string;
  previewText?: string;
  siteUrl?: string;
  unsubscribeUrl?: string;
}

/**
 * Generates cross-client, mobile-responsive HTML for Lilac Drawer email campaigns.
 * Supports per-block Direction (RTL / LTR) and Alignment (Left / Center / Right).
 */
export function generateEmailHtml(
  blocks: EmailBlock[],
  options: GenerateEmailOptions = {}
): string {
  const siteUrl = options.siteUrl || "https://lilacdrawer.com";
  const previewText = options.previewText || "";
  const unsubscribeUrl = options.unsubscribeUrl || `${siteUrl}/unsubscribe`;

  const blocksHtml = blocks.map((block) => renderBlockHtml(block, siteUrl)).join("\n");

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${options.subject || "Lilac Drawer"}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f7f1eb; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; margin: auto !important; }
      .stack-column { display: block !important; width: 100% !important; max-width: 100% !important; }
      .stack-column-img { padding-bottom: 12px !important; padding-right: 0 !important; padding-left: 0 !important; text-align: center !important; }
      .fluid-img { width: 100% !important; max-width: 100% !important; height: auto !important; }
      .mobile-p-4 { padding: 16px !important; }
      .mobile-text-center { text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f1eb; -webkit-font-smoothing: antialiased;">
  <!-- Preheader text for inbox preview -->
  ${previewText ? `<div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">${previewText} &zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>` : ""}
  
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f7f1eb;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <!-- Email Container (600px) -->
        <table border="0" cellpadding="0" cellspacing="0" width="600" class="email-container" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 8px 32px rgba(90, 47, 69, 0.08); border: 1px solid #eadfd5;">
          
          <!-- Email Content Blocks -->
          <tr>
            <td style="padding: 0;">
              ${blocksHtml}
            </td>
          </tr>

        </table>

        <!-- Micro Footer -->
        <table border="0" cellpadding="0" cellspacing="0" width="600" class="email-container" style="max-width: 600px; width: 100%; margin-top: 16px;">
          <tr>
            <td align="center" style="font-size: 11px; color: #a89485; font-family: 'Plus Jakarta Sans', sans-serif; line-height: 1.5; padding: 8px;">
              You received this email because you subscribed to Lilac Drawer.<br>
              <a href="${unsubscribeUrl}" style="color: #c97a8e; text-decoration: underline;">Unsubscribe</a> &nbsp;•&nbsp; 
              <a href="${siteUrl}" style="color: #a89485; text-decoration: underline;">Visit Lilac Drawer</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderBlockHtml(block: EmailBlock, siteUrl: string): string {
  // Determine block direction (default to ltr unless set or right-aligned)
  const dir = block.direction || (block.alignment === "right" ? "rtl" : "ltr");
  const align = block.alignment || (dir === "rtl" ? "right" : dir === "ltr" ? "left" : "center");
  const alignStyle = `text-align: ${align};`;
  const dirStyle = `direction: ${dir};`;

  switch (block.type) {
    case "header":
      return `
      <!-- Block: Header -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" dir="${dir}" style="${dirStyle} background: linear-gradient(135deg, #f8f1f7 0%, #fef8f4 100%); border-bottom: 1px solid #eadfd5;">
        <tr>
          <td align="${align}" style="padding: 28px 24px; ${alignStyle}">
            <a href="${siteUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
              <span style="font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 700; color: #c9a3c6; letter-spacing: -0.5px;">
                Lilac <span style="color: #c49a45;">Drawer</span>
              </span>
            </a>
            ${block.subtitle ? `<div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #c97a8e; font-weight: 700; margin-top: 6px; ${alignStyle}">${block.subtitle}</div>` : ""}
          </td>
        </tr>
      </table>`;

    case "hero_banner":
      return `
      <!-- Block: Hero Banner -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" dir="${dir}" style="${dirStyle} padding: 20px 24px 10px;">
        <tr>
          <td align="${align}">
            ${block.imageUrl ? `
            <div style="border-radius: 16px; overflow: hidden; border: 1px solid #eadfd5; margin-bottom: 16px; background-color: #fbf6f0;">
              <img src="${block.imageUrl}" alt="${block.imageAlt || block.title || 'Banner'}" width="552" class="fluid-img" style="display: block; width: 100%; max-width: 552px; height: auto; border-radius: 16px;" />
            </div>` : ""}
            ${block.title ? `<h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 700; color: #3a2230; margin: 0 0 10px; line-height: 1.3; ${alignStyle} ${dirStyle}">${block.title}</h1>` : ""}
            ${block.content ? `<p style="font-size: 14px; color: #6a5360; line-height: 1.6; margin: 0 0 16px; ${alignStyle} ${dirStyle}">${block.content}</p>` : ""}
            ${block.buttonText && block.buttonUrl ? `
            <div style="${alignStyle} margin-top: 14px;">
              <a href="${block.buttonUrl}" target="_blank" style="display: inline-block; background-color: #c9a3c6; color: #ffffff; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 50px; box-shadow: 0 4px 12px rgba(201, 163, 198, 0.35);">
                ${block.buttonText}
              </a>
            </div>` : ""}
          </td>
        </tr>
      </table>`;

    case "heading":
      return `
      <!-- Block: Heading -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" dir="${dir}" style="${dirStyle} padding: 18px 24px 6px;">
        <tr>
          <td align="${align}" style="${alignStyle}">
            ${block.subtitle ? `<div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #c97a8e; font-weight: 700; margin-bottom: 4px; ${alignStyle}">${block.subtitle}</div>` : ""}
            <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 22px; font-weight: 700; color: #3a2230; margin: 0 0 8px; line-height: 1.3; ${alignStyle} ${dirStyle}">
              ${block.title || "Section Heading"}
            </h2>
            <div style="width: 36px; height: 2.5px; background-color: #c9a3c6; border-radius: 2px; display: inline-block; margin-bottom: 4px;"></div>
          </td>
        </tr>
      </table>`;

    case "text":
      return `
      <!-- Block: Rich Text -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" dir="${dir}" style="${dirStyle} padding: 8px 24px 14px;">
        <tr>
          <td style="${alignStyle} ${dirStyle} font-size: 14px; color: #5a4550; line-height: 1.7; font-family: 'Plus Jakarta Sans', sans-serif;">
            ${(block.content || "").replace(/\n/g, "<br>")}
          </td>
        </tr>
      </table>`;

    case "product_card": {
      const isRtl = dir === "rtl";
      const imagePadding = isRtl ? "padding-left: 16px; padding-right: 0;" : "padding-right: 16px; padding-left: 0;";

      return `
      <!-- Block: Product Highlight Card -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" dir="${dir}" style="${dirStyle} padding: 12px 24px;">
        <tr>
          <td>
            <table border="0" cellpadding="0" cellspacing="0" width="100%" dir="${dir}" style="${dirStyle} background-color: #fdfaf7; border: 1px solid #eadfd5; border-radius: 18px; overflow: hidden; padding: 16px;">
              <tr>
                <td width="130" valign="middle" class="stack-column stack-column-img" align="center" style="${imagePadding}">
                  ${block.imageUrl ? `
                  <a href="${block.productUrl || siteUrl}" target="_blank">
                    <img src="${block.imageUrl}" alt="${block.productName || 'Product'}" width="120" style="display: block; width: 120px; max-width: 120px; height: auto; border-radius: 12px; background-color: #ffffff; border: 1px solid #efe4da; padding: 4px;" />
                  </a>` : `
                  <div style="width: 110px; height: 110px; background-color: #f3e9e3; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #8e7a70; font-size: 11px;">Product Photo</div>`}
                </td>
                <td valign="middle" class="stack-column" style="padding-top: 10px; ${alignStyle}">
                  ${block.productBadge ? `<span style="display: inline-block; background-color: #c49a45; color: #ffffff; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 20px; text-transform: uppercase; margin-bottom: 6px;">${block.productBadge}</span>` : ""}
                  <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px; font-weight: 700; color: #3a2230; margin: 0 0 6px; line-height: 1.3; ${alignStyle}">
                    <a href="${block.productUrl || siteUrl}" target="_blank" style="color: #3a2230; text-decoration: none;">
                      ${block.productName || "Product Name"}
                    </a>
                  </h3>
                  ${block.content ? `<p style="font-size: 12px; color: #7a6670; line-height: 1.5; margin: 0 0 10px; ${alignStyle}">${block.content}</p>` : ""}
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" dir="${dir}" style="${dirStyle}">
                    <tr>
                      <td valign="middle" style="${isRtl ? 'text-align: right;' : 'text-align: left;'}">
                        <span style="font-size: 16px; font-weight: 700; color: #c97a8e;">${block.productPrice || "$0.00"}</span>
                        ${block.productComparePrice ? `<span style="font-size: 12px; color: #a89485; text-decoration: line-through; ${isRtl ? 'margin-right: 6px;' : 'margin-left: 6px;'}">${block.productComparePrice}</span>` : ""}
                      </td>
                      <td align="${isRtl ? 'left' : 'right'}" valign="middle" style="${isRtl ? 'text-align: left;' : 'text-align: right;'}">
                        <a href="${block.productUrl || siteUrl}" target="_blank" style="display: inline-block; background-color: #3a2230; color: #ffffff; font-size: 11px; font-weight: 700; text-decoration: none; padding: 7px 16px; border-radius: 20px;">
                          ${isRtl ? "تفاصيل العرض &larr;" : "View Deal &rarr;"}
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;
    }

    case "article_card": {
      const isRtl = dir === "rtl";
      return `
      <!-- Block: Article Highlight Card -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" dir="${dir}" style="${dirStyle} padding: 12px 24px;">
        <tr>
          <td>
            <table border="0" cellpadding="0" cellspacing="0" width="100%" dir="${dir}" style="${dirStyle} background-color: #ffffff; border: 1px solid #eadfd5; border-radius: 18px; overflow: hidden; box-shadow: 0 4px 12px rgba(90, 47, 69, 0.04);">
              ${block.imageUrl ? `
              <tr>
                <td style="padding: 0;">
                  <a href="${block.articleUrl || siteUrl}" target="_blank">
                    <img src="${block.imageUrl}" alt="${block.articleTitle || 'Article'}" width="552" class="fluid-img" style="display: block; width: 100%; max-width: 552px; height: 180px; object-fit: cover; border-top-left-radius: 18px; border-top-right-radius: 18px;" />
                  </a>
                </td>
              </tr>` : ""}
              <tr>
                <td style="padding: 16px 20px; ${alignStyle}">
                  ${block.articleCategory ? `<span style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #c97a8e; display: inline-block; margin-bottom: 4px;">${block.articleCategory}</span>` : ""}
                  <h3 style="font-family: 'Playfair Display', Georgia, serif; font-size: 18px; font-weight: 700; color: #3a2230; margin: 4px 0 8px; line-height: 1.3; ${alignStyle}">
                    <a href="${block.articleUrl || siteUrl}" target="_blank" style="color: #3a2230; text-decoration: none;">
                      ${block.articleTitle || "Article Title"}
                    </a>
                  </h3>
                  ${block.articleExcerpt ? `<p style="font-size: 13px; color: #6a5360; line-height: 1.5; margin: 0 0 12px; ${alignStyle}">${block.articleExcerpt}</p>` : ""}
                  <div style="${alignStyle}">
                    <a href="${block.articleUrl || siteUrl}" target="_blank" style="font-size: 12px; font-weight: 700; color: #c97a8e; text-decoration: none; display: inline-block;">
                      ${isRtl ? "قراءة المقال بالكامل &larr;" : "Read Full Review &rarr;"}
                    </a>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;
    }

    case "button": {
      let btnBg = "#c9a3c6";
      let btnColor = "#ffffff";
      if (block.buttonStyle === "secondary") {
        btnBg = "#3a2230";
        btnColor = "#ffffff";
      } else if (block.buttonStyle === "gold") {
        btnBg = "#c49a45";
        btnColor = "#ffffff";
      } else if (block.buttonStyle === "outline") {
        btnBg = "transparent; border: 2px solid #c9a3c6";
        btnColor = "#3a2230";
      }
      return `
      <!-- Block: Button -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" dir="${dir}" style="${dirStyle} padding: 12px 24px 18px;">
        <tr>
          <td align="${align}" style="${alignStyle}">
            <a href="${block.buttonUrl || siteUrl}" target="_blank" style="display: inline-block; background-color: ${btnBg}; color: ${btnColor}; font-size: 13px; font-weight: 700; text-decoration: none; padding: 13px 32px; border-radius: 50px; box-shadow: 0 4px 14px rgba(90, 47, 69, 0.15);">
              ${block.buttonText || "Discover More"}
            </a>
          </td>
        </tr>
      </table>`;
    }

    case "coupon":
      return `
      <!-- Block: Coupon Box -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" dir="${dir}" style="${dirStyle} padding: 14px 24px;">
        <tr>
          <td align="${align}">
            <div style="border: 2px dashed #c9a3c6; background-color: #fdf5f8; border-radius: 16px; padding: 18px 24px; text-align: center; max-width: 480px; margin: auto;">
              ${block.couponDiscount ? `<div style="font-size: 11px; font-weight: 800; color: #c97a8e; text-transform: uppercase; letter-spacing: 1px;">${block.couponDiscount}</div>` : ""}
              <div dir="ltr" style="direction: ltr; font-family: 'Plus Jakarta Sans', monospace; font-size: 22px; font-weight: 800; letter-spacing: 3px; color: #3a2230; margin: 6px 0; padding: 6px 14px; background-color: #ffffff; border-radius: 8px; display: inline-block; border: 1px solid #eadfd5;">
                ${block.couponCode || "LILACVIP"}
              </div>
              ${block.couponNote ? `<div style="font-size: 11px; color: #8e7a70; margin-top: 6px;">${block.couponNote}</div>` : ""}
            </div>
          </td>
        </tr>
      </table>`;

    case "divider":
      return `
      <!-- Block: Divider -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="padding: 12px 24px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td height="1" style="background-color: #eadfd5; font-size: 1px; line-height: 1px;">&nbsp;</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;

    case "social_footer":
      return `
      <!-- Block: Social Footer -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%" dir="${dir}" style="${dirStyle} background-color: #f8f2ed; border-top: 1px solid #eadfd5; padding: 24px 24px;">
        <tr>
          <td align="${align}" style="${alignStyle}">
            <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 18px; font-weight: 700; color: #3a2230; margin-bottom: 8px;">
              Lilac <span style="color: #c49a45;">Drawer</span>
            </div>
            <p style="font-size: 12px; color: #7a6670; margin: 0 0 14px; max-width: 380px; line-height: 1.5; ${align === 'center' ? 'margin-left: auto; margin-right: auto;' : ''}">
              Honest beauty reviews, tested clothing care, and curated recommendations worth your time.
            </p>
            <div style="margin-bottom: 14px;">
              <a href="${siteUrl}/deals" style="display: inline-block; margin: 0 8px; font-size: 11px; font-weight: 700; color: #c97a8e; text-decoration: none;">Deals</a>
              <a href="${siteUrl}/blog" style="display: inline-block; margin: 0 8px; font-size: 11px; font-weight: 700; color: #c97a8e; text-decoration: none;">Blog</a>
              <a href="${siteUrl}/explore" style="display: inline-block; margin: 0 8px; font-size: 11px; font-weight: 700; color: #c97a8e; text-decoration: none;">Explore</a>
              <a href="${siteUrl}/community" style="display: inline-block; margin: 0 8px; font-size: 11px; font-weight: 700; color: #c97a8e; text-decoration: none;">Community</a>
            </div>
            <div style="font-size: 10px; color: #a89485;">
              &copy; ${new Date().getFullYear()} Lilac Drawer. All rights reserved.
            </div>
          </td>
        </tr>
      </table>`;

    default:
      return "";
  }
}
