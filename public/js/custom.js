$(document).ready(function () {
  "use strict";
  // 1. Scroll To Top
  $(window).on("scroll", function () {
    if ($(this).scrollTop() > 600) {
      $(".return-to-top").fadeIn();
    } else {
      $(".return-to-top").fadeOut();
    }
  });
  $(".return-to-top").on("click", function () {
    $("html, body").animate(
      {
        scrollTop: 0,
      },
      1500
    );
    return false;
  });

  // 2. owl carousel

  // i. client (carousel)

  $("#client").owlCarousel({
    items: 5,
    loop: true,
    smartSpeed: 900,
    autoplay: true,
    dots: false,
    autoplayHoverPause: false,
    responsive: {
      0: {
        items: 2,
      },
      415: {
        items: 3,
      },
      600: {
        items: 3,
      },
      1200: {
        items: 5,
      },
    },
  });

  $(".play").on("click", function () {
    owl.trigger("play.owl.autoplay", [500]);
  });
  $(".stop").on("click", function () {
    owl.trigger("stop.owl.autoplay");
  });

  // ii.  testimonial-carousel

  $("#collection-carousel").owlCarousel({
    items: 1,
    autoplay: true,
    loop: true,
    dots: false,
    mouseDrag: true,
    nav: false,
    smartSpeed: 1000,
    transitionStyle: "fade",
    animateIn: "fadeIn",
    animateOut: "fadeOutLeft",
    // navText:["<i class='fa fa-angle-left'></i>","<i class='fa fa-angle-right'></i>"]
  });

  // 3. welcome animation support

  $(window).load(function () {
    $(".welcome-hero-txt h4,.welcome-hero-txt h2,.welcome-hero-txt p")
      .removeClass("animated fadeInUp")
      .css({ opacity: "0" });
    $(".welcome-hero-txt button")
      .removeClass("animated fadeInDown")
      .css({ opacity: "0" });
  });

  $(window).load(function () {
    $(".welcome-hero-txt h4,.welcome-hero-txt h2,.welcome-hero-txt p")
      .addClass("animated fadeInUp")
      .css({ opacity: "0" });
    $(".welcome-hero-txt button")
      .addClass("animated fadeInDown")
      .css({ opacity: "0" });
  });

  // 4. cart-close
  $(".cart-close").click(function () {
    $(this).parents(".single-cart-list").fadeOut();
  });
});
