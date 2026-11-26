"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const category_controller_1 = require("../controllers/category.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const validation_schemas_1 = require("../schemas/validation.schemas");
const router = (0, express_1.Router)();
router.get('/', category_controller_1.getCategories);
// Category administration: ADMIN only
router.post('/', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRoles)('ADMIN'), (0, validate_middleware_1.validateRequest)(validation_schemas_1.createCategorySchema), category_controller_1.createCategory);
router.put('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRoles)('ADMIN'), (0, validate_middleware_1.validateRequest)(validation_schemas_1.updateCategorySchema), category_controller_1.updateCategory);
router.delete('/:id', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRoles)('ADMIN'), category_controller_1.deleteCategory);
exports.default = router;
