"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const validation_schemas_1 = require("../schemas/validation.schemas");
const router = (0, express_1.Router)();
// Public / Authenticated read profile by username
router.get('/profile/:username', auth_middleware_1.optionalAuthenticate, user_controller_1.getProfile);
// Authenticated current user actions
router.put('/profile', auth_middleware_1.authenticate, (0, validate_middleware_1.validateRequest)(validation_schemas_1.updateProfileSchema), user_controller_1.updateProfile);
router.put('/change-password', auth_middleware_1.authenticate, (0, validate_middleware_1.validateRequest)(validation_schemas_1.changePasswordSchema), user_controller_1.changePassword);
// Admin-only user management
router.get('/', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRoles)('ADMIN'), user_controller_1.listUsers);
router.put('/:id/role', auth_middleware_1.authenticate, (0, auth_middleware_1.requireRoles)('ADMIN'), user_controller_1.updateUserRole);
exports.default = router;
