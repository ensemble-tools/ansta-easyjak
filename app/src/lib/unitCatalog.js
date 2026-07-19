export const TYPE_COLOR = {
  Flash: { bg: '#fef9c3', color: '#854d0e' },
  Brilliant: { bg: '#dbeafe', color: '#1e40af' },
  Glitter: { bg: '#dcfce7', color: '#166534' },
  Sparkle: { bg: '#fee2e2', color: '#991b1b' },
  All: { bg: '#f1f5f9', color: '#475569' },
};

export const UNIT_CATEGORY = {
  fine: 'starmaker',
  Trickstar: 'starmaker',
  유성대: 'starmaker',
  ALKALOID: 'starmaker',
  Eden: 'cosmic',
  Adam: 'cosmic',
  Eve: 'cosmic',
  Valkyrie: 'cosmic',
  'Crazy:B': 'cosmic',
  '2wink': 'cosmic',
  UNDEAD: 'rhythm_link',
  홍월: 'rhythm_link',
  'Ra*bits': 'rhythm_link',
  MDU: 'rhythm_link',
  Knights: 'new_dimension',
  Switch: 'new_dimension',
  MaM: 'new_dimension',
  DF: 'new_dimension',
  'S-Pri': 'new_dimension',
  주년: 'others',
  만우절: 'others',
  새해: 'others',
  셔플: 'others',
  셔플_10주년: 'others',
  콜라보: 'others',
  추억: 'others',
  'J&A': 'others',
  기타: 'others',
};

export const UNIT_GROUPS = {
  'Adam·Eve': ['Adam', 'Eve'],
  'MaM·DF': ['MaM', 'DF'],
  '주년·새해·만우절': ['주년', '만우절', '새해'],
  셔플: ['셔플', '셔플_10주년'],
  '콜라보·J&A': ['콜라보', 'J&A'],
  '추억·기타': ['추억', '기타'],
};

export const UNIT_FILTER_GROUPS = [
  [
    { label: 'fine', units: ['fine'] },
    { label: 'Trickstar', units: ['Trickstar'] },
    { label: '유성대', units: ['유성대'] },
    { label: 'ALKALOID', units: ['ALKALOID'] },
  ],
  [
    { label: 'Eden', units: ['Eden'] },
    { label: 'Valkyrie', units: ['Valkyrie'] },
    { label: 'Crazy:B', units: ['Crazy:B'] },
    { label: '2wink', units: ['2wink'] },
    { label: 'Adam·Eve', units: ['Adam', 'Eve'] },
  ],
  [
    { label: 'UNDEAD', units: ['UNDEAD'] },
    { label: 'Ra*bits', units: ['Ra*bits'] },
    { label: '홍월', units: ['홍월'] },
    { label: 'MDU', units: ['MDU'] },
  ],
  [
    { label: 'Knights', units: ['Knights'] },
    { label: 'Switch', units: ['Switch'] },
    { label: 'MaM·DF', units: ['MaM', 'DF'] },
    { label: 'S-Pri', units: ['S-Pri'] },
  ],
  [
    { label: '주년·새해·만우절', units: ['주년', '만우절', '새해'] },
    { label: '셔플', units: ['셔플', '셔플_10주년'] },
    { label: '콜라보·J&A', units: ['콜라보', 'J&A'] },
    { label: '추억·기타', units: ['추억', '기타'] },
  ],
];

export const UNIT_KO_MAP = {
  트릭스타: 'Trickstar',
  피네: 'fine',
  알칼로이드: 'ALKALOID',
  에덴: 'Eden',
  발키리: 'Valkyrie',
  크레이지비: 'Crazy:B',
  크비: 'Crazy:B',
  트윙크: '2wink',
  아담: 'Adam',
  이브: 'Eve',
  언데드: 'UNDEAD',
  라비츠: 'Ra*bits',
  멜로우디어어스: 'MDU',
  멜로디: 'MDU',
  멜디: 'MDU',
  나이츠: 'Knights',
  스위치: 'Switch',
  마무: 'MaM',
  맘: 'MaM',
  덥페: 'DF',
  더블페이스: 'DF',
  doubleface: 'DF',
  에스프리: 'S-Pri',
  진앤아: 'J&A',
};

const UNIT_NAME_JA = {
  유성대: '流星隊',
  홍월: '紅月',
  주년: '周年',
  새해: '新年',
  만우절: 'エイプリルフール',
  셔플: 'シャッフル',
  셔플_10주년: 'シャッフル(10周年)',
  콜라보: 'コラボ',
  추억: '追憶',
  기타: 'その他',
  드림유닛: 'ドリームユニット',
};

const UNIT_NAME_EN = {
  유성대: 'Ryuseitai',
  홍월: 'Akatsuki',
  주년: 'Anniversary',
  새해: 'New Year',
  만우절: 'April Fools',
  셔플: 'Shuffle',
  셔플_10주년: 'Shuffle (10th Anniv.)',
  콜라보: 'Collab',
  추억: 'Reminiscence',
  기타: 'Other',
  드림유닛: 'Dream Unit',
};

const UNIT_GROUP_NAME_JA = {
  '주년·새해·만우절': '周年・新年・エイプリルフール',
  셔플: 'シャッフル',
  '콜라보·J&A': 'コラボ・J&A',
  '추억·기타': '追憶・その他',
  유성대: '流星隊',
  홍월: '紅月',
};

const UNIT_GROUP_NAME_EN = {
  '주년·새해·만우절': 'Anniv. / New Year / April Fools',
  셔플: 'Shuffle',
  '콜라보·J&A': 'Collab / J&A',
  '추억·기타': 'Reminiscence / Other',
  유성대: 'Ryuseitai',
  홍월: 'Akatsuki',
};

export function getUnitName(unit, locale) {
  if (locale === 'ko') return unit;
  const groupNames = locale === 'ja' ? UNIT_GROUP_NAME_JA : UNIT_GROUP_NAME_EN;
  const unitNames = locale === 'ja' ? UNIT_NAME_JA : UNIT_NAME_EN;

  if (groupNames[unit]) return groupNames[unit];
  return String(unit)
    .split(' / ')
    .map((item) => unitNames[item.trim()] ?? item.trim())
    .join(' / ');
}
