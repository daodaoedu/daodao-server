import type { EmailTemplate, ContactEmailData } from './types';

export const generateContactEmail = (data: ContactEmailData): EmailTemplate => {
  const { name, message, userInfo, activityTitle, url, userId, roleList, photoUrl } = data;
  const subject = '有夥伴想聯繫你';
  const title = '有夥伴想聯繫你';
  
  const html = `
<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
  <title>${title}</title><!--[if !mso]><!-- -->
  <meta http-equiv="X-UA-Compatible" content="IE=edge"><!--<![endif]-->
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style type="text/css">
    #outlook a {
      padding: 0;
    }

    .ReadMsgBody {
      width: 100%;
    }

    .ExternalClass {
      width: 100%;
    }

    .ExternalClass * {
      line-height: 100%;
    }

    body {
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }

    table,
    td {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }

    img {
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      -ms-interpolation-mode: bicubic;
    }

    p {
      display: block;
      margin: 13px 0;
    }
  </style>
  <!--[if !mso]><!-->
  <style type="text/css">
    @media only screen and (max-width:480px) {
      @-ms-viewport {
        width: 320px;
      }
      @viewport {
        width: 320px;
      }
    }
  </style>
  <!--<![endif]-->
  <!--[if mso]>
        <xml>
        <o:OfficeDocumentSettings>
          <o:AllowPNG/>
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
        </xml>
        <![endif]-->
  <!--[if lte mso 11]>
        <style type="text/css">
          .outlook-group-fix { width:100% !important; }
        </style>
        <![endif]-->

  <style type="text/css">
    @media only screen and (min-width:480px) {
      .mj-column-per-100 {
        width: 100% !important;
        max-width: 100%;
      }
    }
  </style>

  <style type="text/css">
    @media only screen and (max-width:480px) {
      table.full-width-mobile {
        width: 100% !important;
      }
      td.full-width-mobile {
        width: auto !important;
      }
    }
  </style>

</head>

<body style="background-color:#59B6B2;">

  <div style="background-color:#59B6B2;">

    <div style="background:#ffffff;background-color:#ffffff;Margin:0px auto;max-width:600px;">

      <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
        style="background:#ffffff;background-color:#ffffff;width:100%;">
        <tbody>
          <tr>
            <td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;vertical-align:top;">

              <div class="mj-column-per-100 outlook-group-fix"
                style="font-size:13px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">

                <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;"
                  width="100%">

                  <tr>
                    <td align="center" style="font-size:0px;padding:10px 25px;word-break:break-word;">

                      <table border="0" cellpadding="0" cellspacing="0" role="presentation"
                        style="border-collapse:collapse;border-spacing:0px;">
                        <tbody>
                          <tr>
                            <td style="width:120px;">

                              <img height="auto" src="https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/logo.png"
                                style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;font-size:13px;"
                                width="120" />

                            </td>
                          </tr>
                        </tbody>
                      </table>

                    </td>
                  </tr>

                  <tr>
                    <td align="center"
                      style="font-size:0px;padding:10px 25px;padding-top:32px;padding-bottom:20px;word-break:break-word;">

                      <div
                        style="font-family:Noto Sans TC, sans-serif;font-size:22px;font-weight:700;line-height:1;text-align:center;color:#536166;">
                        ${title}</div>

                    </td>
                  </tr>

                  <tr>
                    <td align="left"
                      style="font-size:0px;padding:10px 25px;padding-left:40px;padding-right:40px;word-break:break-word;">

                      <div
                        style="font-family:Noto Sans TC, sans-serif;font-size:14px;line-height:140%;text-align:center;color:#536166;">
                        ${activityTitle ? `${name}來信詢問你發起的「${activityTitle}」揪團活動` : ''}
                      </div>

                    </td>
                  </tr>

                  <tr>
                    <td align="left" class="rounded userInfo"
                      style="border-radius: 16px; width: 100%; background: #DEF5F5; font-size: 0px; padding: 12px; word-break: break-word; margin: 0 25px;"
                      width="100%">
                      <div
                        style="font-family:Noto Sans TC, sans-serif;font-size:13px;font-weight:400;line-height:140%;text-align:left;color:#536166;">
                        <img width="60px" height="60px"
                          src="${photoUrl || 'https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/avatar.png'}"
                          alt="contact infomation"
                          style="display:inline-block;padding:0 8px 0 0;border-radius:50%;"> 
                        <span style="display:inline-block;padding:12px 0 0;vertical-align:top;">
                          <span style="display:block;font-size: 16px;font-weight: 700;padding: 0 0 4px;">${name}</span>
                          <span style="display:block;font-size: 14px;">${roleList?.[0] ?? ''}</span> 
                        </span>
                        ${url && userId ? `<span style="display:inline-block;text-align:right;vertical-align:top;padding:25px 0 0 10px;float:right;">
                          <a href="${url}/partner/detail?id=${userId}" 
                             style="color:#536166;font-family:Noto Sans TC;font-size:14px;font-weight:normal;Margin:0;text-decoration:none;text-transform:none;border:#16B9B3 1px solid;border-radius:20px;cursor:auto;padding:10px 20px;background:#DEF5F5;"
                             target="_blank">查看檔案</a>
                        </span>` : ''}
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td align="left"
                      style="font-size:0px;padding:10px 25px;padding-left:40px;padding-right:40px;word-break:break-word;">
                      <div
                        style="font-family:Noto Sans TC, sans-serif;font-size:10px;font-style:normal;font-weight:300;line-height:120%;text-align:left;color:#536166;padding:10px 0px;">
                        ${url && userId ? '「建議點開「查看檔案」，多了解夥伴後再決定是否要聯繫對方唷！」' : ''}
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td align="left"
                      style="font-size:0px;padding:0;padding-top:20px;padding-left:40px;padding-right:40px;word-break:break-word;">

                      <div
                        style="font-family:Noto Sans TC, sans-serif;font-size:13px;font-weight:400;line-height:140%;text-align:left;color:#536166;">
                        ${message}</div>

                    </td>
                  </tr>

                  <tr>
                    <td style="font-size:0px;padding:20px 40px;word-break:break-word;">
                      <p
                        style="border-top:solid 1px #F3F3F3;font-size:1;margin:0px auto;width:100%;">
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td align="left" style="font-size:0px;padding:0 40px;word-break:break-word;">
                      <div
                        style="font-family:Noto Sans TC, sans-serif;font-size:14px;font-weight:700;line-height:140%;text-align:left;color:#536166;">
                        <img width="18px" height="18px"
                          src="https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/message-icon.png"
                          alt="contact infomation" style="display:inline-block;padding:0;"> 
                        <span style="display:inline-block;padding:0;vertical-align:top;">歡迎用以下的方式聯繫我</span>
                      </div>
                    </td>
                  </tr>

                  ${Array.isArray(userInfo) ? userInfo.map((info, index) => `
                  <tr>
                    <td align="left" style="font-size:0px;padding:0 40px;word-break:break-word;">
                      <div
                        style="font-family:Noto Sans TC, sans-serif;font-size:13px;font-weight:400;line-height:140%;text-align:left;color:#536166;">
                        ${info || ''}</div>
                    </td>
                  </tr>
                  `).join('') : (userInfo ? `
                  <tr>
                    <td align="left" style="font-size:0px;padding:0 40px;word-break:break-word;">
                      <div
                        style="font-family:Noto Sans TC, sans-serif;font-size:13px;font-weight:400;line-height:140%;text-align:left;color:#536166;">
                        ${userInfo}</div>
                    </td>
                  </tr>
                  ` : '')}

                  <tr>
                    <td align="left" style="font-size:0px;padding:20px 40px 0 40px;word-break:break-word;">
                      <div style="font-family:Noto Sans TC, sans-serif;font-size:14px;font-weight:700;line-height:140%;text-align:left;color:#536166;">
                        <img width="18px" height="18px" src="https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/message-icon.png" alt="contact information" style="display:inline-block;padding:0;">
                        <span style="display:inline-block;padding:0;vertical-align:top;">試試Discord即時與夥伴交流</span>
                      </div>
                    </td>
                  </tr>
                  
                  <tr>
                    <td align="left" style="font-size:0px;padding:0 40px;word-break:break-word;">
                      <div style="font-family:Noto Sans TC, sans-serif;font-size:13px;font-weight:400;line-height:140%;text-align:left;color:#536166;">
                        <a href="https://daodaoedu.notion.site/Discord-bc406c730c814ce78c3ef446a2d326ec" target="_blank">查看Discord使用方式簡介</a>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td align="center"
                      style="font-size:0px;padding:10px 25px;padding-top:20px;padding-bottom:20px;word-break:break-word;">

                      <div
                        style="font-family:Noto Sans TC, sans-serif;font-size:12px;line-height:1;text-align:center;color:#DBDBDB;background-color:#536166;padding:20px;">
                        Tomorrow will be fine. 島島阿學 © ${new Date().getFullYear()}.
                      </div>

                    </td>
                  </tr>

                </table>

              </div>

            </td>
          </tr>
        </tbody>
      </table>

    </div>

  </div>

</body>

</html>`;

  return { subject, html };
};