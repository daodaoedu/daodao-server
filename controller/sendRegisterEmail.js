const nodemailer = require('nodemailer');
const { EMAIL_ADDRESS, EMAIL_PASSWORD } = process.env;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_ADDRESS,
    pass: EMAIL_PASSWORD
  }
});

const sendRegisterEmail = (to, name) => {
  const { subject, title } = { "subject": "【島島阿學】歡迎成為島友！", "title": "歡迎成為島友！" };
  const htmlContent = `
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
  </style><!--[if !mso]><!-->
  <style type="text/css">
    @media only screen and (max-width:480px) {
      @-ms-viewport {
        width: 320px;
      }

      @viewport {
        width: 320px;
      }
    }
  </style><!--<![endif]--><!--[if mso]>
        <xml>
        <o:OfficeDocumentSettings>
          <o:AllowPNG/>
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
        </xml>
        <![endif]--><!--[if lte mso 11]>
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

      .mj-column-px-440 {
        width: 440px !important;
        max-width: 440px;
      }

      .mj-column-px-480 {
        width: 480px !important;
        max-width: 480px;
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
  <style type="text/css">
    image {
      padding: 0;
      line-height: 0;
      display: inline-block;
    }

    @media all and (max-width: 480px) {
      .mobile-wrapper {
        display: block !important;
      }

      .wrapper {
        display: none;
      }
    }
  </style><!-- Email Title --><!-- Email Preview -->
</head>

<body style="background-color:#59B6B2;">
  <div
    style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
  </div>
  <div style="background-color:#59B6B2;">
    <!-- DeskTop Device Start --><!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" class="wrapper-outlook" style="width:800px;" width="800" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><v:rect style="width:800px;" xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false"><v:fill origin="0.5, 0" position="0.5, 0" src="https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/background.jpg" color="#59B6B2" type="tile" /><v:textbox style="mso-fit-shape-to-text:true" inset="0,0,0,0"><![endif]-->
    <div class="wrapper"
      style="background:#59B6B2 url(https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/background.jpg) top center / cover repeat;Margin:0px auto;max-width:800px;">
      <div style="line-height:0;font-size:0;">
        <table align="center"
          background="https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/background.jpg"
          border="0" cellpadding="0" cellspacing="0" role="presentation"
          style="background:#59B6B2 url(https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/background.jpg) top center / cover repeat;width:100%;">
          <tbody>
            <tr>
              <td style="direction:ltr;font-size:0px;padding:60px 0 0;text-align:center;vertical-align:top;">
                <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><![endif]--><!-- header logo --><!--[if mso | IE]><tr><td class="" width="800px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:800px;" width="800" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
                <div style="Margin:0px auto;max-width:800px;">
                  <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
                    style="width:100%;">
                    <tbody>
                      <tr>
                        <td style="direction:ltr;font-size:0px;padding:0;text-align:center;vertical-align:top;">
                          <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:800px;" ><![endif]-->
                          <div class="mj-column-per-100 outlook-group-fix"
                            style="font-size:13px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                              <tbody>
                                <tr>
                                  <td style="vertical-align:top;padding:0;">
                                    <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                      <tr>
                                        <td align="center" style="font-size:0px;padding:0;word-break:break-word;">
                                          <table border="0" cellpadding="0" cellspacing="0" role="presentation"
                                            style="border-collapse:collapse;border-spacing:0px;">
                                            <tbody>
                                              <tr>
                                                <td style="width:120px;"><img alt="logo" height="auto"
                                                    src="https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/logo.png"
                                                    style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;"
                                                    width="120"></td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div><!--[if mso | IE]></td></tr></table><![endif]-->
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <!--[if mso | IE]></td></tr></table></td></tr><![endif]--><!-- body content --><!--[if mso | IE]><tr><td class="bodyContent-outlook" width="800px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="bodyContent-outlook" style="width:800px;" width="800" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
                <div class="bodyContent" style="Margin:0px auto;max-width:800px;">
                  <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
                    style="width:100%;">
                    <tbody>
                      <tr>
                        <td
                          style="direction:ltr;font-size:0px;padding:48px 24px 162px;text-align:center;vertical-align:middle;">
                          <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:440px;" ><![endif]-->
                          <div class="mj-column-px-440 outlook-group-fix"
                            style="font-size:13px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                              <tbody>
                                <tr>
                                  <td
                                    style="background-color:#FFFFFF;border-radius:16px;vertical-align:top;padding:32px 40px;">
                                    <table cellpadding="0" cellspacing="0" style="width: 100%; padding-top: 0;">
                                      <tr>
                                        <td style="padding: 0;">
                                          <table cellpadding="0" cellspacing="0" style="width: 500px; margin: 0 auto;">
                                            <tr>
                                              <td style="padding: 0;">
                                                <img width="274.7px" src="./public/frame-1@2x.png" alt="" style="display: block; outline: none; border: none; text-decoration: none; float: right; padding: 0;">
                                              </td>
                                            </tr>
                                            <tr>
                                              <td style="padding: 0;">
                                                <img width="280px" src="./public/frame-2@2x.png" alt="" style="display: block; outline: none; border: none; text-decoration: none; float: left; padding: 0;">
                                              </td>
                                            </tr>
                                            <tr>
                                              <td class="content-section" style="background-color: #fff; border-radius: 16px; padding: 32px 40px;">
                                                <table cellpadding="0" cellspacing="0" style="width: 100%;">
                                                  <tr>
                                                    <td style="padding: 0;">
                                                      <h1 style="text-align: center; font-size: 22px; font-weight: 700; line-height: 31px;">歡迎成為島友！</h1>
                                                    </td>
                                                  </tr>
                                                  <tr>
                                                    <td style="padding: 0;">
                                                      <p style="font-size: 14px; line-height: 140%; color: #536166;">
                                                        嗨，親愛的島友 ${name}，感謝你註冊島島阿學！<br><br>
                                                        在島島阿學裡，每個人都是一座獨一無二的「島」，透過互相、互助學習，成為一片獨立又連結的群島。<br>
                                                        讓我們一起「沓沓仔學Ta̍uh-ta̍uh-á o̍h」慢慢學不用急，用自己的步調與方式共學！
                                                      </p>
                                                    </td>
                                                  </tr>
                                                  <tr>
                                                    <td style="padding: 0;">
                                                      <hr style="border: none; border-top: 1px solid #f3f3f3;">
                                                    </td>
                                                  </tr>
                                                  <tr>
                                                    <td style="padding: 0;">
                                                      <p style="font-size: 14px; line-height: 20px; color: #536166;">
                                                        除了註冊官網，你還可以透過以下方式共學：
                                                      </p>
                                                    </td>
                                                  </tr>
                                                  <tr>
                                                      <table cellpadding="0" cellspacing="0" style="width: 100%; background-color: #def5f5; border-radius: 16px; margin-bottom: 20px;">
                                                        <tr>
                                                          <td style="padding: 20px;">
                                                            <h3 style="font-size: 16px; font-weight: bold; font-family: 'Noto Sans TC', sans-serif;">加入 Discord 社群，即時交流並獲得資源</h3>
                                                            <p style="font-size: 14px; line-height: 140%; font-family: 'Noto Sans TC', sans-serif;">
                                                              歡迎參與每月一次的 Onboarding 活動，更快融入社群。活動將在 Discord 舉辦唷！
                                                            </p>
                                                            <table cellpadding="0" cellspacing="0" style="width: 100%;">
                                                              <tr>
                                                                <td align="right">
                                                                  <a href="https://discord.gg/2NbQ7cu6jH" style="display: inline-block; background-color: #16B9B3; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 20px; font-family: 'Noto Sans TC', sans-serif;">
                                                                    加入社群 <img src="https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/arrow-icon.png" style="vertical-align: middle; margin-left: 5px;">
                                                                  </a>
                                                                </td>
                                                              </tr>
                                                            </table>
                                                          </td>
                                                        </tr>
                                                      </table>
                                                  </tr>
                                                  <tr>
                                                      <table cellpadding="0" cellspacing="0" style="width: 100%; background-color: #deedf5; border-radius: 16px; margin-bottom: 20px;">
                                                        <tr>
                                                          <td style="padding: 20px;">
                                                            <h3 style="font-size: 16px; font-weight: bold; font-family: 'Noto Sans TC', sans-serif;">探索島島網站，認識學習夥伴！</h3>
                                                            <p style="font-size: 14px; line-height: 140%; font-family: 'Noto Sans TC', sans-serif;">
                                                              <strong>找資源</strong>：各領域達人推薦的上千種資源都在這<br>
                                                              <strong>找夥伴</strong>：找到一起交流的學習夥伴<br>
                                                              <strong>找揪團</strong>：發起或參與有趣的活動或學習小組
                                                            </p>
                                                            <table cellpadding="0" cellspacing="0" style="width: 100%;">
                                                              <tr>
                                                                <td align="right">
                                                                  <a href="https://www.daoedu.tw/" style="display: inline-block; background-color: #71AAEC; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 20px; font-family: 'Noto Sans TC', sans-serif;">
                                                                    探索網站 <img src="https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/arrow-icon.png" style="vertical-align: middle; margin-left: 5px;">
                                                                  </a>
                                                                </td>
                                                              </tr>
                                                            </table>
                                                          </td>
                                                        </tr>
                                                      </table>
                                                  </tr>
                                                  <tr>
                                                      <table cellpadding="0" cellspacing="0" style="width: 100%; background-color: #def5e7; border-radius: 16px; margin-bottom: 20px;">
                                                        <tr>
                                                          <td style="padding: 20px;">
                                                            <h3 style="font-size: 16px; font-weight: bold; font-family: 'Noto Sans TC', sans-serif;">訂閱電子報，學習新知不漏接！</h3>
                                                            <p style="font-size: 14px; line-height: 140%; font-family: 'Noto Sans TC', sans-serif;">
                                                              帶給你精選學習資源與教育新聞等一手資訊
                                                            </p>
                                                            <table cellpadding="0" cellspacing="0" style="width: 100%;">
                                                              <tr>
                                                                <td align="right">
                                                                  <a href="https://docs.google.com/forms/d/e/1FAIpQLSdvdjwrzpwdAEhAL2AouPVsv41cbCJSUoHXiJdLZyL8UvM6xg/viewform" style="display: inline-block; background-color: #52CA9E; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 20px; font-family: 'Noto Sans TC', sans-serif;">
                                                                    立即訂閱 <img src="https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/arrow-icon.png" style="vertical-align: middle; margin-left: 5px;">
                                                                  </a>
                                                                </td>
                                                              </tr>
                                                            </table>
                                                          </td>
                                                        </tr>
                                                      </table>
                                                  </tr>
                                                  <tr>
                                                    <td style="padding: 20px 0 0;">
                                                      <p style="font-size: 14px; line-height: 140%; color: #536166;">
                                                        PS：如你在網站功能使用上有任何問題，歡迎到 Discord 裡的 <strong>#島島網站回饋</strong> 頻道讓我們知道唷！
                                                      </p>
                                                    </td>
                                                  </tr>
                                                </table>
                                              </td>
                                            </tr>
                                          </table>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div><!--[if mso | IE]></td></tr></table><![endif]-->
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div><!--[if mso | IE]></td></tr></table></td></tr><![endif]-->
                <!-- footer --><!-- hover icon color --><!--[if mso | IE]><tr><td class="" width="800px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:800px;" width="800" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
                <div style="background:#536166;background-color:#536166;Margin:0px auto;max-width:800px;">
                  <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
                    style="background:#536166;background-color:#536166;width:100%;">
                    <tbody>
                      <tr>
                        <td style="direction:ltr;font-size:0px;padding:35px;text-align:center;vertical-align:top;">
                          <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:730px;" ><![endif]-->
                          <div class="mj-column-per-100 outlook-group-fix"
                            style="font-size:13px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation"
                              style="vertical-align:top;" width="100%">
                              <tr>
                                <td align="center" style="font-size:0px;padding:0 0 20px;word-break:break-word;">
                                  <!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" ><tr><td><![endif]-->
                                  <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
                                    style="float:none;display:inline-table;">
                                    <tr>
                                      <td style="padding:4px;">
                                        <table border="0" cellpadding="0" cellspacing="0" role="presentation"
                                          style="border-radius:3px;width:30px;">
                                          <tr>
                                            <td style="font-size:0;height:30px;vertical-align:middle;width:30px;"><a
                                                href="https://www.daoedu.tw/" target="_blank"><img height="30"
                                                  src="https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/home-icon.png"
                                                  style="border-radius:3px;" width="30"></a></td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </table><!--[if mso | IE]></td><td><![endif]-->
                                  <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
                                    style="float:none;display:inline-table;">
                                    <tr>
                                      <td style="padding:4px;">
                                        <table border="0" cellpadding="0" cellspacing="0" role="presentation"
                                          style="border-radius:3px;width:30px;">
                                          <tr>
                                            <td style="font-size:0;height:30px;vertical-align:middle;width:30px;"><a
                                                href="https://discord.gg/zWc7t9rrXB" target="_blank"><img height="30"
                                                  src="https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/discord-icon.png"
                                                  style="border-radius:3px;" width="30"></a></td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </table><!--[if mso | IE]></td><td><![endif]-->
                                  <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
                                    style="float:none;display:inline-table;">
                                    <tr>
                                      <td style="padding:4px;">
                                        <table border="0" cellpadding="0" cellspacing="0" role="presentation"
                                          style="border-radius:3px;width:30px;">
                                          <tr>
                                            <td style="font-size:0;height:30px;vertical-align:middle;width:30px;"><a
                                                href="https://www.instagram.com/daodao_edu/" target="_blank"><img
                                                  height="30"
                                                  src="https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/instagram-icon.png"
                                                  style="border-radius:3px;" width="30"></a></td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </table><!--[if mso | IE]></td><td><![endif]-->
                                  <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
                                    style="float:none;display:inline-table;">
                                    <tr>
                                      <td style="padding:4px;">
                                        <table border="0" cellpadding="0" cellspacing="0" role="presentation"
                                          style="border-radius:3px;width:30px;">
                                          <tr>
                                            <td style="font-size:0;height:30px;vertical-align:middle;width:30px;"><a
                                                href="https://www.facebook.com/daodao.edu" target="_blank"><img
                                                  height="30"
                                                  src="https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/fecebook-icon.png"
                                                  style="border-radius:3px;" width="30"></a></td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </table><!--[if mso | IE]></td></tr></table><![endif]-->
                                </td>
                              </tr>
                              <tr>
                                <td align="center" style="font-size:0px;padding:0;word-break:break-word;">
                                  <div
                                    style="font-family:Noto Sans TC;font-size:12px;font-weight:400;line-height:140%;text-align:center;color:#DBDBDB;">
                                    Tomorrow will be fine. 島島阿學 © 2024.</div>
                                </td>
                              </tr>
                            </table>
                          </div><!--[if mso | IE]></td></tr></table><![endif]-->
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div><!--[if mso | IE]></td></tr></table></td></tr></table><![endif]-->
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div><!--[if mso | IE]></v:textbox></v:rect></td></tr></table><![endif]-->
    <!-- DeskTop Device End --><!-- Mobile Device Start --><!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" class="mobile-wrapper-outlook" style="width:800px;" width="800" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><v:rect style="width:800px;" xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false"><v:fill origin="0.5, 0" position="0.5, 0" src="https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/background-mobile.png" type="tile" /><v:textbox style="mso-fit-shape-to-text:true" inset="0,0,0,0"><![endif]-->
    <div class="mobile-wrapper"
      style="display: none; background: url(https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/background-mobile.png) top center / cover repeat; Margin: 0px auto; max-width: 800px;">
      <div style="line-height:0;font-size:0;">
        <table align="center"
          background="https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/background-mobile.png"
          border="0" cellpadding="0" cellspacing="0" role="presentation"
          style="background:url(https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/background-mobile.png) top center / cover repeat;width:100%;">
          <tbody>
            <tr>
              <td style="direction:ltr;font-size:0px;padding:60px 0 0;text-align:center;vertical-align:top;">
                <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><![endif]--><!-- header logo --><!--[if mso | IE]><tr><td class="" width="800px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:800px;" width="800" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
                <div style="Margin:0px auto;max-width:800px;">
                  <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
                    style="width:100%;">
                    <tbody>
                      <tr>
                        <td style="direction:ltr;font-size:0px;padding:0;text-align:center;vertical-align:top;">
                          <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:800px;" ><![endif]-->
                          <div class="mj-column-per-100 outlook-group-fix"
                            style="font-size:13px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                              <tbody>
                                <tr>
                                  <td style="vertical-align:top;padding:0;">
                                    <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                      <tr>
                                        <td align="center" style="font-size:0px;padding:0;word-break:break-word;">
                                          <table border="0" cellpadding="0" cellspacing="0" role="presentation"
                                            style="border-collapse:collapse;border-spacing:0px;">
                                            <tbody>
                                              <tr>
                                                <td style="width:120px;"><img alt="logo" height="auto"
                                                    src="https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/logo.png"
                                                    style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;"
                                                    width="120"></td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        </td>
                                      </tr>
                                    </table>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div><!--[if mso | IE]></td></tr></table><![endif]-->
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <!--[if mso | IE]></td></tr></table></td></tr><![endif]--><!-- body content --><!--[if mso | IE]><tr><td class="bodyContent-outlook" width="800px" ><![endif]-->
                <table align="center" class="bodyContent" border="0" cellpadding="0" cellspacing="0" role="presentation"
                  style="width:100%;">
                  <tbody>
                    <tr>
                      <td>
                        <!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" class="bodyContent-outlook" style="width:800px;" width="800" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
                        <div style="Margin:0px auto;max-width:800px;">
                          <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
                            style="width:100%;">
                            <tbody>
                              <tr>
                                <td
                                  style="direction:ltr;font-size:0px;padding:31px 24px 100px;text-align:center;vertical-align:middle;">
                                  <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:480px;" ><![endif]-->
                                  <div class="mj-column-px-480 outlook-group-fix"
                                    style="font-size:13px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                                    <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                      <tbody>
                                        <tr>
                                          <td
                                            style="background-color:#FFFFFF;border-radius:16px;vertical-align:top;padding:24px 20px;">
                                            <table cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; padding: 0 24px;">
                                              <tr>
                                                <td style="padding: 20px 0;">
                                                  <h2 style="font-size: 22px; font-weight: 700; text-align: center; color: #536166; font-family: 'Noto Sans TC', sans-serif;">歡迎成為島友！</h2>
                                                  
                                                  <p style="font-size: 14px; color: #536166; line-height: 140%; font-family: 'Noto Sans TC', sans-serif;">
                                                    嗨，親愛的島友 ${name}，感謝你註冊島島阿學！<br><br>
                                                    在島島阿學裡，每個人都是一座獨一無二的「島」，透過互相、互助學習，成為一片獨立又連結的群島。<br>
                                                    讓我們一起「沓沓仔學Ta̍uh-ta̍uh-á o̍h」慢慢學不用急，用自己的步調與方式共學！
                                                  </p>
                                                  
                                                  <hr style="border: none; border-top: 5px solid #f3f3f3; margin: 20px 0;">
                                                  
                                                  <p style="font-size: 14px; color: #536166; line-height: 140%; font-family: 'Noto Sans TC', sans-serif;">
                                                    除了註冊官網，你還可以透過以下方式共學：
                                                  </p>
                                                  
                                                  <table cellpadding="0" cellspacing="0" style="width: 100%; background-color: #def5f5; border-radius: 16px; margin-bottom: 20px;">
                                                    <tr>
                                                      <td style="padding: 20px;">
                                                        <h3 style="font-size: 16px; font-weight: bold; font-family: 'Noto Sans TC', sans-serif;">加入 Discord 社群，即時交流並獲得資源</h3>
                                                        <p style="font-size: 14px; line-height: 140%; font-family: 'Noto Sans TC', sans-serif;">
                                                          歡迎參與每月一次的 Onboarding 活動，更快融入社群。活動將在 Discord 舉辦唷！
                                                        </p>
                                                        <table cellpadding="0" cellspacing="0" style="width: 100%;">
                                                          <tr>
                                                            <td align="right">
                                                              <a href="https://discord.gg/2NbQ7cu6jH" style="display: inline-block; background-color: #16B9B3; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 20px; font-family: 'Noto Sans TC', sans-serif;">
                                                                加入社群 <img src="https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/arrow-icon.png" style="vertical-align: middle; margin-left: 5px;">
                                                              </a>
                                                            </td>
                                                          </tr>
                                                        </table>
                                                      </td>
                                                    </tr>
                                                  </table>
                                                  
                                                  <table cellpadding="0" cellspacing="0" style="width: 100%; background-color: #deedf5; border-radius: 16px; margin-bottom: 20px;">
                                                    <tr>
                                                      <td style="padding: 20px;">
                                                        <h3 style="font-size: 16px; font-weight: bold; font-family: 'Noto Sans TC', sans-serif;">探索島島網站，認識學習夥伴！</h3>
                                                        <p style="font-size: 14px; line-height: 140%; font-family: 'Noto Sans TC', sans-serif;">
                                                          <strong>找資源</strong>：各領域達人推薦的上千種資源都在這<br>
                                                          <strong>找夥伴</strong>：找到一起交流的學習夥伴<br>
                                                          <strong>找揪團</strong>：發起或參與有趣的活動或學習小組
                                                        </p>
                                                        <table cellpadding="0" cellspacing="0" style="width: 100%;">
                                                          <tr>
                                                            <td align="right">
                                                              <a href="https://www.daoedu.tw/" style="display: inline-block; background-color: #71AAEC; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 20px; font-family: 'Noto Sans TC', sans-serif;">
                                                                探索網站 <img src="https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/arrow-icon.png" style="vertical-align: middle; margin-left: 5px;">
                                                              </a>
                                                            </td>
                                                          </tr>
                                                        </table>
                                                      </td>
                                                    </tr>
                                                  </table>
                                                  
                                                  <table cellpadding="0" cellspacing="0" style="width: 100%; background-color: #def5e7; border-radius: 16px; margin-bottom: 20px;">
                                                    <tr>
                                                      <td style="padding: 20px;">
                                                        <h3 style="font-size: 16px; font-weight: bold; font-family: 'Noto Sans TC', sans-serif;">訂閱電子報，學習新知不漏接！</h3>
                                                        <p style="font-size: 14px; line-height: 140%; font-family: 'Noto Sans TC', sans-serif;">
                                                          帶給你精選學習資源與教育新聞等一手資訊
                                                        </p>
                                                        <table cellpadding="0" cellspacing="0" style="width: 100%;">
                                                          <tr>
                                                            <td align="right">
                                                              <a href="https://docs.google.com/forms/d/e/1FAIpQLSdvdjwrzpwdAEhAL2AouPVsv41cbCJSUoHXiJdLZyL8UvM6xg/viewform" style="display: inline-block; background-color: #52CA9E; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 20px; font-family: 'Noto Sans TC', sans-serif;">
                                                                立即訂閱 <img src="https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/arrow-icon.png" style="vertical-align: middle; margin-left: 5px;">
                                                              </a>
                                                            </td>
                                                          </tr>
                                                        </table>
                                                      </td>
                                                    </tr>
                                                  </table>
                                                  
                                                  <p style="font-size: 14px; color: #536166; line-height: 140%; font-family: 'Noto Sans TC', sans-serif;">
                                                    PS：如你在網站功能使用上有任何問題，歡迎到 Discord 裡的 <strong>#島島網站回饋</strong> 頻道讓我們知道唷！
                                                  </p>
                                                </td>
                                              </tr>
                                            </table>          
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div><!--[if mso | IE]></td></tr></table><![endif]-->
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div><!--[if mso | IE]></td></tr></table><![endif]-->
                      </td>
                    </tr>
                  </tbody>
                </table><!--[if mso | IE]></td></tr><![endif]-->
                <!-- footer --><!-- hover icon color --><!--[if mso | IE]><tr><td class="" width="800px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:800px;" width="800" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
                <div style="background:#536166;background-color:#536166;Margin:0px auto;max-width:800px;">
                  <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
                    style="background:#536166;background-color:#536166;width:100%;">
                    <tbody>
                      <tr>
                        <td style="direction:ltr;font-size:0px;padding:35px;text-align:center;vertical-align:top;">
                          <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:730px;" ><![endif]-->
                          <div class="mj-column-per-100 outlook-group-fix"
                            style="font-size:13px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation"
                              style="vertical-align:top;" width="100%">
                              <tr>
                                <td align="center" style="font-size:0px;padding:0 0 20px;word-break:break-word;">
                                  <!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" ><tr><td><![endif]-->
                                  <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
                                    style="float:none;display:inline-table;">
                                    <tr>
                                      <td style="padding:4px;">
                                        <table border="0" cellpadding="0" cellspacing="0" role="presentation"
                                          style="border-radius:3px;width:30px;">
                                          <tr>
                                            <td style="font-size:0;height:30px;vertical-align:middle;width:30px;"><a
                                                href="https://www.daoedu.tw/" target="_blank"><img height="30"
                                                  src="https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/home-icon.png"
                                                  style="border-radius:3px;" width="30"></a></td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </table><!--[if mso | IE]></td><td><![endif]-->
                                  <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
                                    style="float:none;display:inline-table;">
                                    <tr>
                                      <td style="padding:4px;">
                                        <table border="0" cellpadding="0" cellspacing="0" role="presentation"
                                          style="border-radius:3px;width:30px;">
                                          <tr>
                                            <td style="font-size:0;height:30px;vertical-align:middle;width:30px;"><a
                                                href="https://discord.gg/zWc7t9rrXB" target="_blank"><img height="30"
                                                  src="https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/discord-icon.png"
                                                  style="border-radius:3px;" width="30"></a></td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </table><!--[if mso | IE]></td><td><![endif]-->
                                  <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
                                    style="float:none;display:inline-table;">
                                    <tr>
                                      <td style="padding:4px;">
                                        <table border="0" cellpadding="0" cellspacing="0" role="presentation"
                                          style="border-radius:3px;width:30px;">
                                          <tr>
                                            <td style="font-size:0;height:30px;vertical-align:middle;width:30px;"><a
                                                href="https://www.instagram.com/daodao_edu/" target="_blank"><img
                                                  height="30"
                                                  src="https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/instagram-icon.png"
                                                  style="border-radius:3px;" width="30"></a></td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </table><!--[if mso | IE]></td><td><![endif]-->
                                  <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation"
                                    style="float:none;display:inline-table;">
                                    <tr>
                                      <td style="padding:4px;">
                                        <table border="0" cellpadding="0" cellspacing="0" role="presentation"
                                          style="border-radius:3px;width:30px;">
                                          <tr>
                                            <td style="font-size:0;height:30px;vertical-align:middle;width:30px;"><a
                                                href="https://www.facebook.com/daodao.edu" target="_blank"><img
                                                  height="30"
                                                  src="https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/fecebook-icon.png"
                                                  style="border-radius:3px;" width="30"></a></td>
                                          </tr>
                                        </table>
                                      </td>
                                    </tr>
                                  </table><!--[if mso | IE]></td></tr></table><![endif]-->
                                </td>
                              </tr>
                              <tr>
                                <td align="center" style="font-size:0px;padding:0;word-break:break-word;">
                                  <div
                                    style="font-family:Noto Sans TC;font-size:12px;font-weight:400;line-height:140%;text-align:center;color:#DBDBDB;">
                                    Tomorrow will be fine. 島島阿學 © 2024.</div>
                                </td>
                              </tr>
                            </table>
                          </div><!--[if mso | IE]></td></tr></table><![endif]-->
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div><!--[if mso | IE]></td></tr></table></td></tr></table><![endif]-->
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div><!--[if mso | IE]></v:textbox></v:rect></td></tr></table><![endif]--><!-- Mobile Device End -->
  </div>
</body>

</html>
`;
  const mailOptions = {
    from: EMAIL_ADDRESS,
    to,
    subject,
    html: htmlContent
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};

module.exports = sendRegisterEmail;
