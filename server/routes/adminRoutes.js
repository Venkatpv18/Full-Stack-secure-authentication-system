const express = require("express");
const User = require("../models/User");
const { protect, authorizeRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.use(authorizeRole("admin"));

// @route   GET /api/admin/stats
// @desc    Get dashboard metrics & system summary
// @access  Private/Admin
router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: "active" });
    const deactivatedUsers = await User.countDocuments({ status: "deactivated" });
    const adminCount = await User.countDocuments({ role: "admin" });

    const recentUsers = await User.find()
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        deactivatedUsers,
        adminCount,
      },
      recentUsers,
    });
  } catch (error) {
    console.error("Admin Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching admin statistics",
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get list of all registered users
// @access  Private/Admin
router.get("/users", async (req, res) => {
  try {
    const users = await User.find()
      .select("-password -refreshToken")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Admin Get Users Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching users list",
    });
  }
});

// @route   PATCH /api/admin/users/:id/status
// @desc    Toggle user status (active / deactivated)
// @access  Private/Admin
router.patch("/users/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.params.id;

    if (!["active", "deactivated"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    if (req.user._id.toString() === userId && status === "deactivated") {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own admin account",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.status = status;
    if (status === "deactivated") {
      user.refreshToken = null;
    }

    await user.save();

    res.json({
      success: true,
      message: `User status updated to ${status}`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Admin Status Update Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating user status",
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user account
// @access  Private/Admin
router.delete("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    if (req.user._id.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own admin account",
      });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Admin Delete User Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting user",
    });
  }
});

module.exports = router;
