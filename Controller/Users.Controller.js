const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Users = require('../Model/User.model');
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
module.exports = {
    createUser,
    verifyOtp,
    login
}