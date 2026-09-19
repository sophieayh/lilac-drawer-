import type { EmailBlock } from "@/db/schema";

interface GenerateEmailOptions {
  subject?: string;
  previewText?: string;
  siteUrl?: string;
  unsubscribeUrl?: string;
}

/**
 * Generates cross-client, mobile-responsive HTML for Lilac Drawer email campaigns.
 * Bulletproof layout designed to prevent horizontal scrollbars and empty right-side gaps in Gmail (LTR & RTL).
 */
export function generateEmailHtml(
  blocks: EmailBlock[],
  options: GenerateEmailOptions = {}
): string {
  const siteUrl = options.siteUrl || "https://lilacdrawer.com";
  const previewText = options.previewText || "";
  const unsubscribeUrl = options.unsubscribeUrl || `${siteUrl}/unsubscribe`;

  const blocksHtml = blocks.map((block) => renderBlockHtml(block, siteUrl)).join("\n");

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no, address=no, email=no, date=no, url=no" />
  <title>${options.subject || "Lilac Drawer"}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      min-width: 100% !important;
      background-color: #f7f1eb;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
      border-collapse: collapse !important;
    }
    table {
      border-spacing: 0 !important;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      display: block;
    }
    .email-container {
      max-width: 600px !important;
      width: 100% !important;
      margin: 0 auto !important;
    }
    
    @media only screen and (max-width: 620px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }
      .mob-p-16 {
        padding-left: 16px !important;
        padding-right: 16px !important;
      }
      .mob-p-0 {
        padding-left: 0 !important;
        padding-right: 0 !important;
      }
      .stack-col {
        display: block !important;
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }
      .stack-col-img {
        padding-bottom: 12px !important;
        padding-right: 0 !important;
        padding-left: 0 !important;
        text-align: center !important;
      }
      .stack-col-img img {
        margin: 0 auto !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f1eb; width: 100% !important; min-width: 100%; -webkit-font-smoothing: antialiased; word-break: break-word; overflow-wrap: break-word;">
  <!-- Preheader Text -->
  ${previewText ? `<div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">${previewText}</div>` : ""}

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; width: 100%; background-color: #f7f1eb; margin: 0; padding: 0;">
    <tr>
      <td align="center" valign="top" style="padding: 24px 8px; background-color: #f7f1eb; text-align: center;">
        
        <!--[if (gte mso 9)|(IE)]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="600">
        <tr>
        <td align="center" valign="top" width="600">
        <![endif]-->

        <!-- 600px Container Card -->
        <table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #eadfd5; border-collapse: separate; box-shadow: 0 4px 20px rgba(90, 47, 69, 0.05); text-align: start;">
          <tr>
            <td style="padding: 0; background-color: #ffffff;">
              ${blocksHtml}
            </td>
          </tr>
        </table>

        <!-- Micro Footer -->
        <table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 600px; width: 100%; margin: 16px auto 0; border-collapse: collapse;">
          <tr>
            <td align="center" style="font-size: 11px; color: #a89485; font-family: 'Plus Jakarta Sans', Arial, sans-serif; line-height: 1.6; padding: 8px; text-align: center;">
              You received this email because you subscribed to Lilac Drawer.<br>
              <a href="${unsubscribeUrl}" style="color: #c97a8e; text-decoration: underline;">Unsubscribe</a> &nbsp;•&nbsp; 
              <a href="${siteUrl}" style="color: #a89485; text-decoration: underline;">Visit Lilac Drawer</a>
            </td>
          </tr>
        </table>

        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->

      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderBlockHtml(block: EmailBlock, siteUrl: string): string {
  const dir = block.direction || (block.alignment === "right" ? "rtl" : "ltr");
  const align = block.alignment || (dir === "rtl" ? "right" : dir === "ltr" ? "left" : "center");
  const alignStyle = `text-align: ${align};`;
  const dirStyle = `direction: ${dir};`;

  switch (block.type) {
    case "header":
      return `
      <!-- Block: Header -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" dir="${dir}" style="border-bottom: 1px solid #eadfd5; background: linear-gradient(135deg, #f8f1f7 0%, #fef8f4 100%);">
        <tr>
          <td align="${align}" class="mob-p-16" style="padding: 24px 28px; ${dirStyle} ${alignStyle}">
            <a href="${siteUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
              <span style="font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 700; color: #c9a3c6; letter-spacing: -0.5px;">
                Lilac <span style="color: #c49a45;">Drawer</span>
              </span>
            </a>
            ${block.subtitle ? `<div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #c97a8e; font-weight: 700; margin-top: 6px; ${alignStyle}">${block.subtitle}</div>` : ""}
          </td>
        </tr>
      </table>`;

    case "hero_banner":
      return `
      <!-- Block: Hero Banner -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" dir="${dir}">
        <tr>
          <td align="${align}" class="mob-p-16" style="padding: 22px 28px 12px; ${dirStyle}">
            ${block.imageUrl ? `
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 14px;">
              <tr>
                <td align="center" style="border-radius: 14px; overflow: hidden; border: 1px solid #eadfd5; background-color: #fbf6f0;">
                  <img src="${block.imageUrl}" alt="${block.imageAlt || block.title || 'Banner'}" width="100%" style="display: block; width: 100%; max-width: 100%; height: auto; border-radius: 14px; border: 0;" />
                </td>
              </tr>
            </table>` : ""}
            ${block.title ? `<h1 style="font-family: 'Playfair Display', Georgia, serif; font-size: 23px; font-weight: 700; color: #3a2230; margin: 0 0 10px; line-height: 1.35; ${alignStyle} ${dirStyle}">${block.title}</h1>` : ""}
            ${block.content ? `<p style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 14px; color: #6a5360; line-height: 1.65; margin: 0 0 14px; ${alignStyle} ${dirStyle}">${block.content}</p>` : ""}
            ${block.buttonText && block.buttonUrl ? `
            <div style="${alignStyle} margin-top: 14px;">
              <a href="${block.buttonUrl}" target="_blank" style="display: inline-block; background-color: #c9a3c6; color: #ffffff; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; font-weight: 700; text-decoration: none; padding: 11px 26px; border-radius: 50px; box-shadow: 0 4px 12px rgba(201, 163, 198, 0.35);">
                ${block.buttonText}
              </a>
            </div>` : ""}
          </td>
        </tr>
      </table>`;

    case "heading":
      return `
      <!-- Block: Heading -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" dir="${dir}">
        <tr>
          <td align="${align}" class="mob-p-16" style="padding: 18px 28px 4px; ${dirStyle} ${alignStyle}">
            ${block.subtitle ? `<div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #c97a8e; font-weight: 700; margin-bottom: 4px; ${alignStyle}">${block.subtitle}</div>` : ""}
            <h2 style="font-family: 'Playfair Display', Georgia, serif; font-size: 21px; font-weight: 700; color: #3a2230; margin: 0 0 8px; line-height: 1.3; ${alignStyle} ${dirStyle}">
              ${block.title || "Section Heading"}
            </h2>
            <div style="width: 32px; height: 2px; background-color: #c9a3c6; border-radius: 2px; display: inline-block; margin-bottom: 4px;"></div>
          </td>
        </tr>
      </table>`;

    case "text":
      return `
      <!-- Block: Rich Text -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" dir="${dir}">
        <tr>
          <td class="mob-p-16" style="padding: 8px 28px 12px; ${alignStyle} ${dirStyle} font-size: 14px; color: #5a4550; line-height: 1.75; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
            ${(block.content || "").replace(/\n/g, "<br>")}
          </td>
        </tr>
      </table>`;

    case "product_card": {
      const isRtl = dir === "rtl";
      const imagePadding = isRtl ? "padding-left: 14px; padding-right: 0;" : "padding-right: 14px; padding-left: 0;";

      return `
      <!-- Block: Product Highlight Card -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" dir="${dir}">
        <tr>
          <td class="mob-p-16" style="padding: 10px 28px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" dir="${dir}" style="background-color: #fdfaf7; border: 1px solid #eadfd5; border-radius: 16px; border-collapse: separate; overflow: hidden;">
              <tr>
                <td style="padding: 14px 16px;">
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" dir="${dir}">
                    <tr>
                      <td width="105" valign="middle" class="stack-col stack-col-img" align="center" style="width: 105px; ${imagePadding}">
                        ${block.imageUrl ? `
                        <a href="${block.productUrl || siteUrl}" target="_blank" style="text-decoration: none; display: block;">
                          <img src="${block.imageUrl}" alt="${block.productName || 'Product'}" width="95" style="display: block; width: 95px; max-width: 95px; height: auto; border-radius: 12px; background-color: #ffffff; border: 1px solid #efe4da; padding: 3px;" />
                        </a>` : `
                        <div style="width: 85px; height: 85px; background-color: #f3e9e3; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #8e7a70; font-size: 11px;">Product Photo</div>`}
                      </td>
                      <td valign="middle" class="stack-col" style="${alignStyle} ${dirStyle}">
                        ${block.productBadge ? `<span style="display: inline-block; background-color: #c49a45; color: #ffffff; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 20px; text-transform: uppercase; margin-bottom: 5px;">${block.productBadge}</span>` : ""}
                        <h3 style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 15px; font-weight: 700; color: #3a2230; margin: 0 0 5px; line-height: 1.35; ${alignStyle}">
                          <a href="${block.productUrl || siteUrl}" target="_blank" style="color: #3a2230; text-decoration: none;">
                            ${block.productName || "Product Name"}
                          </a>
                        </h3>
                        ${block.content ? `<p style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; color: #7a6670; line-height: 1.5; margin: 0 0 8px; ${alignStyle}">${block.content}</p>` : ""}
                        <div style="${alignStyle}">
                          <span style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 15px; font-weight: 700; color: #c97a8e; display: inline-block; vertical-align: middle;">${block.productPrice || "$0.00"}</span>
                          ${block.productComparePrice ? `<span style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; color: #a89485; text-decoration: line-through; display: inline-block; vertical-align: middle; ${isRtl ? 'margin-right: 6px;' : 'margin-left: 6px;'}">${block.productComparePrice}</span>` : ""}
                          <a href="${block.productUrl || siteUrl}" target="_blank" style="display: inline-block; vertical-align: middle; background-color: #3a2230; color: #ffffff; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; font-weight: 700; text-decoration: none; padding: 6px 14px; border-radius: 20px; ${isRtl ? 'margin-right: 10px;' : 'margin-left: 10px;'}">
                            ${isRtl ? "عرض التفاصيل &larr;" : "View Deal &rarr;"}
                          </a>
                        </div>
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
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" dir="${dir}">
        <tr>
          <td class="mob-p-16" style="padding: 10px 28px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" dir="${dir}" style="background-color: #ffffff; border: 1px solid #eadfd5; border-radius: 16px; border-collapse: separate; overflow: hidden; box-shadow: 0 4px 12px rgba(90, 47, 69, 0.04);">
              ${block.imageUrl ? `
              <tr>
                <td style="padding: 0;">
                  <a href="${block.articleUrl || siteUrl}" target="_blank" style="text-decoration: none; display: block;">
                    <img src="${block.imageUrl}" alt="${block.articleTitle || 'Article'}" width="100%" style="display: block; width: 100%; max-width: 100%; height: 170px; object-fit: cover; border-top-left-radius: 16px; border-top-right-radius: 16px;" />
                  </a>
                </td>
              </tr>` : ""}
              <tr>
                <td style="padding: 16px 20px; ${alignStyle} ${dirStyle}">
                  ${block.articleCategory ? `<span style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #c97a8e; display: inline-block; margin-bottom: 4px;">${block.articleCategory}</span>` : ""}
                  <h3 style="font-family: 'Playfair Display', Georgia, serif; font-size: 18px; font-weight: 700; color: #3a2230; margin: 4px 0 8px; line-height: 1.35; ${alignStyle}">
                    <a href="${block.articleUrl || siteUrl}" target="_blank" style="color: #3a2230; text-decoration: none;">
                      ${block.articleTitle || "Article Title"}
                    </a>
                  </h3>
                  ${block.articleExcerpt ? `<p style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; color: #6a5360; line-height: 1.55; margin: 0 0 10px; ${alignStyle}">${block.articleExcerpt}</p>` : ""}
                  <div style="${alignStyle}">
                    <a href="${block.articleUrl || siteUrl}" target="_blank" style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; font-weight: 700; color: #c97a8e; text-decoration: none; display: inline-block;">
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
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" dir="${dir}">
        <tr>
          <td align="${align}" class="mob-p-16" style="padding: 10px 28px 16px; ${alignStyle} ${dirStyle}">
            <a href="${block.buttonUrl || siteUrl}" target="_blank" style="display: inline-block; background-color: ${btnBg}; color: ${btnColor}; font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 50px; box-shadow: 0 4px 14px rgba(90, 47, 69, 0.15);">
              ${block.buttonText || "Discover More"}
            </a>
          </td>
        </tr>
      </table>`;
    }

    case "coupon":
      return `
      <!-- Block: Coupon Box -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" dir="${dir}">
        <tr>
          <td align="center" class="mob-p-16" style="padding: 12px 28px;">
            <table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="border: 2px dashed #c9a3c6; background-color: #fdf5f8; border-radius: 16px; border-collapse: separate; margin: 0 auto; width: 100%;">
              <tr>
                <td align="center" style="padding: 18px 20px; text-align: center;">
                  ${block.couponDiscount ? `<div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; font-weight: 800; color: #c97a8e; text-transform: uppercase; letter-spacing: 1px;">${block.couponDiscount}</div>` : ""}
                  <div dir="ltr" style="direction: ltr; font-family: 'Plus Jakarta Sans', monospace; font-size: 20px; font-weight: 800; letter-spacing: 2.5px; color: #3a2230; margin: 8px auto; padding: 6px 16px; background-color: #ffffff; border-radius: 8px; display: inline-block; border: 1px solid #eadfd5;">
                    ${block.couponCode || "LILACVIP"}
                  </div>
                  ${block.couponNote ? `<div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 11px; color: #8e7a70; margin-top: 6px;">${block.couponNote}</div>` : ""}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;

    case "divider":
      return `
      <!-- Block: Divider -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td class="mob-p-16" style="padding: 10px 28px;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
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
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" dir="${dir}" style="background-color: #f8f2ed; border-top: 1px solid #eadfd5;">
        <tr>
          <td align="${align}" class="mob-p-16" style="padding: 22px 28px; background-color: #f8f2ed; ${dirStyle} ${alignStyle}">
            <div style="font-family: 'Playfair Display', Georgia, serif; font-size: 18px; font-weight: 700; color: #3a2230; margin-bottom: 8px;">
              Lilac <span style="color: #c49a45;">Drawer</span>
            </div>
            <p style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; font-size: 12px; color: #7a6670; margin: 0 0 12px; max-width: 380px; line-height: 1.55; ${align === 'center' ? 'margin-left: auto; margin-right: auto;' : ''}">
              Honest beauty reviews, tested clothing care, and curated recommendations worth your time.
            </p>
            <div style="margin-bottom: 12px;">
              <a href="${siteUrl}/deals" style="display: inline-block; margin: 0 6px; font-size: 11px; font-weight: 700; color: #c97a8e; text-decoration: none;">Deals</a>
              <a href="${siteUrl}/blog" style="display: inline-block; margin: 0 6px; font-size: 11px; font-weight: 700; color: #c97a8e; text-decoration: none;">Blog</a>
              <a href="${siteUrl}/explore" style="display: inline-block; margin: 0 6px; font-size: 11px; font-weight: 700; color: #c97a8e; text-decoration: none;">Explore</a>
              <a href="${siteUrl}/community" style="display: inline-block; margin: 0 6px; font-size: 11px; font-weight: 700; color: #c97a8e; text-decoration: none;">Community</a>
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
