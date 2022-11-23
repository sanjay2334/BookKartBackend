const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Users = require('../Model/User.model');
const Books = require('../Model/Book.model');
const otpgenerator = require('otp-generator');


let mailtransporter = nodemailer.createTransport({
    host: "smtp-mail.outlook.com", // hostname
    secureConnection: true,
    service : "Hotmail",
    port:"587",
    auth :{
        user: "testvalidatorautomation@outlook.com",
        pass: "Sanjay@321"
    },
    tls: {
        ciphers:'SSLv3'
    },
    logger: true,
    debug: true
})

function hashPassword(password){
    return bcrypt.hashSync(password,bcrypt.genSaltSync(10));
}

function verifyPassword(password,hash){
    return bcrypt.compareSync(password,hash);
}

// create new user
async function createUser(req,res){
    try{
        const {name,phone,email,password} = req.body;
        const pass = hashPassword(password);
        const user = new Users({
            name:name,
            phone:phone,
            email:email,
            password:pass
        });
        const usr = await user.save();
        const OTP = otpgenerator.generate(4,{upperCaseAlphabets:false,lowerCaseAlphabets:false,specialChars:false});
        const usrr = await Users.findByIdAndUpdate(usr._id,{Otp:OTP});
        console.log(usrr);
        let details = {
            from: "testvalidatorautomation@outlook.com",
            to: `${email}`,
            subject: "Your Otp",
            html: `
            <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
            <div style="margin:50px auto;width:70%;padding:20px 0">
              <div style="border-bottom:1px solid #eee">
                <p style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Book Kart</p>
              </div>
              <p style="font-size:1.1em">Hi,${name}</p>
              <p> Use the following OTP to complete your Sign Up procedures. OTP is valid for 1 Hour</p>
              <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${OTP}</h2>
              <p style="font-size:0.9em;">Regards,<br />Book Kart</p>
              <hr style="border:none;border-top:1px solid #eee" />
              <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                <p>Book Kart</p>
                <p>Tamil Nadu</p>
                <p>India</p>
              </div>
            </div>
          </div>
            `
        }
        mailtransporter.sendMail(details,function(err,data){
            if(err){
                console.log(err);
            }else{
                console.log("Email sent");
            }
        });
        res.status(200).json({message:"User Created",user:usr});
    }catch(err){
        console.log(err);
    }
}

async function verifyOtp(req,res){
    try{
        const {otp,email} = req.body;
        const user = await Users.findOne({email:email});

        if(user.validTill < Date.now()){
            res.send("OTP Expired");
        }else if(user.Otp == otp){
            const usr = await Users.findByIdAndUpdate(user._id,{isAuth:true,Otp:''});
            let details = {
                from: "testvalidatorautomation@outlook.com",
                to: `${email}`,
                subject: "Thank You",
                html: `
                <html lang="en">
            <head>
                <meta charset="utf-8" />
                <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title></title>
                <link href='https://fonts.googleapis.com/css?family=Lato:300,400|Montserrat:700' rel='stylesheet' type='text/css'>
                <style>
                    @import url(//cdnjs.cloudflare.com/ajax/libs/normalize/3.0.1/normalize.min.css);
                    @import url(//maxcdn.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min.css);
                </style>
                <link rel="stylesheet" href="https://2-22-4-dot-lead-pages.appspot.com/static/lp918/min/default_thank_you.css">
                <script src="https://2-22-4-dot-lead-pages.appspot.com/static/lp918/min/jquery-1.9.1.min.js"></script>
                <script src="https://2-22-4-dot-lead-pages.appspot.com/static/lp918/min/html5shiv.js"></script>
            </head>
            <body>
                <header class="site-header" id="header">
                    <h1 class="site-header__title" data-lead-id="site-header-title">Verified!</h1>
                </header>

                <div class="main-content">
                    <i class="fa fa-check main-content__checkmark" id="checkmark"></i>
                    <p class="main-content__body" data-lead-id="main-content-body">Hi, ${usr.name} ,You have been Successfully Verified. Now you can take books and read , Be sure not to damage anything</p>
                </div>

                <footer class="site-footer" id="footer">
                    <p class="site-footer__fineprint" id="fineprint">Book Kart</p>
                </footer>
            </body>
            </html>
            `
            }
            mailtransporter.sendMail(details,function(err,data){
                if(err){
                    console.log(err);
                }else{
                    console.log("Email sent");
                }
            });
            res.status(200).send("OTP Verified");
        }else{
            res.send("Invalid OTP");
        }
    }catch(err){
        console.log(err);
    }
}

