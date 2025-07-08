/**
 * 郵件模板服務
 * 根據原本的 JavaScript 邏輯實現 TypeScript 版本
 */

import { emailConfig } from '../../config/email.config';

export interface EmailTemplate {
  subject: string;
  html: string;
}

export interface WelcomeEmailData {
  name: string;
}

export interface VerificationEmailData {
  name?: string;
  verifyLink: string;
}

export interface ContactEmailData {
  name: string;
  message: string;
  userInfo?: string | string[];
  activityTitle?: string;
  url?: string;
  userId?: string;
  roleList?: string[];
  photoUrl?: string;
}

export interface MarathonEmailData {
  name: string;
  marathonTitle: string;
  marathonDate?: string;
  marathonDescription?: string;
}

export interface PasswordResetEmailData {
  name?: string;
  resetLink: string;
}

/**
 * 郵件模板服務類
 */
export class EmailTemplateService {
  /**
   * 生成歡迎郵件模板
   * 基於 sendWelcomeEmail.js 的邏輯
   */
  generateWelcomeEmail(data: WelcomeEmailData): EmailTemplate {
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
                          <a href="${emailConfig.urls.frontend}" style="display: inline-block; background-color: #71AAEC; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 20px;">探索網站</a>
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
  }

  /**
   * 生成驗證郵件模板
   * 基於 sendVerifiedEmail.js 的邏輯
   */
  generateVerificationEmail(data: VerificationEmailData): EmailTemplate {
    const { verifyLink } = data;
    const subject = '【島島阿學】點開 驗證email';
    
    const html = `
<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
  <title>驗證信件</title><!--[if !mso]><!-- -->
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
                        信箱驗證！</div>

                    </td>
                  </tr>

                  <tr>
                    <td align="left"
                      style="font-size:0px;padding:10px 25px;padding-left:40px;padding-right:40px;word-break:break-word;">

                      <div
                        style="font-family:Noto Sans TC, sans-serif;font-size:14px;line-height:140%;text-align:left;color:#536166;">
                        歡迎加入 島島阿學！<br>
                        您好，<br>
                        感謝您註冊 島島阿學。<br>
                        請點擊以下按鈕以驗證您的電子郵件地址：<br>
                        <br>
                        <div style="text-align: center; margin: 20px 0;">
                          <a href="${verifyLink}" style="display: inline-block; background-color: #16B9B3; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 20px; margin: 10px 0;">驗證EMAIL</a>
                        </div>
                        <br>
                        謝謝！
                      </div>

                    </td>
                  </tr>

                  <tr>
                    <td align="left"
                      style="font-size:0px;padding:10px 25px;padding-left:40px;padding-right:40px;word-break:break-word;">

                      <div
                        style="font-family:Noto Sans TC, sans-serif;font-size:14px;line-height:140%;text-align:left;color:#536166;">
                        PS：如果您無法點擊此按鈕，歡迎到 Discord 裡的 <strong>#島島網站回饋</strong> 頻道讓我們知道唷！
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
  }

  /**
   * 生成聯絡郵件模板
   */
  generateContactEmail(data: ContactEmailData): EmailTemplate {
    const { name, message, userInfo, activityTitle } = data;
    const userInfoText = Array.isArray(userInfo) ? userInfo.join(', ') : userInfo || '';
    const activityText = activityTitle ? `關於「${activityTitle}」活動` : '';
    
    const subject = `【島島阿學】有夥伴想聯繫你${activityText}`;
    
    const html = `
<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>有夥伴想聯繫你</title>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style type="text/css">
    body { 
      margin: 0; 
      padding: 0; 
      font-family: 'Noto Sans TC', sans-serif; 
      background-color: #f5f5f5;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background-color: #ffffff;
    }
    .header { 
      background-color: #59B6B2; 
      padding: 20px; 
      text-align: center; 
    }
    .logo { 
      width: 120px; 
      height: auto; 
    }
    .content { 
      padding: 32px 40px; 
    }
    .title { 
      font-size: 22px; 
      font-weight: 700; 
      text-align: center; 
      color: #536166; 
      margin-bottom: 20px;
    }
    .text { 
      font-size: 14px; 
      line-height: 1.6; 
      color: #536166; 
      margin-bottom: 20px; 
    }
    .section { 
      background-color: #f8f9fa; 
      border-radius: 8px; 
      padding: 20px; 
      margin-bottom: 20px;
      border-left: 4px solid #16B9B3;
    }
    .footer { 
      background-color: #536166; 
      padding: 20px; 
      text-align: center; 
      color: #DBDBDB; 
      font-size: 12px; 
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/logo.png" 
           alt="島島阿學" class="logo">
    </div>
    
    <div class="content">
      <h1 class="title">有夥伴想聯繫你</h1>
      
      <p class="text">
        <strong>${name || '有夥伴'}</strong>想要聯繫您${activityText}
      </p>
      
      <div class="section">
        <h3>聯絡資訊</h3>
        <p>${userInfoText}</p>
      </div>
      
      <div class="section">
        <h3>訊息內容</h3>
        <p>${message || '無具體訊息內容'}</p>
      </div>
      
      <p class="text">
        請直接回覆此郵件與對方聯絡。
      </p>
    </div>
    
    <div class="footer">
      Tomorrow will be fine. 島島阿學 © ${new Date().getFullYear()}.
    </div>
  </div>
</body>
</html>`;

    return { subject, html };
  }

  /**
   * 生成馬拉松郵件模板
   */
  generateMarathonEmail(data: MarathonEmailData): EmailTemplate {
    const { name, marathonTitle, marathonDate, marathonDescription } = data;
    
    const subject = `【島島阿學】${marathonTitle}邀請你參加！`;
    
    const html = `
<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>學習馬拉松邀請</title>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style type="text/css">
    body { 
      margin: 0; 
      padding: 0; 
      font-family: 'Noto Sans TC', sans-serif; 
      background-color: #f5f5f5;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background-color: #ffffff;
    }
    .header { 
      background-color: #59B6B2; 
      padding: 20px; 
      text-align: center; 
    }
    .logo { 
      width: 120px; 
      height: auto; 
    }
    .content { 
      padding: 32px 40px; 
    }
    .title { 
      font-size: 22px; 
      font-weight: 700; 
      text-align: center; 
      color: #536166; 
      margin-bottom: 20px;
    }
    .text { 
      font-size: 14px; 
      line-height: 1.6; 
      color: #536166; 
      margin-bottom: 20px; 
    }
    .section { 
      background-color: #def5f5; 
      border-radius: 16px; 
      padding: 20px; 
      margin-bottom: 20px; 
    }
    .button { 
      display: inline-block; 
      background-color: #16B9B3; 
      color: #ffffff; 
      padding: 10px 20px; 
      text-decoration: none; 
      border-radius: 20px; 
    }
    .footer { 
      background-color: #536166; 
      padding: 20px; 
      text-align: center; 
      color: #DBDBDB; 
      font-size: 12px; 
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/logo.png" 
           alt="島島阿學" class="logo">
    </div>
    
    <div class="content">
      <h1 class="title">學習馬拉松邀請</h1>
      
      <p class="text">
        嗨 ${name}！
      </p>
      
      <div class="section">
        <h3>活動資訊</h3>
        <p><strong>活動名稱：</strong>${marathonTitle}</p>
        ${marathonDate ? `<p><strong>活動時間：</strong>${marathonDate}</p>` : ''}
        ${marathonDescription ? `<p><strong>活動描述：</strong>${marathonDescription}</p>` : ''}
      </div>
      
      <div class="section" style="background-color: #e8f4f8;">
        <h3>參與方式</h3>
        <p>
          1. 加入我們的 Discord 社群<br>
          2. 在指定頻道分享你的學習進度<br>
          3. 與其他島友互相鼓勵學習
        </p>
        <div style="text-align: center; margin-top: 15px;">
          <a href="https://discord.gg/2NbQ7cu6jH" class="button">立即參與</a>
        </div>
      </div>
      
      <p class="text">
        期待在學習馬拉松中與你相遇！一起在島島阿學的大家庭中成長學習吧！
      </p>
    </div>
    
    <div class="footer">
      Tomorrow will be fine. 島島阿學 © ${new Date().getFullYear()}.
    </div>
  </div>
</body>
</html>`;

    return { subject, html };
  }

  /**
   * 生成密碼重設郵件模板
   */
  generatePasswordResetEmail(data: PasswordResetEmailData): EmailTemplate {
    const { resetLink, name } = data;
    const subject = '【島島阿學】重設密碼';
    
    const html = `
<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>重設密碼</title>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style type="text/css">
    body { 
      margin: 0; 
      padding: 0; 
      font-family: 'Noto Sans TC', sans-serif; 
      background-color: #f5f5f5;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background-color: #ffffff;
    }
    .header { 
      background-color: #59B6B2; 
      padding: 20px; 
      text-align: center; 
    }
    .logo { 
      width: 120px; 
      height: auto; 
    }
    .content { 
      padding: 32px 40px; 
    }
    .title { 
      font-size: 22px; 
      font-weight: 700; 
      text-align: center; 
      color: #536166; 
      margin-bottom: 20px;
    }
    .text { 
      font-size: 14px; 
      line-height: 1.6; 
      color: #536166; 
      margin-bottom: 20px; 
    }
    .button { 
      display: inline-block; 
      background-color: #16B9B3; 
      color: #ffffff; 
      padding: 10px 20px; 
      text-decoration: none; 
      border-radius: 20px; 
      margin: 10px 0;
    }
    .footer { 
      background-color: #536166; 
      padding: 20px; 
      text-align: center; 
      color: #DBDBDB; 
      font-size: 12px; 
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/logo.png" 
           alt="島島阿學" class="logo">
    </div>
    
    <div class="content">
      <h1 class="title">重設密碼</h1>
      
      <p class="text">
        ${name ? `嗨 ${name}！` : '您好！'}
      </p>
      
      <p class="text">
        您要求重設您的島島阿學帳戶密碼。請點擊下方按鈕進行密碼重設：
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" class="button">重設密碼</a>
      </div>
      
      <p class="text">
        如果您沒有要求重設密碼，請忽略此郵件。此連結將在 1 小時後失效。
      </p>
      
      <p class="text">
        如果您無法點擊按鈕，請複製以下連結到瀏覽器中：<br>
        <a href="${resetLink}" style="color: #16B9B3; word-break: break-all;">${resetLink}</a>
      </p>
    </div>
    
    <div class="footer">
      Tomorrow will be fine. 島島阿學 © ${new Date().getFullYear()}.
    </div>
  </div>
</body>
</html>`;

    return { subject, html };
  }

  /**
   * 生成自定義郵件模板
   */
  generateCustomEmail(
    subject: string,
    content: string,
    data: Record<string, unknown>
  ): EmailTemplate {
    const html = `
<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${subject}</title>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style type="text/css">
    body { 
      margin: 0; 
      padding: 0; 
      font-family: 'Noto Sans TC', sans-serif; 
      background-color: #f5f5f5;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background-color: #ffffff;
    }
    .header { 
      background-color: #59B6B2; 
      padding: 20px; 
      text-align: center; 
    }
    .logo { 
      width: 120px; 
      height: auto; 
    }
    .content { 
      padding: 32px 40px; 
    }
    .title { 
      font-size: 22px; 
      font-weight: 700; 
      text-align: center; 
      color: #536166; 
      margin-bottom: 20px;
    }
    .text { 
      font-size: 14px; 
      line-height: 1.6; 
      color: #536166; 
      margin-bottom: 20px; 
    }
    .footer { 
      background-color: #536166; 
      padding: 20px; 
      text-align: center; 
      color: #DBDBDB; 
      font-size: 12px; 
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/logo.png" 
           alt="島島阿學" class="logo">
    </div>
    
    <div class="content">
      <h1 class="title">${subject}</h1>
      
      <div class="text">
        ${content}
      </div>
    </div>
    
    <div class="footer">
      Tomorrow will be fine. 島島阿學 © ${new Date().getFullYear()}.
    </div>
  </div>
</body>
</html>`;

    return { subject, html };
  }
}

// 創建並導出模板服務實例
export const emailTemplateService = new EmailTemplateService();
export default emailTemplateService;