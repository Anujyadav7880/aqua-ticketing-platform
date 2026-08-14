 document.addEventListener("DOMContentLoaded", function () {

    // 🎟 Price Logic
    const category = document.getElementById("category");
    const seatType = document.getElementById("seatType");
    const seats = document.getElementById("seats");
    const totalPrice = document.getElementById("totalPrice");

    if (category && seatType && seats && totalPrice) {

        function calculatePrice() {
            let basePrice = 0;

            if (category.value === "adult") basePrice = 500;
            else if (category.value === "child") basePrice = 300;
            else if (category.value === "vip") basePrice = 800;

            let multiplier = 1;
            if (seatType.value === "premium") multiplier = 1.5;

            let count = parseInt(seats.value) || 1;

            let total = basePrice * multiplier * count;

            totalPrice.innerText = "Total Price: ₹" + total;
        }

        category.addEventListener("change", calculatePrice);
        seatType.addEventListener("change", calculatePrice);
        seats.addEventListener("change", calculatePrice);
    }

    // 🔥 INFO BUTTON LOGIC (same block me rakho)
    const infoBtn = document.getElementById("infoBtn");
    const infoBox = document.getElementById("infoBox");

    if (infoBtn && infoBox) {
        infoBtn.addEventListener("click", function () {

            let current = window.getComputedStyle(infoBox).display;

            if (current === "none") {
                infoBox.style.display = "block";
            } else {
                infoBox.style.display = "none";
            }

        });
    }
    /*Feedback*/
   const form = document.getElementById("feedbackForm");
    const popup = document.getElementById("popup");

    if (form && popup) {
        form.addEventListener("submit", function (e) {
            e.preventDefault();

            popup.style.display = "flex";
            form.reset();

            setTimeout(() => {
                popup.style.display = "none";
            }, 2000);
        });
    }
     /*Gallery*/

   function scrollToGallery() {
  document.getElementById("gallery").scrollIntoView({
    behavior: "smooth"
  });
}

function openImage(src) {
  document.getElementById("lightbox").style.display = "flex";
  document.getElementById("lightbox-img").src = src;
}

function closeImage() {
  document.getElementById("lightbox").style.display = "none";
}

const bookingForm = document.getElementById("ticketForm");

if (bookingForm) {

    bookingForm.addEventListener("submit", async function (e) {

        e.preventDefault();

        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const phone = document.getElementById("phone").value;
        const bookingDate = document.getElementById("bookingDate").value;
        const category = document.getElementById("category").value;
        const quantity = parseInt(
            document.getElementById("quantity").value
        );

        let pricePerTicket = 0;

        if (category === "adult") {
            pricePerTicket = 500;
        } else if (category === "kids") {
            pricePerTicket = 300;
        }

        const totalAmount = pricePerTicket * quantity;

        console.log("Total amount:", totalAmount);

        try {

            const response = await fetch(
                "http://localhost:5000/api/create-order",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                        body: JSON.stringify({
                            name: name,
                            email: email,
                            phone: phone,
                            bookingDate: bookingDate,
                            category: category,
                            quantity: quantity,
                            amount: totalAmount
                        })
                    
                }
            );

            const data = await response.json();

            console.log("Razorpay order:", data);

            if (!data.success) {
                alert("Unable to create payment order.");
                return;
            }

            const options = {

                key: "rzp_test_TPXydJ5q1TXIpb",

                amount: data.order.amount,

                currency: "INR",

                name: "Aqua Water Park",

                description: "Water Park Ticket Booking",

                order_id: data.order.id,

                prefill: {
                    name: name,
                    email: email,
                    contact: phone
                },

                theme: {
                    color: "#38bdf8"
                },

                handler: async function (response) {

    console.log("Payment successful!");
    console.log(response);

    try {

        const verifyResponse = await fetch(
            "http://localhost:5000/api/verify-payment",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature
                })
            }
        );

        const verifyResult = await verifyResponse.json();

        console.log("Verification result:", verifyResult);

        if (verifyResult.success) {
            document.querySelector(".booking-card").style.display = "none";

    // Show ticket
    const ticketContainer =
        document.getElementById("ticketContainer");
    ticketContainer.style.display = "block";

    const booking = verifyResult.booking;

    console.log("Confirmed booking:", booking);

    document.getElementById("ticketContainer").style.display = "block";

    document.getElementById("ticketId").innerText =
        booking.ticketId;

    document.getElementById("ticketName").innerText =
        booking.name;

    document.getElementById("ticketDate").innerText =
        booking.bookingDate;

    document.getElementById("ticketCategory").innerText =
        booking.category;

    document.getElementById("ticketQuantity").innerText =
        booking.quantity;

    document.getElementById("ticketAmount").innerText =
        booking.totalPrice;

    document.getElementById("ticketStatus").innerText =
        booking.ticketStatus;


    // Clear previous QR code
    document.getElementById("qrcode").innerHTML = "";


    // Generate QR code
    new QRCode(
        document.getElementById("qrcode"),
        {
            text: booking.ticketId,
            width: 180,
            height: 180
        }
    );


    alert("Payment successful! Your ticket has been generated.");

}

        else {

            alert("Payment verification failed ");

        }

    } catch (error) {

        console.error("Verification error:", error);

        alert("Unable to verify payment.");

    }

},

                modal: {
                    ondismiss: function () {
                        console.log("Payment popup closed.");
                    }
                }
            };

            const razorpay = new Razorpay(options);

            razorpay.open();

        } catch (error) {

            console.error("Payment error:", error);

            alert("Unable to start payment.");
        }

    });

}
 });