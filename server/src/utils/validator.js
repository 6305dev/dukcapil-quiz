const NIK_REGEX = /^[0-9]{16}$/;
const WA_REGEX = /^0[0-9]{8,14}$/;
const VALID_OPTIONS = ['A', 'B', 'C', 'D'];

function sanitizeString(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/[<>]/g, '').trim();
}

function validateNik(nik) {
  return typeof nik === 'string' && NIK_REGEX.test(nik.trim());
}

function validateWhatsapp(wa) {
  return typeof wa === 'string' && WA_REGEX.test(wa.trim());
}

function validateNama(nama) {
  const cleaned = sanitizeString(nama);
  return cleaned.length >= 3 && cleaned.length <= 100;
}

function validatePassword(password) {
  return typeof password === 'string' && password.length >= 8;
}

function validateOption(opt) {
  return typeof opt === 'string' && VALID_OPTIONS.includes(opt.toUpperCase());
}

module.exports = {
  sanitizeString,
  validateNik,
  validateWhatsapp,
  validateNama,
  validatePassword,
  validateOption,
  VALID_OPTIONS
};
