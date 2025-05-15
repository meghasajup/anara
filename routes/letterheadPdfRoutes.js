import express from 'express';
import {
    editLetterheadPDF,
    generateLetterheadPDF,
    sendMail,
    getSentMessages,
    getLetterHeads
} from '../controllers/letterheadPdfController.js';
import { isAdminAuthenticated } from '../middlewares/authAdmin.js';

const router = express.Router();


router.post('/generatepdf', isAdminAuthenticated, generateLetterheadPDF); //Generate Letterhead pdf

router.put('/editpdf/:id', isAdminAuthenticated, editLetterheadPDF); //Edit

router.post('/send-mail', isAdminAuthenticated, sendMail); //Send mail

router.post('/list-sent-messages', isAdminAuthenticated, getSentMessages); //Get send msg

router.post('/list-letterheads', isAdminAuthenticated, getLetterHeads); //Get letter heads


export default router;