async function login(req,res){
    try{
        const {email,password} = req.body;
        const user = await Users.findOne({email:email});
        if(user){
            const pass = verifyPassword(password,user.password);
            if(pass){
                const token = jwt.sign({_id:user._id},process.env.SECRET);
                res.cookie("token",token,{expires:new Date(Date.now()+ 7200000)}).status(200).json({message:"Login Successfull",token:token,user:user});
            }else{
                res.send("Invalid Password");
            }
        }else{
            res.send("User Not Found");
        }
    }catch(err){
        console.log(err);
    }
}

async function logout(req,res){
    try{
        res.clearCookie("token").send("Logout Successfull");;
    }catch(err){
        console.log(err);
    }
}

async function getProfile(req,res){
    const {id} = req.params;
    try{
        const user = await Users.findById(id);
        res.status(200).json({user:user});
    }catch(err){
        console.log(err);
    }
}

async function takeBooks(req,res){
    const {bookId,userId} = req.body;
    try{
        const book = await Books.findById(bookId);
        const user = await Users.findById(userId);

        if(!book.isTaken){
            const bk = await Books.findByIdAndUpdate(bookId,{isTaken:true});
            const usr = await Users.findByIdAndUpdate(userId,{ $push: {booksTaken:book}});
            let details = {
                from: "testvalidatorautomation@outlook.com",
                to: `${usr.email}`,
                subject: "Thank You",
                html:`
                <!DOCTYPE html>
                <html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">
                <head>
                <title></title>
                <meta content="text/html; charset=utf-8" http-equiv="Content-Type"/>
                <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
                <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]-->
                <style>
                        * {
                            box-sizing: border-box;
                        }

                        body {
                            margin: 0;
                            padding: 0;
                        }

                        a[x-apple-data-detectors] {
                            color: inherit !important;
                            text-decoration: inherit !important;
                        }

                        #MessageViewBody a {
                            color: inherit;
                            text-decoration: none;
                        }

                        p {
                            line-height: inherit
                        }

                        .desktop_hide,
                        .desktop_hide table {
                            mso-hide: all;
                            display: none;
                            max-height: 0px;
                            overflow: hidden;
                        }

                        @media (max-width:500px) {
                            .desktop_hide table.icons-inner {
                                display: inline-block !important;
                            }

                            .icons-inner {
                                text-align: center;
                            }

                            .icons-inner td {
                                margin: 0 auto;
                            }

                            .row-content {
                                width: 100% !important;
                            }

                            .mobile_hide {
                                display: none;
                            }

                            .stack .column {
                                width: 100%;
                                display: block;
                            }

                            .mobile_hide {
                                min-height: 0;
                                max-height: 0;
                                max-width: 0;
                                overflow: hidden;
                                font-size: 0px;
                            }

                            .desktop_hide,
                            .desktop_hide table {
                                display: table !important;
                                max-height: none !important;
                            }
                        }
                    </style>
                </head>
                <body style="background-color: #FFFFFF; margin: 0; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
                <table border="0" cellpadding="0" cellspacing="0" class="nl-container" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #FFFFFF;" width="100%">
                <tbody>
                <tr>
                <td>
                <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                <tbody>
                <tr>
                <td>
                <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 480px;" width="480">
                <tbody>
                <tr>
                <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top; padding-top: 5px; padding-bottom: 5px; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
                <table border="0" cellpadding="0" cellspacing="0" class="heading_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                <tr>
                <td class="pad" style="text-align:center;width:100%;">
                <h1 style="margin: 0; color: #8a3c90; direction: ltr; font-family: Arial, Helvetica Neue, Helvetica, sans-serif; font-size: 38px; font-weight: 700; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0;">Book Kart</h1>
                </td>
                </tr>
                </table>
                <table border="0" cellpadding="0" cellspacing="0" class="html_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                <tr>
                <td class="pad">
                <div align="center" style="font-family:Arial, Helvetica Neue, Helvetica, sans-serif;text-align:center;"></div>
                </td>
                </tr>
                </table>
                </td>
                </tr>
                </tbody>
                </table>
                </td>
                </tr>
                </tbody>
                </table>
                <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                <tbody>
                <tr>
                <td>
                <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 480px;" width="480">
                <tbody>
                <tr>
                <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top; padding-top: 5px; padding-bottom: 5px; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
                <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
                <tr>
                <td class="pad" style="padding-top:60px;">
                <div style="color:#101112;font-size:16px;font-family:Arial, Helvetica Neue, Helvetica, sans-serif;font-weight:400;line-height:120%;text-align:left;direction:ltr;letter-spacing:0px;mso-line-height-alt:19.2px;"></div>
                </td>
                </tr>
                </table>
                <table border="0" cellpadding="15" cellspacing="0" class="paragraph_block block-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
                <tr>
                <td class="pad">
                <div style="color:#101112;font-size:16px;font-family:Arial, Helvetica Neue, Helvetica, sans-serif;font-weight:400;line-height:120%;text-align:left;direction:ltr;letter-spacing:0px;mso-line-height-alt:19.2px;">
                <p style="margin: 0; margin-bottom: 10px;"><strong>Hi ,${usr.name}</strong></p>
                <p style="margin: 0; margin-bottom: 10px;"> </p>
                <p style="margin: 0; margin-bottom: 10px;"><strong>Its from Book kart ,We heard that you took our book ,After Reading the book please return the book safely ,and please don't damage the books.</strong></p>
                <p style="margin: 0; margin-bottom: 10px;"> </p>
                <p style="margin: 0; margin-bottom: 10px;"><strong>Thanks From</strong></p>
                <p style="margin: 0;"><strong>Book-Kart</strong></p>
                </div>
                </td>
                </tr>
                </table>
                <table border="0" cellpadding="10" cellspacing="0" class="divider_block block-4" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                <tr>
                <td class="pad">
                <div align="center" class="alignment">
                <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                <tr>
                <td class="divider_inner" style="font-size: 1px; line-height: 1px; border-top: 2px solid #8A3C90;"><span> </span></td>
                </tr>
                </table>
                </div>
                </td>
                </tr>
                </table>
                <table border="0" cellpadding="0" cellspacing="0" class="icons_block block-5" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                <tr>
                <td class="pad" style="vertical-align: middle; color: #9d9d9d; font-family: inherit; font-size: 15px; padding-bottom: 5px; padding-top: 5px; text-align: center;">
                <table cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                <tr>
                <td class="alignment" style="vertical-align: middle; text-align: center;">
                <!--[if vml]><table align="left" cellpadding="0" cellspacing="0" role="presentation" style="display:inline-block;padding-left:0px;padding-right:0px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;"><![endif]-->
                <!--[if !vml]><!-->
                <table cellpadding="0" cellspacing="0" class="icons-inner" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; display: inline-block; margin-right: -4px; padding-left: 0px; padding-right: 0px;">
                <!--<![endif]-->
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
                </td>
                </tr>
                </tbody>
                </table>
                </td>
                </tr>
                </tbody>
                </table><!-- End -->
                </body>
                </html>
                `
            }
            mailtransporter.sendMail(details, function(error, info){
                if (error) {
                    console.log(error);
                    }
                else {
                    console.log('Email sent: ' + info.response);
                }
            });
            res.status(200).json({message:"Book Taken",user:usr,book:bk});
        }else{
            res.send("Book Already Taken");
        }
    }catch(err){
        console.log(err);
    }
}

