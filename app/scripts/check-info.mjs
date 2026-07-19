import assert from 'node:assert/strict';
import messages from '../src/data/i18n.json' with { type: 'json' };
import { NOTICE_ITEMS } from '../src/data/infoContent.js';
import {
  CAMPAIGN_SCHEDULE,
  getEventsForMonth,
  getMonthCells,
  SCHEDULE_TYPE_LABEL_KEYS,
  SCHEDULE_TYPES,
} from '../src/lib/campaignSchedule.js';

const LOCALES = ['ko', 'ja', 'en'];
const REQUIRED_KEYS = [
  'info.noticeTitle',
  'info.contactTitle',
  'info.contactText',
  'info.reportLink',
  'info.homeTitle',
  'info.homeAndroid',
  'info.homeAndroidBtn',
  'info.homeAndroidHint',
  'info.homeIos',
  'info.homeIosStep1',
  'info.homeIosStep2Strong',
  'info.homeIosStep2Rest',
  'info.homeIosStep3',
  'calendar.cardTitle',
  'calendar.title',
  'calendar.open',
  'calendar.prevMonth',
  'calendar.nextMonth',
  'calendar.scoutA',
  'calendar.scoutB',
  'calendar.event',
  'calendar.legendPre',
  'calendar.legendStart',
  ...Object.values(SCHEDULE_TYPE_LABEL_KEYS),
];

for (const locale of LOCALES) {
  const dictionary = messages[locale];
  assert.ok(dictionary, `missing locale dictionary: ${locale}`);

  for (const key of REQUIRED_KEYS) {
    assert.ok(Object.hasOwn(dictionary, key), `missing ${locale}.${key}`);
  }

  const notices = NOTICE_ITEMS[locale];
  assert.ok(Array.isArray(notices), `missing notices for ${locale}`);
  assert.ok(notices.length >= 7, `too few notices for ${locale}`);

  for (const notice of notices) {
    assert.ok(notice.badge, `notice badge missing for ${locale}`);
    assert.ok(['info', 'note', 'wish'].includes(notice.tone), `unknown notice tone: ${notice.tone}`);
    assert.ok(Array.isArray(notice.parts) && notice.parts.length > 0, `notice parts missing for ${locale}`);
    assert.ok(notice.parts.every((part) => typeof part.text === 'string'), `notice text must be strings for ${locale}`);
  }
}

for (const [monthLength, events] of Object.entries(CAMPAIGN_SCHEDULE)) {
  const totalDays = Number(monthLength);
  assert.ok([28, 29, 30, 31].includes(totalDays), `unexpected schedule length: ${monthLength}`);

  for (const event of events) {
    assert.ok(event.day >= 1 && event.day <= totalDays, `event day out of range: ${JSON.stringify(event)}`);
    assert.ok(SCHEDULE_TYPES.includes(event.type), `unknown schedule type: ${event.type}`);
    assert.ok(SCHEDULE_TYPE_LABEL_KEYS[event.type], `missing schedule label key for ${event.type}`);
  }
}

assert.equal(getEventsForMonth(2026, 1), CAMPAIGN_SCHEDULE[28], 'February 2026 should use 28-day schedule');
assert.equal(getEventsForMonth(2024, 1), CAMPAIGN_SCHEDULE[29], 'February 2024 should use 29-day schedule');
assert.equal(getEventsForMonth(2026, 3), CAMPAIGN_SCHEDULE[30], 'April 2026 should use 30-day schedule');
assert.equal(getEventsForMonth(2026, 4), CAMPAIGN_SCHEDULE[31], 'May 2026 should use 31-day schedule');

const cells = getMonthCells(2026, 4, new Date(2026, 4, 11));
assert.equal(cells.filter((cell) => cell.kind === 'day').length, 31);
assert.ok(cells.some((cell) => cell.kind === 'day' && cell.day === 11 && cell.isToday), 'today marker missing');

console.log('info tab content and campaign schedule checks passed');
