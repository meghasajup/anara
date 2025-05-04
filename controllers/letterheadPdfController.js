import puppeteer from 'puppeteer';
import { cloudinaryInstance } from "../config/cloudinary.js";
import PDFFile from '../models/pdfFile.js';
import fs from 'fs/promises';
import path from 'path';


//Generate pdf
export const generateLetterheadPDF = async (req, res) => {
    console.log("PDF Generation triggered");
    
    try {
        const { htmlContent, subject } = req.body;
        
        if (!htmlContent) {
            return res.status(400).json({ error: "HTML content is required" });
        }
        
        const browser = await puppeteer.launch({
            headless: "new", 
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        
        await browser.close();
        
        const tmpDir = path.resolve('./tmp');
        await fs.mkdir(tmpDir, { recursive: true });
        
        const tempPath = path.join(tmpDir, `${Date.now()}.pdf`);
        await fs.writeFile(tempPath, pdfBuffer);
        
        const uploadResult = await cloudinaryInstance.uploader.upload(tempPath, {
            resource_type: "raw", 
            folder: "letterheads"
        });
        
        await fs.unlink(tempPath);
        
        const pdfRecord = await PDFFile.create({
            subject,             
            cloudinary_url: uploadResult.secure_url,  
            public_id: uploadResult.public_id  
        });
        
        res.status(201).json({ message: 'PDF generated', url: uploadResult.secure_url });
    } catch (err) {
        console.error("PDF Generation Error:", err);
        res.status(500).json({ error: "Failed to generate PDF" });
    }
};





//Edit pdf
export const editLetterheadPDF = async (req, res) => {
    console.log("PDF Edit triggered");
    
    try {
        const { id } = req.params;
        const { htmlContent, subject } = req.body;
        
        console.log(`Editing PDF with ID: ${id}`);
        console.log(`Subject: ${subject}`);
        
        if (!htmlContent) {
            return res.status(400).json({ error: "HTML content is required" });
        }
        
        const existingPDF = await PDFFile.findById(id);
        if (!existingPDF) {
            return res.status(404).json({ error: "PDF not found" });
        }
        
        console.log(`Found existing PDF with public_id: ${existingPDF.public_id}`);
        
        const browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
        
        await browser.close();
        
        const tmpDir = path.resolve('./tmp');
        await fs.mkdir(tmpDir, { recursive: true });
        
        const tempPath = path.join(tmpDir, `${Date.now()}_edit.pdf`);
        await fs.writeFile(tempPath, pdfBuffer);
        
        if (existingPDF.public_id) {
            console.log(`Attempting to delete Cloudinary file with public_id: ${existingPDF.public_id}`);
            await cloudinaryInstance.uploader.destroy(existingPDF.public_id, { resource_type: "raw" });
        } else {
            console.log("No public_id found for existing PDF, skipping Cloudinary delete");
        }
        
        const uploadResult = await cloudinaryInstance.uploader.upload(tempPath, {
            resource_type: "raw",
            folder: "letterheads"
        });
        
        await fs.unlink(tempPath);
        
        existingPDF.subject = subject || existingPDF.subject;
        existingPDF.cloudinary_url = uploadResult.secure_url;
        existingPDF.public_id = uploadResult.public_id;
        await existingPDF.save();
        
        res.status(200).json({ 
            message: 'PDF updated successfully', 
            url: uploadResult.secure_url 
        });
    } catch (err) {
        console.error("PDF Edit Error:", err);
        res.status(500).json({ error: "Failed to update PDF" });
    }
};