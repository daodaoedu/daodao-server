const nodemailer = require('nodemailer');
const { EMAIL_ADDRESS, EMAIL_PASSWORD,FRONTEND_URL } = process.env;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_ADDRESS,
    pass: EMAIL_PASSWORD
  }
});

const sendVerifiedEmail = (to, name ,verifyLink) => {

  const { subject, title } = { "subject": "【島島阿學】點開 驗證email", "title": "歡迎成為島友！" };
  let htmlContent = `
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
                                                      <h1 style="text-align: center; font-size: 22px; font-weight: 700; line-height: 31px;">信箱驗證！</h1>
                                                    </td>
                                                  </tr>
                                                  <tr>
                                                    <td style="padding: 0;">
                                                      <p style="font-size: 14px; line-height: 140%; color: #536166;">
                                                      歡迎加入 島島阿學！<br>
                                                      您好，<br>
                                                      感謝您註冊 島島阿學。<br>
                                                      請點擊以下按鈕以驗證您的電子郵件地址：<br>
                                                        <a href="${verifyLink}" style="display: inline-block; background-color: #16B9B3; color: #ffffff; margin:10px 0px;padding: 10px 20px; text-decoration: none; border-radius: 20px; font-family: 'Noto Sans TC', sans-serif;">
                                                          驗證EMAIL
                                                        </a>
                                                      <br>

                                                      謝謝！

                                                      </p>
                                                    </td>
                                                  </tr>
                                                  <tr>
                                                    <td style="padding: 20px 0 0;">
                                                      <p style="font-size: 14px; line-height: 140%; color: #536166;">
                                                        PS：如果您無法點擊此按鈕，歡迎到 Discord 裡的 <strong>#島島網站回饋</strong> 頻道讓我們知道唷！
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
                                                  <h2 style="font-size: 22px; font-weight: 700; text-align: center; color: #536166; font-family: 'Noto Sans TC', sans-serif;">信箱驗證！</h2>
                                                  
                                                  <p style="font-size: 14px; color: #536166; line-height: 140%; font-family: 'Noto Sans TC', sans-serif;">
                                                      歡迎加入 島島阿學！<br>
                                                      您好，<br>
                                                      感謝您註冊 島島阿學。<br>
                                                      請點擊以下按鈕以驗證您的電子郵件地址：<br>
                                                        <a href="${verifyLink}" style="display: inline-block; background-color: #16B9B3; color: #ffffff; margin: 10px 0px; padding: 10px 20px; text-decoration: none; border-radius: 20px; font-family: 'Noto Sans TC', sans-serif;">
                                                          驗證EMAIL
                                                        </a>
                                                        <br>
                                                      
                                                      謝謝！
                                                  </p>
                                                  <p style="font-size: 14px; color: #536166; line-height: 140%; font-family: 'Noto Sans TC', sans-serif;">
                                                    PS：如果您無法點擊此按鈕，歡迎到 Discord 裡的 <strong>#島島網站回饋</strong> 頻道讓我們知道唷！
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

module.exports = sendVerifiedEmail;
