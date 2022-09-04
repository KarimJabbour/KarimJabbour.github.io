const textarea = document.querySelector("#text");
let speechbtn = document.querySelector(".submit");
let pitch = document.querySelector("#pitch");
speechbtn.addEventListener("click", () => {
  let speech = new SpeechSynthesisUtterance(textarea.value);
  speech.pitch = pitch.value;
  speechSynthesis.speak(speech);
});
alert("Some browsers may not support speech. Chrome browser preferred!");