async function returnBooks(req,res){
    const {BookId,userId} = req.body;
    try{
        const book = await Books.findOneAndUpdate(BookId,{isTaken:false});
        console.log(book);
        const user = await Users.findByIdAndUpdate(userId,{$pull:{booksTaken:BookId}});
        let details = {
            from: "testvalidatorautomation@outlook.com",
            to: `${user.email}`,
            subject: "Thank You",
            html:`
            <!DOCTYPE html>

            <html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">
            <head>
            <title></title>
            <meta content="text/html; charset=utf-8" http-equiv="Content-Type"/>
            <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
            <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml><![endif]-->
            <style>
                    * {
                        box-sizing: border-box;
                    }
            
                    body {
                        margin: 0;
                        padding: 0;
                    }
            
                    a[x-apple-data-detectors] {
                        color: inherit !important;
                        text-decoration: inherit !important;
                    }
            
                    #MessageViewBody a {
                        color: inherit;
                        text-decoration: none;
                    }
            
                    p {
                        line-height: inherit
                    }
            
                    .desktop_hide,
                    .desktop_hide table {
                        mso-hide: all;
                        display: none;
                        max-height: 0px;
                        overflow: hidden;
                    }
            
                    @media (max-width:500px) {
                        .desktop_hide table.icons-inner {
                            display: inline-block !important;
                        }
            
                        .icons-inner {
                            text-align: center;
                        }
            
                        .icons-inner td {
                            margin: 0 auto;
                        }
            
                        .row-content {
                            width: 100% !important;
                        }
            
                        .mobile_hide {
                            display: none;
                        }
            
                        .stack .column {
                            width: 100%;
                            display: block;
                        }
            
                        .mobile_hide {
                            min-height: 0;
                            max-height: 0;
                            max-width: 0;
                            overflow: hidden;
                            font-size: 0px;
                        }
            
                        .desktop_hide,
                        .desktop_hide table {
                            display: table !important;
                            max-height: none !important;
                        }
                    }
                </style>
            </head>
            <body style="background-color: #FFFFFF; margin: 0; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
            <table border="0" cellpadding="0" cellspacing="0" class="nl-container" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #FFFFFF;" width="100%">
            <tbody>
            <tr>
            <td>
            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
            <tbody>
            <tr>
            <td>
            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 480px;" width="480">
            <tbody>
            <tr>
            <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top; padding-top: 5px; padding-bottom: 5px; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
            <table border="0" cellpadding="0" cellspacing="0" class="heading_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
            <tr>
            <td class="pad" style="text-align:center;width:100%;">
            <h1 style="margin: 0; color: #8a3c90; direction: ltr; font-family: Arial, Helvetica Neue, Helvetica, sans-serif; font-size: 38px; font-weight: 700; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0;">Book Kart</h1>
            </td>
            </tr>
            </table>
            <table border="0" cellpadding="0" cellspacing="0" class="html_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
            <tr>
            <td class="pad">
            <div align="center" style="font-family:Arial, Helvetica Neue, Helvetica, sans-serif;text-align:center;"></div>
            </td>
            </tr>
            </table>
            </td>
            </tr>
            </tbody>
            </table>
            </td>
            </tr>
            </tbody>
            </table>
            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
            <tbody>
            <tr>
            <td>
            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 480px;" width="480">
            <tbody>
            <tr>
            <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top; padding-top: 5px; padding-bottom: 5px; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
            <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
            <tr>
            <td class="pad" style="padding-top:60px;">
            <div style="color:#101112;direction:ltr;font-family:Arial, Helvetica Neue, Helvetica, sans-serif;font-size:16px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:left;mso-line-height-alt:19.2px;"></div>
            </td>
            </tr>
            </table>
            <table border="0" cellpadding="15" cellspacing="0" class="paragraph_block block-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
            <tr>
            <td class="pad">
            <div style="color:#101112;direction:ltr;font-family:Arial, Helvetica Neue, Helvetica, sans-serif;font-size:16px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:left;mso-line-height-alt:19.2px;">
            <p style="margin: 0; margin-bottom: 10px;"><strong>Hi ,${user.name}</strong></p>
            <p style="margin: 0; margin-bottom: 10px;"> </p>
            <p style="margin: 0; margin-bottom: 10px;"><strong>Its from Book kart, Thanks for Returning the book Safely, Use our Service any time you like 😁</strong></p>
            <p style="margin: 0; margin-bottom: 10px;"> </p>
            <p style="margin: 0; margin-bottom: 10px;"><strong>Thanks From</strong></p>
            <p style="margin: 0;"><strong>Book-Kart</strong></p>
            </div>
            </td>
            </tr>
            </table>
            <table border="0" cellpadding="10" cellspacing="0" class="divider_block block-4" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
            <tr>
            <td class="pad">
            <div align="center" class="alignment">
            <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
            <tr>
            <td class="divider_inner" style="font-size: 1px; line-height: 1px; border-top: 2px solid #8A3C90;"><span> </span></td>
            </tr>
            </table>
            </div>
            </td>
            </tr>
            </table>
            <table border="0" cellpadding="0" cellspacing="0" class="icons_block block-5" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
            <tr>
            <td class="pad" style="vertical-align: middle; color: #9d9d9d; font-family: inherit; font-size: 15px; padding-bottom: 5px; padding-top: 5px; text-align: center;">
            <table cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
            <tr>
            <td class="alignment" style="vertical-align: middle; text-align: center;">
            <!--[if vml]><table align="left" cellpadding="0" cellspacing="0" role="presentation" style="display:inline-block;padding-left:0px;padding-right:0px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;"><![endif]-->
            <!--[if !vml]><!-->
            <table cellpadding="0" cellspacing="0" class="icons-inner" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; display: inline-block; margin-right: -4px; padding-left: 0px; padding-right: 0px;">
            <!--<![endif]-->
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
            </td>
            </tr>
            </tbody>
            </table>
            </td>
            </tr>
            </tbody>
            </table><!-- End -->
            </body>
            </html>
            `
        }
        mailtransporter.sendMail(details, function(error, info){
            if (error) {
                console.log(error);
                }
            else {
                console.log('Email sent: ' + info.response);
            }
        });
        res.status(200).json({message:"Book Returned",user:user,book:book});
    }catch(err){
        console.log(err);
    }
}

module.exports = {
    createUser,
    verifyOtp,
    login,
    logout,
    getProfile,
    takeBooks,
    returnBooks
}