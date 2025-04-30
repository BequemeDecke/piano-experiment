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

canvas.height = 200;
canvas.width = keys.length * (100 + 10) - 10;

const positions = calculateKeyPositions(keys);

let button = document.getElementById("startButton");
button.addEventListener("click", () => {
  startGame(melody, rate);
  button.remove();
});

// --- Variables ---
let tones = {
  C: 261.626,
  D: 293.665,
  E: 329.628,
  F: 349.228,
  G: 391.995,
  A: 440,
  H: 493.883,
};
// Multidimensional array to be able to press multiple keys simultaneously
// TODO: Change the melody
let melody = [["C"], ["D", "E"], ["F"], ["G"], ["A"], ["H"]];
let rate = 2000; // Speed in milliseconds

// --- Functions ---
// Source: https://stackoverflow.com/questions/34708980/generate-sine-wave-and-play-it-in-the-browser
function playSound(arr) {
  var buf = new Float32Array(arr.length);
  for (var i = 0; i < arr.length; i++) buf[i] = arr[i];
  var buffer = audioContext.createBuffer(
    1,
    buf.length,
    audioContext.sampleRate
  );
  buffer.copyToChannel(buf, 0);
  var source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.start(0);
}

function sineWaveAt(sampleNumber, tone) {
  var sampleFreq = audioContext.sampleRate / tone;
  return Math.sin(sampleNumber / (sampleFreq / (Math.PI * 2)));
}

function playMelody(melody) {
  const nextTones = getTones(melody);

  let lastKeys = [];
  const playInterval = setInterval(() => {
    // Clear last keys
    lastKeys.forEach(key => key.pressed = false)
    lastKeys = [];
    // Play roundTones
    const roundTones = nextTones.next();
    if (roundTones.done) {
      clearInterval(playInterval);
    } else {
      roundTones.value.forEach((tone, i) => {
        playTone(tone);
        const key = keys.find(key => key.tone === tone);
        if (key != undefined) {
          key.pressed = true;
          lastKeys.push(key);
        }
      })
    }
  }, [rate])
}

function playTone(tone, noteLength=0.75, fadeOut=0.5) {
  let arr = [];
  for (var i = 0; i < audioContext.sampleRate * noteLength; i++) {
    let remaining = noteLength - i / audioContext.sampleRate;
    let mult = remaining <= fadeOut ? remaining / fadeOut : 1;
    arr[i] = sineWaveAt(i, tones[tone]) * 0.3 * mult;
  }
  playSound(arr);
}

function* getTones(melody) {
  yield* melody;
}

function calculateKeyPositions(keys, x = 0, y = 0, width = 100, height = 200) {
  return keys
    .map(({ tone }, i) => ({
      tone,
      x: (width + 10) * i,
      y: canvas.height - height,
      width,
      height,
    }))
    .reduce((map, i) => map.set(i.tone, i), new Map());
}

function drawKey(
  tone,
  number = 0,
  key = "A",
  pressed = false,
  width = 100,
  height = 200
) {
  const position = positions.get(tone);
  if (position == undefined) {
    throw new Error(`No position defined for Tone: "${tone}"`);
  }
  context.fillStyle = pressed ? "green" : "black";
  context.fillRect(
    position.x,
    position.y,
    position.width,
    position.height
  );

  context.fillStyle = "white";
  context.fillText(
    key,
    (width + 10) * number + width / 2,
    canvas.height - height + height / 2,
    width,
    20
  );
}

// --- Game Logic ---
function startGame(melody, rate) {
  // Play melody and wait until finished
  playMelody(melody)
  const nextTones = getTones(melody);

  const gameLoop = setInterval(() => {
    const roundTones = nextTones.next();
    if (roundTones.done) {
      clearInterval(gameLoop);
    } else {
      roundTones.value.forEach(startToneLoop)
    }
  }, [rate]);
}

document.addEventListener("keydown", (e) => {
  if (e.repeat) return;

  for (let key of keys) {
    if (key.keyboard != e.key) continue;
    key.pressed = true;

    playTone(key.tone)
  }
});

document.addEventListener("keyup", (e) => {
  for (let key of keys) {
    if (key.keyboard != e.key) continue;
    key.pressed = false;
  }
});

setInterval(() => {
  keys.forEach((key, idx) =>
    drawKey(
      key.tone,
      idx,
      key.keyboard.replace(" ", "_").toUpperCase(),
      key.pressed
    )
  );
}, 20);