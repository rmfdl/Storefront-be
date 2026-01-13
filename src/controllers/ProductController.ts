import { ObjectId } from 'mongodb';
import { createProductSchema } from '../schemas/product.schema';
import { z } from 'zod';
import { getDB, getGFS } from '../config/db';
import { Product } from '../models/Product';

export const createProduct = async (req: any, res: any) => {
  try {
    const db = getDB();
    const gfs = getGFS();
    const { name, price, description, category } = req.body;

    console.log('Creating product:', { name, category });  // Logging: Data produk

    let imageFilename = '';
    if (req.file) {
      console.log('Uploading file:', req.file.originalname, 'Size:', req.file.size);  // Logging: Detail file
      const uploadStream = gfs.openUploadStream(
        `${Date.now()}-${req.file.originalname}`,
        {
          metadata: { contentType: req.file.mimetype }
        }
      );
      uploadStream.end(req.file.buffer);
      imageFilename = uploadStream.filename;
      console.log('Generated filename:', imageFilename);  // Logging: Filename hasil upload
    } else {
      console.log('No file uploaded');  // Logging: Jika tidak ada file
    }

    const validatedData = createProductSchema.parse({
      name,
      category,
      price: parseFloat(price),
      description,
      image: imageFilename,
    });

    const result = await db.collection('products').insertOne({
      ...validatedData,
      createdAt: new Date(),
    });

    console.log('Product created successfully:', result.insertedId);  // Logging: Sukses
    res.status(201).json({ _id: result.insertedId, ...validatedData });
  } catch (error) {
    console.error('Error in createProduct:', error);  // Logging: Error detail
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.issues,
      });
    }
    console.error(error);
    res.status(500).json({ message: 'Error creating product' });
  }
};

export const getProducts = async (req: any, res: any) => {
  try {
    const db = getDB();
    const products = await db.collection("products").find({}).toArray();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error fetching products" });
  }
};

export const getAdminProducts = async (req: any, res: any) => {
  try {
    const db = getDB();

    // query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const category = req.query.category || "";

    const filter: any = {};

    // Filter kategori
    // if (category) {
    //   filter.category = category;
    // }
    
    if (category && category !== "Semua") {
      filter.category = category;
    }


    // Search nama / deskripsi
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const total = await db.collection("products").countDocuments(filter);

    const products = await db
      .collection("products")
      .find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      data: products,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in getProducts:", error);
    res.status(500).json({ message: "Error fetching products" });
  }
};


export const getProductById = async (req: any, res: any) => {
  try {
    const db = getDB();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await db
      .collection('products')
      .findOne({ _id: new ObjectId(id) });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error in getProductById:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
};

export const updateProduct = async (req: any, res: any) => {
  try {
    const db = getDB();
    const gfs = getGFS();
    const { id } = req.params;
    const { name, price, description, category } = req.body;

    console.log('Updating product ID:', id, { name, category });  // Logging: Data update

    let imageFilename = req.body.image;
    if (req.file) {
      console.log('Uploading new file:', req.file.originalname);  // Logging: File baru
      const uploadStream = gfs.openUploadStream(
        `${Date.now()}-${req.file.originalname}`,
        {
          metadata: { contentType: req.file.mimetype }
        }
      );
      uploadStream.end(req.file.buffer);
      imageFilename = uploadStream.filename;
      console.log('New generated filename:', imageFilename);  // Logging: Filename baru

      // Hapus gambar lama
      const oldProduct = await db.collection('products').findOne({ _id: new ObjectId(id) });
      if (oldProduct?.image) {
        console.log('Deleting old image:', oldProduct.image);  // Logging: Hapus gambar lama
        const files = await gfs.find({ filename: oldProduct.image }).toArray();
        if (files.length > 0) await gfs.delete(files[0]._id);
      }
    }

    const validatedData = createProductSchema.parse({
      name,
      category,
      price: parseFloat(price),
      description,
      image: imageFilename,
    });

    const result = await db.collection('products').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...validatedData, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      console.log('Product not found for update:', id);  // Logging: Jika tidak ditemukan
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log('Product updated successfully:', id);  // Logging: Sukses
    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error in updateProduct:', error);  // Logging: Error detail
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.issues,
      });
    }
    console.error(error);
    res.status(500).json({ message: 'Error updating product' });
  }
};

export const deleteProduct = async (req: any, res: any) => {
  try {
    const db = getDB();
    const gfs = getGFS();
    const { id } = req.params;

    console.log('Deleting product ID:', id);  // Logging: Mulai delete

    const product = await db.collection('products').findOne({ _id: new ObjectId(id) });
    if (!product) {
      console.log('Product not found for delete:', id);  // Logging: Tidak ditemukan
      return res.status(404).json({ message: 'Product not found' });
    }

    await db.collection('products').deleteOne({ _id: new ObjectId(id) });

    if (product.image) {
      console.log('Deleting image:', product.image);  // Logging: Hapus gambar
      const files = await gfs.find({ filename: product.image }).toArray();
      if (files.length > 0) await gfs.delete(files[0]._id);
    }

    console.log('Product deleted successfully:', id);  // Logging: Sukses
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error in deleteProduct:', error);  // Logging: Error detail
    res.status(500).json({ message: 'Error deleting product' });
  }
};