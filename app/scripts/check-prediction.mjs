import { readFile } from 'node:fs/promises';
import { Script, createContext } from 'node:vm';
import assert from 'node:assert/strict';
import { rootSongsPath } from './paths.mjs';
import {
  calculatePredictedCombo,
  createPrediction,
  parsePredictionInput,
  validatePredictionInput,
} from '../src/lib/prediction.js';

const songsSource = await readFile(rootSongsPath, 'utf8');
const sandbox = {};
createContext(sandbox);
new Script(`${songsSource}\nthis.MODEL_PARAMS = MODEL_PARAMS;`).runInContext(sandbox);

const model = sandbox.MODEL_PARAMS;

function legacyFormula({ notes, etStart, etEnd }) {
  let startPoint;
  if (etStart && etEnd) {
    startPoint = model.intercept
      + model.coefs[0] * notes
      + model.coefs[1] * (etStart / notes)
      + model.coefs[2] * (etEnd / notes);
  } else {
    startPoint = model.simpleCoef * notes + model.simpleInt;
  }
  return Math.round(startPoint);
}

const validCases = [
  { notes: 97, etStart: 61, etEnd: 76 },
  { notes: 161, etStart: null, etEnd: null },
  { notes: 225, etStart: 110, etEnd: 150 },
  { notes: 300, etStart: 180, etEnd: 220 },
];

for (const testCase of validCases) {
  assert.equal(
    calculatePredictedCombo(testCase, model),
    legacyFormula(testCase),
    `prediction mismatch for ${JSON.stringify(testCase)}`,
  );
}

const validationCases = [
  [{ notesRaw: '', etStartRaw: '', etEndRaw: '' }, 'errNotes'],
  [{ notesRaw: '79', etStartRaw: '', etEndRaw: '' }, 'errNotesMin'],
  [{ notesRaw: '301', etStartRaw: '', etEndRaw: '' }, 'errNotesMax'],
  [{ notesRaw: '120', etStartRaw: '12.5', etEndRaw: '30' }, 'errETMin'],
  [{ notesRaw: '120', etStartRaw: '12', etEndRaw: '' }, 'errETBoth'],
  [{ notesRaw: '120', etStartRaw: '50', etEndRaw: '40' }, 'errETOrder'],
  [{ notesRaw: '120', etStartRaw: '50', etEndRaw: '53' }, 'errETDiff'],
  [{ notesRaw: '120', etStartRaw: '50', etEndRaw: '120' }, 'errETMax'],
];

for (const [rawInput, expectedCode] of validationCases) {
  const error = validatePredictionInput(parsePredictionInput(rawInput));
  assert.equal(error?.code, expectedCode, `validation mismatch for ${JSON.stringify(rawInput)}`);
}

const prediction = createPrediction({ notesRaw: '161', etStartRaw: '', etEndRaw: '' }, model);
assert.equal(prediction.ok, true);
assert.equal(prediction.predicted, legacyFormula({ notes: 161, etStart: null, etEnd: null }));

console.log('prediction logic matches legacy formula and validation cases');
