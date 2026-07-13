// ============================================================
// ZYNQ — Inventory Routes
// Scoped to req.user.shopId via authenticateToken
// ============================================================

import { Router } from "express";
import { body, query, param } from "express-validator";
import * as inventoryController from "../controllers/inventory.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { validateRequest } from "../middleware/validate.middleware";

const router = Router();

// Protect all inventory routes
router.use(authenticateToken);

/**
 * GET /api/products
 * Fetch all products with pagination, search, and category filter
 */
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
    query("search").optional().isString(),
    query("category").optional().isString()
  ],
  validateRequest,
  inventoryController.getProducts
);

/**
 * GET /api/products/low-stock
 * Returns items where quantity <= alert_threshold
 */
router.get("/low-stock", inventoryController.getLowStock);

/**
 * GET /api/products/expiring
 * Returns items expiring within N days (default 30)
 */
router.get(
  "/expiring",
  [
    query("days").optional().isInt({ min: 1 }).withMessage("Days must be a positive integer")
  ],
  validateRequest,
  inventoryController.getExpiring
);

/**
 * GET /api/products/:id
 * Fetch a single product by ID
 */
router.get(
  "/:id",
  [param("id").isUUID().withMessage("Invalid product ID format")],
  validateRequest,
  inventoryController.getProductById
);

/**
 * POST /api/products
 * Add a new product to the shop
 */
router.post(
  "/",
  [
    body("name").isString().isLength({ min: 1, max: 200 }).withMessage("Product name is required"),
    body("category").optional().isString().isLength({ max: 100 }),
    body("quantity").optional().isInt({ min: 0 }).withMessage("Quantity cannot be negative"),
    body("price").isFloat({ min: 0 }).withMessage("Price must be a positive number"),
    body("cost_price").optional().isFloat({ min: 0 }).withMessage("Cost price must be a positive number"),
    body("expiry_date").optional({ nullable: true }).isISO8601().withMessage("Invalid date format"),
    body("alert_threshold").optional().isInt({ min: 0 }),
    body("barcode").optional().isString().isLength({ max: 100 })
  ],
  validateRequest,
  inventoryController.addProduct
);

/**
 * PUT /api/products/:id
 * Update an existing product
 */
router.put(
  "/:id",
  [
    param("id").isUUID().withMessage("Invalid product ID format"),
    body("name").optional().isString().isLength({ min: 1, max: 200 }),
    body("category").optional().isString().isLength({ max: 100 }),
    body("quantity").optional().isInt({ min: 0 }).withMessage("Quantity cannot be negative"),
    body("price").optional().isFloat({ min: 0 }),
    body("cost_price").optional().isFloat({ min: 0 }),
    body("expiry_date").optional({ nullable: true }).isISO8601(),
    body("alert_threshold").optional().isInt({ min: 0 }),
    body("barcode").optional().isString().isLength({ max: 100 })
  ],
  validateRequest,
  inventoryController.updateProduct
);

/**
 * PATCH /api/products/:id/stock
 * Increment or decrement quantity with a delta field
 */
router.patch(
  "/:id/stock",
  [
    param("id").isUUID().withMessage("Invalid product ID format"),
    body("delta").isInt().withMessage("Delta must be an integer (positive or negative)")
  ],
  validateRequest,
  inventoryController.updateStock
);

/**
 * DELETE /api/products/:id
 * Delete a product from the shop
 */
router.delete(
  "/:id",
  [param("id").isUUID().withMessage("Invalid product ID format")],
  validateRequest,
  inventoryController.deleteProduct
);

export default router;
