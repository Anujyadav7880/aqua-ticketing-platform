const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true
    },

    phone: {
        type: String,
        required: true
    },

    bookingDate: {
        type: String,
        required: true
    },

    category: {
        type: String,
        required: true
    },

    seatType: {
        type: String
    },

    quantity: {
        type: Number,
        required: true
    },

    totalPrice: {
        type: Number
    },

    // 💳 PAYMENT DETAILS

    razorpayOrderId: {
        type: String
    },

    razorpayPaymentId: {
        type: String
    },

    razorpaySignature: {
        type: String
    },

    paymentStatus: {
        type: String,
        enum: ["PENDING", "PAID", "FAILED"],
        default: "PENDING"
    },
    
    ticketId: {
        type: String,
        unique: true,
        sparse: true
    },
    qrCode: {
    type: String
    },

    ticketSignature: {
        type: String
    },

    ticketStatus: {
        type: String,
        enum: ["ACTIVE", "USED", "CANCELLED"],
        default: "ACTIVE"
    },

    usedAt: {
        type: Date
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("Booking", bookingSchema);