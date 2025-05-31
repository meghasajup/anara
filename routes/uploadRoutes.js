import express from 'express';
import multer from 'multer';
import { uploadImage, deleteImage, getImages, editImage, uploadFile, deleteFile, getFiles, editFile, uploadDocFile, getDocuments } from '../controllers/uploadController.js';
import { isAdminAuthenticated } from "../middlewares/authAdmin.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5 MB in bytes
    },
    fileFilter: (req, file, cb) => {
      if (
        file.mimetype === 'image/jpeg' ||
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg'
      ) {
        cb(null, true);
      } else {
        cb(new Error('Only JPEG, JPG, and PNG files are allowed!'), false);
      }
    }
  });

  const fileUpload = multer({
    storage,
    limits: {
      fileSize: 100 * 1024 * 1024 // Optional: 100 MB max file size
    }
  });
// Signature routes
router.post('/upload', isAdminAuthenticated,upload.single('image'), uploadImage); // upload image

router.delete('/delete/:public_id(*)', isAdminAuthenticated,deleteImage); // delete image

router.get('/list',isAdminAuthenticated, getImages); // get all images 

router.put('/edit/:public_id(*)',isAdminAuthenticated, upload.single('image'), editImage); // edit image


// Letter head routes
router.post('/file-upload', isAdminAuthenticated,fileUpload.any(), uploadFile); //file upload

router.delete('/delete-file/:id',isAdminAuthenticated, deleteFile); //delete file

router.get('/list-files',isAdminAuthenticated, getFiles); //get files

router.put('/edit-file/:id', isAdminAuthenticated,fileUpload.any(), editFile); //edit file


// Document routes
router.post('/upload-documents',isAdminAuthenticated, fileUpload.single('documents'), uploadDocFile); //upload document

router.get('/list-documents',isAdminAuthenticated,  getDocuments); //get documents

export default router;
