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

canvas.height = 600;
canvas.width = keys.length * (100 + 10) - 10;

const positions = calculateKeyPositions(keys);

let statusText = document.getElementById("status");

let button = document.getElementById("startButton");
button.addEventListener("click", () => {
  playMelody();
  button.disabled = true;
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
let melody = [["E"], [], ["A"], ["H"], ["G"], [], ["D"], ["E"], ["C"], [], [], [], ["C", "E", "G"]]; // TODO: add a tone delay for an actual rhythm
let bpm = 80; // Beats per minute
let rate = 1 / bpm * 60 * 1000; // Speed in milliseconds
const tolerance = 2 * rate; // ms
let pressedKeyHistory = [];
let inputEnabled = true; // Whether to enable keyboard input, disabled when the melody is playing
let startTime = 0; // Time since the playback started/the user has started playing the melody
let visualize = false;
let noteCount = 4;

let visualizeEl = document.getElementById("visualize");
visualizeEl.checked = visualize;
visualizeEl.onchange = e => {
  visualize = e.currentTarget.checked;
}

let notesEl = document.getElementById("notes");
notesEl.value = noteCount;
notesEl.onchange = e => {
  noteCount = e.currentTarget.value;
}

let bpmEl = document.getElementById("bpm");
bpmEl.value = bpm;
bpmEl.onchange = e => {
  bpm = e.currentTarget.value;
  rate = 1 / bpm * 60 * 1000;
}

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

function playMelody() {
  statusText.innerText = "Playing melody";

  // TODO: generate random melody
  melody = [];
  let possibleTones = Object.keys(tones);
  for(let i = 0; i < noteCount; i++) {
    melody.push([possibleTones[Math.floor(Math.random() * possibleTones.length)]]);
  }

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
      // Allow the user to play the melody. Counted time starts when a key is pressed (startTime == 0 as a magic value, see keydown listener)
      statusText.innerText = "Play the melody (Enter to finish)";
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
  context.font = "bold 1em sans-serif";
  context.fillText(
    key,
    (width + 10) * number + width / 2,
    canvas.height - height + height / 2,
    width,
    20
  );
}

function drawVisualization(bottomY) {
	// TODO: add visualization with falling notes
}

// --- Game Logic ---
function checkResult() {
  console.log(pressedKeyHistory, melody);
  if (pressedKeyHistory.length < melody.length) {
    return; // Because not all timeStamps has passed
  }

  console.log("Results ----");

  let currentPosition = 0; // Current position in the melody in ms
  let correctNotes = 0; // Number of notes correctly played
  let totalNotes = 0; // Total number of notes
  let pressDelay = 0; // Sum of all the delays between the press and the actual note time

  for(let notes of melody) {
    for(let note of notes) {
      // Retrieve the pressed key closest to the actual time of the note in the melody
      let closestPressedNote = pressedKeyHistory
        .filter(k => k.key.tone == note && Math.abs(k.timeStamp - currentPosition) <= tolerance)
        .sort((a, b) => Math.abs(a.timeStamp - currentPosition) - Math.abs(b.timeStamp - currentPosition))[0]

      console.log(closestPressedNote);

      if(closestPressedNote != null) { // If the correct key was pressed within the tolerance time, add a correct note to the score
        correctNotes++;
        pressedKeyHistory.splice(pressedKeyHistory.indexOf(closestPressedNote), 1)
      }

      // Add the delay between the press time and the actual note time to the press delay, missed notes count as maximum possible delay (tolerance)
      pressDelay += closestPressedNote == null ? tolerance : Math.abs(closestPressedNote.timeStamp - currentPosition);
      totalNotes++;
    }

    currentPosition += rate; // Advance time by 1 beat
  }

  let text = "Average press delay: " + (pressDelay / totalNotes) + "ms\n";

  let correctPercentage = correctNotes / totalNotes; // 100% = all keys pressed correctly
  //let incorrectPercentage = 1 - pressedKeyHistory.length / totalNotes; // 100% = no incorrect keys
  text += "Accuracy: " + (correctPercentage /* * incorrectPercentage */ * 100) + "%";

  statusText.innerText = text;
}

document.addEventListener("keydown", (e) => {
  if (e.repeat || !inputEnabled) return;

  if(e.key == "Enter") {
    inputEnabled = true;
    button.disabled = false;
    startTime = 0;
    checkResult();
  }

  for (let key of keys) {
    if (key.keyboard != e.key) continue;
    key.pressed = true;

    if(startTime == 0) startTime = Date.now();
    playTone(key.tone);

    pressedKeyHistory.push({key, timeStamp: Date.now() - startTime});
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
  context.clearRect(0, 0, canvas.width, canvas.height);

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
	context.font = "bold 24px sans-serif";
    context.fillText(beatIndicator + 1, 10, 34);
  }
}, 20);
