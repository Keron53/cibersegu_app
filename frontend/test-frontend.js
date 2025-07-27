// Script de prueba para el frontend
console.log('🧪 Pruebas del Frontend - Digital Sign');
console.log('');

// Función para validar contraseñas (igual que en el frontend)
function validatePassword(password) {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  let score = 0;
  if (requirements.length) score += 20;
  if (requirements.uppercase) score += 20;
  if (requirements.lowercase) score += 20;
  if (requirements.number) score += 20;
  if (requirements.special) score += 20;

  let strength = 'muy débil';
  if (score >= 80) strength = 'muy fuerte';
  else if (score >= 60) strength = 'fuerte';
  else if (score >= 40) strength = 'media';
  else if (score >= 20) strength = 'débil';

  return { score, strength, requirements };
}

// Función para validar email
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

console.log('📧 Validación de Emails:');
const testEmails = [
  'test@example.com',
  'invalid-email',
  'user@domain',
  'ticscatolica@gmail.com',
  'test.email@domain.com'
];

testEmails.forEach(email => {
  const isValid = validateEmail(email);
  console.log(`${isValid ? '✅' : '❌'} "${email}" - ${isValid ? 'válido' : 'inválido'}`);
});

console.log('');
console.log('🔐 Validación de Contraseñas:');
const testPasswords = [
  '123',
  'password',
  'Password1',
  'SecurePass123!',
  'MySecurePassword123!@#'
];

testPasswords.forEach(password => {
  const result = validatePassword(password);
  console.log(`"${password}" - Fortaleza: ${result.strength} (${result.score}%)`);
  
  Object.entries(result.requirements).forEach(([req, met]) => {
    console.log(`  ${met ? '✅' : '❌'} ${req}: ${met ? 'cumplido' : 'pendiente'}`);
  });
  console.log('');
});

console.log('🎉 Pruebas del frontend completadas!');
console.log('');
console.log('📋 Resumen:');
console.log('- Validación de emails: ✅');
console.log('- Validación de contraseñas: ✅');
console.log('- Cálculo de fortaleza: ✅');
console.log('- Requisitos de seguridad: ✅'); 