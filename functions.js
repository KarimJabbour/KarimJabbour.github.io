const checkbox = document.getElementById("color-toggle");
checkbox.addEventListener("change", () => {
  document.body.classList.toggle("dark");
});
