import express from 'express';
import multer from 'multer';
import { createProduct, getProducts, getProductById, updateProduct, deleteProduct, getAdminProducts } from '../controllers/ProductController';
import { adminOnly } from '../middlewares/admin';
import { authMiddleware } from '../middlewares/auth';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/", authMiddleware, adminOnly, upload.single("image"), createProduct);
router.get('/', getProducts);
router.get('/admin', authMiddleware, adminOnly, getAdminProducts);
router.get('/:id', getProductById);
router.put('/:id', authMiddleware, adminOnly, upload.single('image'), updateProduct);  // Baru
router.delete('/:id', authMiddleware, adminOnly, deleteProduct);
export default router;