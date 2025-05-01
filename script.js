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
  playMelody(melody);
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
let melody = [["E"], [], ["A"], ["H"], ["G"], [], ["D"], ["E"], ["C"]]; // TODO: add a tone delay for an actual rhythm
let bpm = 100; // Beats per minute
let rate = 1 / bpm * 60 * 1000; // Speed in milliseconds
const tolerance = 2 * rate; // ms
let pressedKeyHistory = [];
let inputEnabled = true; // Whether to enable keyboard input, disabled when the melody is playing
let startTime = Date.now();

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
  inputEnabled = false;
  startTime = 0;

  const nextTones = getTones(melody);

  let lastKeys = [];
  const playInterval = setInterval(() => {
    // Clear last keys
    lastKeys.forEach(key => key.pressed = false);
    lastKeys = [];
    if(startTime == 0) startTime = Date.now();
    // Play roundTones
    const roundTones = nextTones.next();
    if (roundTones.done) {
      inputEnabled = true;
      pressedKeyHistory = [];
      startTime = 0;
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
function checkResult() {
  if (pressedKeyHistory.length < melody.length) {
    return; // Because not all timeStamps has passed
  }

  console.log("Results ----")

  let currentPosition = 0;
  let correctNotes = 0;
  let totalNotes = 0;
  let averagePressDelay = 0;
  for(let notes of melody) {
    for(let note of notes) {
      let closestPressedNote = pressedKeyHistory
        .filter(k => k.key.tone == note && Math.abs(k.timeStamp - currentPosition) <= tolerance)
        .sort((a, b) => Math.abs(b.timeStamp - currentPosition) - Math.abs(a.timeStamp - currentPosition))[0]
      console.log(closestPressedNote)
      if(closestPressedNote != null) {
        correctNotes++;
      }
      averagePressDelay += closestPressedNote == null ? tolerance : Math.abs(closestPressedNote.timeStamp - currentPosition);
      totalNotes++;
    }
    currentPosition += rate;
  }
  console.log("Average delay: " + (averagePressDelay / totalNotes));
  console.log("Accuracy: " + (correctNotes / totalNotes));
  // TODO: Check tolerance
  pressedKeyHistory.forEach(({key, timeStamp}) => {
    
  })
}

document.addEventListener("keydown", (e) => {
  if (e.repeat || !inputEnabled) return;

  if(startTime == 0) startTime = Date.now();

  for (let key of keys) {
    if (key.keyboard != e.key) continue;
    key.pressed = true;

    playTone(key.tone);

    pressedKeyHistory.push({key, timeStamp: Date.now() - startTime});
    checkResult();
  }
});

document.addEventListener("keyup", (e) => {
  if(!inputEnabled) return;

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

  if(startTime != 0) {
    let beatIndicator = Math.floor((Date.now() - startTime) / rate) % 4;
    context.fillStyle = "orangered";
    context.fillText(beatIndicator + 1, 20, 20);
  }
}, 20);
