import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  isRequired,
  isValidEmail,
  isStrongPassword,
  isValidPhone,
  isValidPostalCode
} from '../src/utils/validators.js';

import {
  formatCurrency,
  formatDate,
  formatTimer,
  truncateText
} from '../src/utils/formatters.js';

describe('validators.js', () => {
  it('isRequired validates non-empty trimmed values', () => {
    assert.equal(isRequired('hola'), true);
    assert.equal(isRequired('  a  '), true);
    assert.equal(isRequired('   '), false);
    assert.equal(isRequired(''), false);
    assert.equal(isRequired(null), false);
    assert.equal(isRequired(undefined), false);
  });

  it('isValidEmail validates standard email addresses', () => {
    assert.equal(isValidEmail('estudiante@libreria.mx'), true);
    assert.equal(isValidEmail('  docente.1@escuela.edu.mx '), true);
    assert.equal(isValidEmail('sin-arroba.com'), false);
    assert.equal(isValidEmail('usuario@dominio'), false);
    assert.equal(isValidEmail(''), false);
  });

  it('isStrongPassword requires >=8 chars with at least one letter and one digit', () => {
    assert.equal(isStrongPassword('Clave123'), true);
    assert.equal(isStrongPassword('ab123456'), true);
    assert.equal(isStrongPassword('Corta1'), false);
    assert.equal(isStrongPassword('SoloLetras'), false);
    assert.equal(isStrongPassword('12345678'), false);
    assert.equal(isStrongPassword(null), false);
  });

  it('isValidPhone accepts 10 to 15 digits ignoring formatting characters', () => {
    assert.equal(isValidPhone('5512345678'), true);
    assert.equal(isValidPhone('+52 (55) 1234-5678'), true);
    assert.equal(isValidPhone('12345'), false);
    assert.equal(isValidPhone('1234567890123456'), false);
  });

  it('isValidPostalCode requires exactly 5 digits', () => {
    assert.equal(isValidPostalCode('06600'), true);
    assert.equal(isValidPostalCode(' 12345 '), true);
    assert.equal(isValidPostalCode('1234'), false);
    assert.equal(isValidPostalCode('123456'), false);
    assert.equal(isValidPostalCode('ABCDE'), false);
  });
});

describe('formatters.js', () => {
  it('formatCurrency formats valid numbers and falls back safely for invalid input', () => {
    const mxn = formatCurrency(125.5, 'MXN');
    assert.match(mxn, /125\.50/);

    const fallback = formatCurrency('no-numero', 'MXN');
    assert.match(fallback, /0\.00/);

    const invalidCurrency = formatCurrency(50, 'INVALID_CODE');
    assert.equal(invalidCurrency, '$50.00');
  });

  it('formatDate formats valid ISO dates and returns em-dash for invalid/empty', () => {
    assert.equal(formatDate(''), '—');
    assert.equal(formatDate(null), '—');
    assert.equal(formatDate('fecha-invalida'), '—');
    const formatted = formatDate('2026-05-15T12:00:00Z');
    assert.match(formatted, /2026/);
  });

  it('formatTimer formats seconds as MM:SS and clamps negatives to 00:00', () => {
    assert.equal(formatTimer(0), '00:00');
    assert.equal(formatTimer(65), '01:05');
    assert.equal(formatTimer(1200), '20:00');
    assert.equal(formatTimer(-10), '00:00');
    assert.equal(formatTimer('abc'), '00:00');
  });

  it('truncateText truncates strings longer than maxLength with ellipsis', () => {
    assert.equal(truncateText('Corto', 10), 'Corto');
    assert.equal(truncateText('1234567890', 10), '1234567890');
    assert.equal(truncateText('12345678901', 10), '123456789…');
    assert.equal(truncateText(null, 10), '');
  });
});
