const router = require('express').Router();
const {
    createUser,
    verifyOtp,
    login,
    logout,
    getProfile,
    takeBooks,
    returnBooks
} = require('../Controller/Users.Controller');

router.post('/signup',createUser);
router.post('/verify',verifyOtp);
router.post('/login',login);
router.get('/logout',logout);
router.get('/profile/:id',getProfile);
router.post('/takeBooks',takeBooks);
router.post('/returnBooks',returnBooks);

module.exports = router;