import type { EmailTemplate, MarathonEmailData } from './types';

export const generateMarathonEmail = (data: MarathonEmailData): EmailTemplate => {
  const { name, marathonTitle, marathonDate, marathonDescription } = data;
  const subject = '【島島阿學】馬拉松報名成功確認';
  const title = '確認申請！';
  
  const html = `
<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
  <title>馬拉松確認信件</title><!--[if !mso]><!-- -->
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
                        style="font-family:Noto Sans TC, sans-serif;font-size:14px;line-height:140%;text-align:left;color:#536166;">
                        <p style="margin: 10px 0;">Dear ${name},</p>
                        
                        <p style="margin: 10px 0;">感謝申請「島島盃 - 2025 春季學習馬拉松」!</p>
                        
                        <p style="margin: 10px 0;">我們收到你的申請了，計畫名稱是「${marathonTitle}」</p>
                        
                        ${marathonDate ? `<p style="margin: 10px 0;">活動日期：${marathonDate}</p>` : ''}
                        
                        ${marathonDescription ? `<p style="margin: 10px 0;">活動說明：${marathonDescription}</p>` : ''}
                        
                        <p style="margin: 10px 0;">在申請截止日前你都還可以登入修改你的計劃。</p>
                      </div>

                    </td>
                  </tr>

                  <tr>
                    <td align="left"
                      style="font-size:0px;padding:10px 25px;padding-left:40px;padding-right:40px;padding-top:20px;word-break:break-word;">

                      <div
                        style="font-family:Noto Sans TC, sans-serif;font-size:14px;line-height:140%;text-align:left;color:#536166;">
                        <p style="margin: 10px 0;">若有任何疑問歡迎 email 至 contact@daoedu.tw</p>
                        
                        <p style="margin: 10px 0;">Best Regards,</p>
                        
                        <p style="margin: 10px 0;">島島阿學團隊</p>
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