export const getEmailBaseHTML = () => `
<!doctype html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
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
`;

export const getEmailFooterHTML = () => `
</body>
</html>
`;

export const getSimpleEmailTemplate = (title: string, content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans TC', Arial, sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 20px;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      background-color: #59B6B2;
      padding: 30px 40px;
      text-align: center;
    }
    .logo {
      height: 60px;
      width: auto;
    }
    .content {
      padding: 40px;
    }
    .title {
      color: #333333;
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 20px 0;
      text-align: center;
    }
    .text {
      color: #666666;
      font-size: 16px;
      margin: 16px 0;
    }
    .button {
      display: inline-block;
      background-color: #59B6B2;
      color: #ffffff;
      padding: 12px 30px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 30px 40px;
      text-align: center;
      border-top: 1px solid #e9ecef;
    }
    .footer p {
      color: #6c757d;
      font-size: 14px;
      margin: 5px 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 10px;
      text-decoration: none;
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
      ${content}
    </div>
    <div class="footer">
      <div class="social-links">
        <a href="https://www.facebook.com/daodaoedu/">
          <img src="https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/facebook.png" alt="Facebook" style="width: 30px; height: 30px;">
        </a>
        <a href="https://www.instagram.com/daodao.edu/">
          <img src="https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/instagram.png" alt="Instagram" style="width: 30px; height: 30px;">
        </a>
        <a href="https://lin.ee/4abJOBW">
          <img src="https://raw.githubusercontent.com/daodaoedu/daodao-f2e/prod/public/email/line.png" alt="LINE" style="width: 30px; height: 30px;">
        </a>
      </div>
      <p>此信件為系統自動發送，請勿直接回覆</p>
      <p>若有任何問題，請聯繫我們：daodaoedu@gmail.com</p>
      <p>© 2024 島島阿學. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;