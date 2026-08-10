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



});