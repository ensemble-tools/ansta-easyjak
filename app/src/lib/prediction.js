export const PREDICTION_ERROR = {
  NOTES_REQUIRED: 'errNotes',
  NOTES_MIN: 'errNotesMin',
  NOTES_MAX: 'errNotesMax',
  ET_MIN: 'errETMin',
  ET_BOTH: 'errETBoth',
  ET_ORDER: 'errETOrder',
  ET_DIFF: 'errETDiff',
  ET_MAX: 'errETMax',
};

export function parsePredictionInput({ notesRaw = '', etStartRaw = '', etEndRaw = '' }) {
  const notesText = String(notesRaw).trim();
  const etStartText = String(etStartRaw).trim();
  const etEndText = String(etEndRaw).trim();

  return {
    notesRaw: notesText,
    etStartRaw: etStartText,
    etEndRaw: etEndText,
    notes: notesText !== '' ? parseInt(notesText) : NaN,
    etStart: etStartText !== '' ? parseInt(etStartText) : null,
    etEnd: etEndText !== '' ? parseInt(etEndText) : null,
  };
}

export function validatePredictionInput(input) {
  const { notesRaw, etStartRaw, etEndRaw, notes, etStart, etEnd } = input;

  if (Number.isNaN(notes) || notes < 1) {
    return { code: PREDICTION_ERROR.NOTES_REQUIRED, fields: ['inputNotes'] };
  }
  if (notes < 80) {
    return { code: PREDICTION_ERROR.NOTES_MIN, fields: ['inputNotes'] };
  }
  if (notes > 300) {
    return { code: PREDICTION_ERROR.NOTES_MAX, fields: ['inputNotes'] };
  }
  if (etStartRaw !== '' && (etStartRaw.includes('.') || parseInt(etStartRaw) < 1)) {
    return { code: PREDICTION_ERROR.ET_MIN, fields: ['inputETStart'] };
  }
  if (etEndRaw !== '' && (etEndRaw.includes('.') || parseInt(etEndRaw) < 1)) {
    return { code: PREDICTION_ERROR.ET_MIN, fields: ['inputETEnd'] };
  }
  if ((etStart !== null) !== (etEnd !== null)) {
    return { code: PREDICTION_ERROR.ET_BOTH, fields: etStart === null ? ['inputETStart'] : ['inputETEnd'] };
  }
  if (etStart !== null && etEnd !== null) {
    if (etStart < 1 || etEnd < 1) {
      return { code: PREDICTION_ERROR.ET_MIN, fields: ['inputETStart', 'inputETEnd'] };
    }
    if (etStart >= etEnd) {
      return { code: PREDICTION_ERROR.ET_ORDER, fields: ['inputETStart', 'inputETEnd'] };
    }
    if (etEnd - etStart < 4) {
      return { code: PREDICTION_ERROR.ET_DIFF, fields: ['inputETStart', 'inputETEnd'] };
    }
    if (etEnd >= notes) {
      return { code: PREDICTION_ERROR.ET_MAX, fields: ['inputETEnd'] };
    }
  }

  return null;
}

export function calculatePredictedCombo({ notes, etStart, etEnd }, modelParams) {
  const { coefs, intercept, simpleCoef, simpleInt } = modelParams;
  const startPoint = etStart && etEnd
    ? intercept + coefs[0] * notes + coefs[1] * (etStart / notes) + coefs[2] * (etEnd / notes)
    : simpleCoef * notes + simpleInt;

  return Math.round(startPoint);
}

export function createPrediction(input, modelParams) {
  const parsed = parsePredictionInput(input);
  const error = validatePredictionInput(parsed);
  if (error) {
    return { ok: false, error, parsed };
  }

  return {
    ok: true,
    parsed,
    predicted: calculatePredictedCombo(parsed, modelParams),
  };
}
