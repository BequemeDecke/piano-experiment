let canvas = document.getElementById("canvas");
canvas.width = 100;
canvas.height = 100;

let context = canvas.getContext("2d");

context.fillStyle = "black";
context.fillRect(0, 0, canvas.width, canvas.height);

context.fillStyle = "red";
context.fillRect(0, 0, 20, 20);