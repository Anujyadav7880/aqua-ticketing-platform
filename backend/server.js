
const express = require("express");
const cors=require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const Booking = require("./models/Booking");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const QRCode = require("qrcode");


const app = express();
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

app.use(cors());
app.use(express.json());



app.post("/api/bookings", async (req, res) => {

    try {

        console.log("Booking received:");
        console.log(req.body);

        const booking = new Booking({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            bookingDate: req.body.bookingDate,
            category: req.body.category,
            quantity: req.body.quantity
        });

        const savedBooking = await booking.save();

        console.log("Booking saved:", savedBooking);

        res.status(201).json({
            message: "Booking saved successfully!",
            booking: savedBooking
        });

    } catch (error) {

        console.error("Booking save error:", error);

        res.status(500).json({
            message: "Failed to save booking"
        });

    }

});

app.post("/api/create-order", async (req, res) => {

    try {

        const {
            name,
            email,
            phone,
            bookingDate,
            category,
            quantity,
            amount
        } = req.body;

        // Create Razorpay order
        const options = {
            amount: amount * 100,
            currency: "INR",
            receipt: "booking_" + Date.now()
        };

        const order = await razorpay.orders.create(options);

        console.log("Razorpay order created:");
        console.log(order);

        // Create pending booking in MongoDB
        const booking = new Booking({
            name,
            email,
            phone,
            bookingDate,
            category,
            quantity,
            totalPrice: amount,
            razorpayOrderId: order.id,
            paymentStatus: "PENDING"
        });

        const savedBooking = await booking.save();

        console.log("Pending booking created:");
        console.log(savedBooking);

        res.json({
            success: true,
            order: order,
            bookingId: savedBooking._id
        });

    } catch (error) {

        console.error("Razorpay order error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to create payment order"
        });

    }

});

app.post("/api/verify-payment", async (req, res) => {

    try {

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        const generatedSignature = crypto
            .createHmac(
                "sha256",
                process.env.RAZORPAY_KEY_SECRET
            )
            .update(
                razorpay_order_id + "|" + razorpay_payment_id
            )
            .digest("hex");

        if (generatedSignature === razorpay_signature) {

            console.log("Payment signature verified successfully!");

            console.log("Trying to update booking with Order ID:");
            console.log(razorpay_order_id); 

            const booking = await Booking.findOneAndUpdate(
               
                {
                    razorpayOrderId: razorpay_order_id
                },
                {
                    razorpayPaymentId: razorpay_payment_id,
                    razorpaySignature: razorpay_signature,
                    paymentStatus: "PAID"
                },
                {
                    new: true
                }
            );

             console.log("Booking found/updated:");
             console.log(booking);

            if (!booking) {

                return res.status(404).json({
                    success: false,
                    message: "Booking not found"
                });

            }
            const ticketId =
            "WP-" +
            crypto
                .randomBytes(6)
                .toString("hex")
                .toUpperCase();

const ticketData =
    ticketId +
    "|" +
    booking._id.toString() +
    "|" +
    booking.bookingDate +
    "|" +
    booking.quantity;

const ticketSignature = crypto
    .createHmac(
        "sha256",
        process.env.TICKET_SECRET
    )
    .update(ticketData)
    .digest("hex");

booking.ticketId = ticketId;
booking.ticketSignature = ticketSignature;
booking.ticketStatus = "ACTIVE";
const qrCode = await QRCode.toDataURL(ticketId);

booking.qrCode = qrCode;

await booking.save();

console.log("Secure ticket generated:");
console.log("Ticket ID:", ticketId);
console.log("Ticket Status:", booking.ticketStatus);
console.log("QR code generated successfully!");

            console.log("Booking marked as PAID:");
            console.log(booking);

            res.json({
                success: true,
                message: "Payment verified and booking confirmed!",
                booking: booking
            });

        } else {

            console.log("Invalid payment signature!");

            res.status(400).json({
                success: false,
                message: "Payment verification failed!"
            });

        }

    } catch (error) {

        console.error("Payment verification error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to verify payment"
        });

    }

});

