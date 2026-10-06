function makeDiacriticRegex(str) {
  if (!str || typeof str !== 'string') return '';
  const escaped = str.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escaped
    .replace(/[aáàảãạăắằẳẵặâấầẩẫậ]/gi, '[aáàảãạăắằẳẵặâấầẩẫậ]')
    .replace(/[eéèẻẽẹêếềểễệ]/gi, '[eéèẻẽẹêếềểễệ]')
    .replace(/[iíìỉĩị]/gi, '[iíìỉĩị]')
    .replace(/[oóòỏõọôốồổỗộơớờởỡợ]/gi, '[oóòỏõọôốồổỗộơớờởỡợ]')
    .replace(/[uúùủũụưứừửữự]/gi, '[uúùủũụưứừửữự]')
    .replace(/[yýỳỷỹỵ]/gi, '[yýỳỷỹỵ]')
    .replace(/[dđ]/gi, '[dđ]');
}

module.exports = { makeDiacriticRegex };
