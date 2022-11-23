const router = require('express').Router();
const { createUser,verifyOtp,login } = require('../Controller/Users.Controller');


router.post('/signup',createUser);
router.post('/verify',verifyOtp);
router.post('/login',login);


module.exports = router;