import assert from 'node:assert/strict';
import {
  DEFAULT_VISIT_POPUP_TEXT_STYLE,
  resolveVisitPopupTextColor,
  resolveVisitPopupTextStyle,
  visitPopupTextColorSaveError,
  visitPopupTypography,
} from './visitPopupOverlay';

assert.equal(resolveVisitPopupTextColor(undefined), '#ffffff');
assert.equal(resolveVisitPopupTextColor('#abc'), '#abc');
assert.equal(resolveVisitPopupTextColor('not-a-color'), '#ffffff');

assert.equal(resolveVisitPopupTextStyle(undefined), DEFAULT_VISIT_POPUP_TEXT_STYLE);
assert.equal(resolveVisitPopupTextStyle('calibri_clean'), 'calibri_clean');
assert.equal(resolveVisitPopupTextStyle('invalid'), DEFAULT_VISIT_POPUP_TEXT_STYLE);

assert.equal(visitPopupTextColorSaveError(''), null);
assert.equal(visitPopupTextColorSaveError('#fff'), null);
assert.ok(visitPopupTextColorSaveError('red'));

const calibri = visitPopupTypography('calibri_clean');
assert.ok(calibri.fontFamily?.includes('Calibri'));

console.log('visitPopupOverlay.test.ts: ok');
