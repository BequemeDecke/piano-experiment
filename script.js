let canvas = document.getElementById("canvas");
canvas.width = 540;
canvas.height = 500;

let context = canvas.getContext("2d");

function createNode(note, number, width=100, height=200) {
    context.fillStyle = "black";
    context.fillRect((width + 10) * number, canvas.height - height, width, height);
}

// context.fillStyle = "red";
// context.fillRect(0, 0, 20, 20);

Array.from({length: 5}, (_,i) => createNode(null, i))