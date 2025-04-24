let canvas = document.getElementById("canvas");
canvas.width = 540;
canvas.height = 500;

let context = canvas.getContext("2d");

function createKey(note, number=0, key="A", width=100, height=200) {
    context.fillStyle = "black";
    context.fillRect((width + 10) * number, canvas.height - height, width, height);

    context.fillStyle = "white";
    context.fillText(key, (width + 10) * number + width / 2, canvas.height - height + height / 2, width, 20);
}

// context.fillStyle = "red";
// context.fillRect(0, 0, 20, 20);
["A", "S", "D", "F", "G"].forEach((key, idx) => createKey(null, idx, key))