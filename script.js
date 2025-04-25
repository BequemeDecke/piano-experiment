let canvas = document.getElementById("canvas");

let context = canvas.getContext("2d");
let audioContext = new AudioContext();

// TODO: maybe a few to many keys, reduce if needed
let keys = [
    { tone: "C", keyboard: "s", pressed: false },
    { tone: "D", keyboard: "d", pressed: false },
    { tone: "E", keyboard: "f", pressed: false },
    { tone: "F", keyboard: " ", pressed: false },
    { tone: "G", keyboard: "j", pressed: false },
    { tone: "A", keyboard: "k", pressed: false },
    { tone: "H", keyboard: "l", pressed: false },
];

canvas.width = keys.length * (100 + 10) - 10;
canvas.height = 500;

let tones = {
    "C": 261.626,
    "D": 293.665,
    "E": 329.628,
    "F": 349.228,
    "G": 391.995,
    "A": 440,
    "H": 493.883,
}

let melody = [ ];

function drawKey(note, number=0, key="A", pressed=false, width=100, height=200) {
    context.fillStyle = pressed ? "green" : "black";
    context.fillRect((width + 10) * number, canvas.height - height, width, height);

    context.fillStyle = "white";
    context.fillText(key, (width + 10) * number + width / 2, canvas.height - height + height / 2, width, 20);
}

document.addEventListener("keydown", e => {
    if(e.repeat) return;

    for(let key of keys) {
        if(key.keyboard != e.key) continue;
        key.pressed = true;

        let arr = [];
        let noteLength = 0.75; // 0.75s total length
        let fadeOut = 0.5; // fade out last 0.25s
        for (var i = 0; i < audioContext.sampleRate * noteLength; i++) {
            let remaining = noteLength - i / audioContext.sampleRate;
            let mult = remaining <= fadeOut ? remaining / fadeOut : 1;
            arr[i] = sineWaveAt(i, tones[key.tone]) * 0.3 * mult;
        }

        playSound(arr);
    }
});

document.addEventListener("keyup", e => {
    for(let key of keys) {
        if(key.keyboard != e.key) continue;
        key.pressed = false;
    }
});

setInterval(() => {
    keys.forEach((key, idx) => drawKey(null, idx, key.keyboard.replace(" ", "_").toUpperCase(), key.pressed));
}, 20);


// Source: https://stackoverflow.com/questions/34708980/generate-sine-wave-and-play-it-in-the-browser
function playSound(arr) {
    var buf = new Float32Array(arr.length)
    for (var i = 0; i < arr.length; i++) buf[i] = arr[i]
    var buffer = audioContext.createBuffer(1, buf.length, audioContext.sampleRate)
    buffer.copyToChannel(buf, 0)
    var source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
}

function sineWaveAt(sampleNumber, tone) {
    var sampleFreq = audioContext.sampleRate / tone
    return Math.sin(sampleNumber / (sampleFreq / (Math.PI * 2)))
}
