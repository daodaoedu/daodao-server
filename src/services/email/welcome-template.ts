import { getEmailConfig } from '../../config/email.config';
import type { EmailTemplate, WelcomeEmailData } from './types';

export const generateWelcomeEmail = (data: WelcomeEmailData): EmailTemplate => {
  const { name } = data;
  const subject = '【島島阿學】歡迎成為島友！';
  const title = '歡迎成為島友！';
  
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

    <!--[if mso | IE]>
      <table
         align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600"
      >
        <tr>
          <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
      <![endif]-->


    <div style="background:#ffffff;background-color:#ffffff;Margin:0px auto;max-width:600px;">

      <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
        style="background:#ffffff;background-color:#ffffff;width:100%;">
        <tbody>
          <tr>
            <td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;vertical-align:top;">
              <!--[if mso | IE]>
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                
        <tr>
      
            <td
               class="" style="vertical-align:top;width:600px;"
            >
          <![endif]-->

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
                      style="font-size:0px;padding:10px 25px;padding-top:32px;padding-bottom:0px;word-break:break-word;">

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
                        嗨，親愛的島友 ${name}，感謝你註冊島島阿學！<br><br>在島島阿學裡，每個人都是一座獨一無二的「島」，透過互相、互助學習，成為一片獨立又連結的群島。<br>讓我們一起「沓沓仔學Ta̍uh-ta̍uh-á
                        o̍h」慢慢學不用急，用自己的步調與方式共學！
                      </div>

                    </td>
                  </tr>

                  <tr>
                    <td align="left"
                      style="font-size:0px;padding:10px 25px;padding-left:40px;padding-right:40px;word-break:break-word;">

                      <div
                        style="font-family:Noto Sans TC, sans-serif;font-size:14px;line-height:140%;text-align:left;color:#536166;">
                        <hr style="border: none; border-top: 1px solid #f3f3f3; margin: 20px 0;">
                        除了註冊官網，你還可以透過以下方式共學：
                      </div>

                    </td>
                  </tr>

                  <tr>
                    <td align="left"
                      style="font-size:0px;padding:10px 25px;padding-left:40px;padding-right:40px;word-break:break-word;">

                      <div
                        style="font-family:Noto Sans TC, sans-serif;font-size:14px;line-height:140%;text-align:left;color:#536166;background-color: #def5f5; border-radius: 16px; padding: 20px; margin-bottom: 20px;">
                        <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">加入 Discord 社群，即時交流並獲得資源</h3>
                        <p>歡迎參與每月一次的 Onboarding 活動，更快融入社群。活動將在 Discord 舉辦唷！</p>
                        <div style="text-align: right;">
                          <a href="https://discord.gg/2NbQ7cu6jH" style="display: inline-block; background-color: #16B9B3; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 20px;">加入社群</a>
                        </div>
                      </div>

                    </td>
                  </tr>

                  <tr>
                    <td align="left"
                      style="font-size:0px;padding:10px 25px;padding-left:40px;padding-right:40px;word-break:break-word;">

                      <div
                        style="font-family:Noto Sans TC, sans-serif;font-size:14px;line-height:140%;text-align:left;color:#536166;background-color: #deedf5; border-radius: 16px; padding: 20px; margin-bottom: 20px;">
                        <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">探索島島網站，認識學習夥伴！</h3>
                        <p>
                          <strong>找資源</strong>：各領域達人推薦的上千種資源都在這<br>
                          <strong>找夥伴</strong>：找到一起交流的學習夥伴<br>
                          <strong>找揪團</strong>：發起或參與有趣的活動或學習小組
                        </p>
                        <div style="text-align: right;">
                          <a href="${getEmailConfig().urls.frontend}" style="display: inline-block; background-color: #71AAEC; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 20px;">探索網站</a>
                        </div>
                      </div>

                    </td>
                  </tr>

                  <tr>
                    <td align="left"
                      style="font-size:0px;padding:10px 25px;padding-left:40px;padding-right:40px;word-break:break-word;">

                      <div
                        style="font-family:Noto Sans TC, sans-serif;font-size:14px;line-height:140%;text-align:left;color:#536166;background-color: #def5e7; border-radius: 16px; padding: 20px; margin-bottom: 20px;">
                        <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">訂閱電子報，學習新知不漏接！</h3>
                        <p>帶給你精選學習資源與教育新聞等一手資訊</p>
                        <div style="text-align: right;">
                          <a href="https://docs.google.com/forms/d/e/1FAIpQLSdvdjwrzpwdAEhAL2AouPVsv41cbCJSUoHXiJdLZyL8UvM6xg/viewform" style="display: inline-block; background-color: #52CA9E; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 20px;">立即訂閱</a>
                        </div>
                      </div>

                    </td>
                  </tr>

                  <tr>
                    <td align="left"
                      style="font-size:0px;padding:10px 25px;padding-left:40px;padding-right:40px;word-break:break-word;">

                      <div
                        style="font-family:Noto Sans TC, sans-serif;font-size:14px;line-height:140%;text-align:left;color:#536166;">
                        PS：如你在網站功能使用上有任何問題，歡迎到 Discord 裡的 <strong>#島島網站回饋</strong> 頻道讓我們知道唷！
                      </div>

                    </td>
                  </tr>

                  <tr>
                    <td align="center"
                      style="font-size:0px;padding:10px 25px;padding-top:0px;padding-bottom:20px;word-break:break-word;">

                      <div
                        style="font-family:Noto Sans TC, sans-serif;font-size:12px;line-height:1;text-align:center;color:#DBDBDB;background-color:#536166;padding:20px;">
                        Tomorrow will be fine. 島島阿學 © ${new Date().getFullYear()}.
                      </div>

                    </td>
                  </tr>

                </table>

              </div>

              <!--[if mso | IE]>
            </td>
        
        </tr>
        
                  </table>
                <![endif]-->
            </td>
          </tr>
        </tbody>
      </table>

    </div>


    <!--[if mso | IE]>
          </td>
        </tr>
      </table>
      <![endif]-->


  </div>

</body>

</html>`;

  return { subject, html };
};