app.post("/api/verify-ticket", async (req, res) => {

    try {

        const { ticketId } = req.body;

        if (!ticketId) {

            return res.status(400).json({

                success: false,

                message:
                    "Ticket ID is required"

            });

        }


        console.log(
            "Ticket verification request:"
        );

        console.log(
            "Ticket ID:",
            ticketId
        );

        const booking = await Booking.findOne({

            ticketId: ticketId

        });


        if (!booking) {

            console.log(
                "Ticket not found!"
            );

            return res.status(404).json({

                success: false,

                message:
                    "Invalid ticket"

            });

        }
        
        if (booking.paymentStatus !== "PAID") {

            return res.status(400).json({

                success: false,

                message:
                    "Payment not completed"

            });

        }
         const ticketData =
            booking.ticketId +
            "|" +
            booking._id.toString() +
            "|" +
            booking.bookingDate +
            "|" +
            booking.quantity;

            const generatedTicketSignature = crypto
            .createHmac(
                "sha256",
                process.env.TICKET_SECRET
            )
            .update(ticketData)
            .digest("hex");

             if (
            generatedTicketSignature !==
            booking.ticketSignature
        ) {

            console.log(
                "Ticket signature is INVALID!"
            );

            return res.status(400).json({

                success: false,

                message:
                    "Ticket has been modified or is invalid"

            });

        }

        if (booking.ticketStatus !== "ACTIVE") {

            console.log(
                "Ticket is not active!"
            );

            return res.status(400).json({

                success: false,

                message:
                    "Ticket is already used or cancelled",

                status:
                    booking.ticketStatus

            });

        }

        console.log(
            "VALID TICKET!"
        );


        res.json({

            success: true,

            message:
                "Valid ticket",

            booking: {

                ticketId:
                    booking.ticketId,

                name:
                    booking.name,

                bookingDate:
                    booking.bookingDate,

                category:
                    booking.category,

                quantity:
                    booking.quantity,

                totalPrice:
                    booking.totalPrice,

                paymentStatus:
                    booking.paymentStatus,

                ticketStatus:
                    booking.ticketStatus

            }

        });


    } catch (error) {

        console.error(
            "Ticket verification error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Unable to verify ticket"

        });

    }

});
app.post("/api/check-in-ticket", async (req, res) => {

    try {

        const { ticketId } = req.body;

        if (!ticketId) {

            return res.status(400).json({
                success: false,
                message: "Ticket ID is required"
            });

        }

        console.log("Check-in request:");
        console.log("Ticket ID:", ticketId);


        // Find the ticket
        const booking = await Booking.findOne({
            ticketId: ticketId
        });


        if (!booking) {

            return res.status(404).json({
                success: false,
                message: "Invalid ticket"
            });

        }


        // Payment must be completed
        if (booking.paymentStatus !== "PAID") {

            return res.status(400).json({
                success: false,
                message: "Payment not completed"
            });

        }


        // Verify ticket signature again
        const ticketData =
            booking.ticketId +
            "|" +
            booking._id.toString() +
            "|" +
            booking.bookingDate +
            "|" +
            booking.quantity;


        const generatedTicketSignature = crypto
            .createHmac(
                "sha256",
                process.env.TICKET_SECRET
            )
            .update(ticketData)
            .digest("hex");


        if (
            generatedTicketSignature !==
            booking.ticketSignature
        ) {

            console.log(
                "Ticket signature is INVALID!"
            );

            return res.status(400).json({
                success: false,
                message: "Ticket has been modified or is invalid"
            });

        }


        // Check current ticket status
        if (booking.ticketStatus !== "ACTIVE") {

            return res.status(400).json({
                success: false,
                message:
                    "Ticket has already been used or cancelled",
                status: booking.ticketStatus,
                usedAt: booking.usedAt
            });

        }


        // Mark ticket as USED
        booking.ticketStatus = "USED";
        booking.usedAt = new Date();

        await booking.save();


        console.log("Ticket successfully checked in!");
        console.log("Ticket ID:", booking.ticketId);
        console.log("Used At:", booking.usedAt);


        res.json({

            success: true,

            message:
                "Ticket checked in successfully!",

            ticket: {

                ticketId:
                    booking.ticketId,

                name:
                    booking.name,

                bookingDate:
                    booking.bookingDate,

                category:
                    booking.category,

                quantity:
                    booking.quantity,

                ticketStatus:
                    booking.ticketStatus,

                usedAt:
                    booking.usedAt

            }

        });


    } catch (error) {

        console.error(
            "Check-in error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Unable to check in ticket"

        });

    }

});


async function startServer() {

    try {

        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected successfully!");

        app.listen(5000, () => {
            console.log("Server running on http://localhost:5000");
        });

    } catch (error) {

        console.log("MongoDB connection failed:");
        console.log(error.message);

    }

}

startServer();