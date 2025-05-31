import express from 'express';
import { editLetterheadPDF, generateLetterheadPDF, sendMail, getSentMessages, getLetterHeads } from '../controllers/letterheadPdfController.js';
import { isAdminAuthenticated } from '../middlewares/authAdmin.js';

const router = express.Router();


router.post('/generatepdf', isAdminAuthenticated, generateLetterheadPDF); // Generate PDF

router.put('/editpdf/:id', isAdminAuthenticated, editLetterheadPDF); // Edit PDF

router.post('/send-mail',isAdminAuthenticated, sendMail); // Send Mail

router.post('/list-sent-messages',isAdminAuthenticated, getSentMessages); // List Sent Messages

router.post('/list-letterheads',isAdminAuthenticated, getLetterHeads); // List Letterheads


export default router;