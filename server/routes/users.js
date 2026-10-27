// Routes for /api/users
const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getAllUsers,
  getUserById,
  toggleUserActive,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorizeAdmin } = require('../middleware/admin');
const upload = require('../middleware/upload');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, upload.single('avatar'), updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/addresses', protect, addAddress);
router.put('/addresses/:addressId', protect, updateAddress);
router.delete('/addresses/:addressId', protect, deleteAddress);
router.patch('/addresses/:addressId/default', protect, setDefaultAddress);
router.get('/', protect, authorizeAdmin, getAllUsers);
router.get('/:id', protect, authorizeAdmin, getUserById);
router.patch('/:id/toggle-active', protect, authorizeAdmin, toggleUserActive);

module.exports = router;
