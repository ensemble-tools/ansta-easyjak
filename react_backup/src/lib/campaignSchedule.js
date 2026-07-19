const COMMON_SCHEDULE = [
  { day: 9, type: 'scoutA-pre' },
  { day: 10, type: 'scoutA-start' },
  { day: 12, type: 'event-pre' },
  { day: 13, type: 'scoutB-pre' },
  { day: 14, type: 'scoutB-start' },
  { day: 15, type: 'event-start' },
];

export const CAMPAIGN_SCHEDULE = {
  28: [
    ...COMMON_SCHEDULE,
    { day: 24, type: 'scoutA-pre' },
    { day: 25, type: 'scoutA-start' },
    { day: 26, type: 'event-pre' },
    { day: 26, type: 'scoutB-pre' },
    { day: 27, type: 'scoutB-start' },
    { day: 28, type: 'event-start' },
  ],
  29: [
    ...COMMON_SCHEDULE,
    { day: 24, type: 'scoutA-pre' },
    { day: 25, type: 'scoutA-start' },
    { day: 26, type: 'event-pre' },
    { day: 27, type: 'scoutB-pre' },
    { day: 28, type: 'scoutB-start' },
    { day: 29, type: 'event-start' },
  ],
  30: [
    ...COMMON_SCHEDULE,
    { day: 24, type: 'scoutA-pre' },
    { day: 25, type: 'scoutA-start' },
    { day: 27, type: 'event-pre' },
    { day: 28, type: 'scoutB-pre' },
    { day: 29, type: 'scoutB-start' },
    { day: 30, type: 'event-start' },
  ],
  31: [
    ...COMMON_SCHEDULE,
    { day: 24, type: 'scoutA-pre' },
    { day: 25, type: 'scoutA-start' },
    { day: 27, type: 'event-pre' },
    { day: 28, type: 'scoutB-pre' },
    { day: 30, type: 'scoutB-start' },
    { day: 31, type: 'event-start' },
  ],
};

export const SCHEDULE_TYPES = [
  'scoutA-pre',
  'scoutA-start',
  'scoutB-pre',
  'scoutB-start',
  'event-pre',
  'event-start',
];

export const SCHEDULE_TYPE_LABEL_KEYS = {
  'scoutA-pre': 'calendar.scoutAPre',
  'scoutA-start': 'calendar.scoutAStart',
  'scoutB-pre': 'calendar.scoutBPre',
  'scoutB-start': 'calendar.scoutBStart',
  'event-pre': 'calendar.eventPre',
  'event-start': 'calendar.eventStart',
};

export function getEventsForMonth(year, monthIndex) {
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();
  return CAMPAIGN_SCHEDULE[totalDays] ?? CAMPAIGN_SCHEDULE[30];
}

export function getMonthCells(year, monthIndex, referenceDate = new Date()) {
  const totalDays = new Date(year, monthIndex + 1, 0).getDate();
  const firstDow = new Date(year, monthIndex, 1).getDay();
  const eventMap = new Map();

  for (const event of getEventsForMonth(year, monthIndex)) {
    const events = eventMap.get(event.day) ?? [];
    events.push(event);
    eventMap.set(event.day, events);
  }

  const cells = Array.from({ length: firstDow }, () => ({ kind: 'empty' }));

  for (let day = 1; day <= totalDays; day += 1) {
    const dow = (firstDow + day - 1) % 7;
    const isToday = (
      year === referenceDate.getFullYear()
      && monthIndex === referenceDate.getMonth()
      && day === referenceDate.getDate()
    );

    cells.push({
      kind: 'day',
      day,
      dow,
      isToday,
      events: eventMap.get(day) ?? [],
    });
  }

  return cells;
}
