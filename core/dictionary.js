// Add this near your validation code
const BAN_ABBREVS = new Set([
  'fifa','nato','nasa','asap','diy','eta','faq','hdmi','jpeg','pdf','usb',
  'html','css','json','kpi','roi','oauth','yaml','xml','api','ipsec','oauth'
]);

function looksEnglish(word) {
  // strict a–z only, 4–7 letters (you already do this in loader)
  if (!/^[a-z]{4,7}$/.test(word)) return false;
  // reject common abbreviations/acronyms that slip through
  if (BAN_ABBREVS.has(word)) return false;
  return true;
}
