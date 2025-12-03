/**
 * @jest-environment jsdom
 */
require('../js/utils/auth');

describe('auth utils - getCurrentUserId', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    // Remove previous global if present to re-evaluate behavior
  });

  test('returns null when no storage keys present', () => {
    expect(window.getCurrentUserId()).toBeNull();
  });

  test('reads from localStorage preferred keys', () => {
    localStorage.setItem('username', '  sukuna  ');
    expect(window.getCurrentUserId()).toBe('sukuna');
  });

  test('falls back to sessionStorage and trims value', () => {
    sessionStorage.setItem('currentUserName', '  yuji  ');
    expect(window.getCurrentUserId()).toBe('yuji');
  });

  test('ignores empty/whitespace values and continues search', () => {
    localStorage.setItem('username', '   ');
    sessionStorage.setItem('userName', '  maki  ');
    expect(window.getCurrentUserId()).toBe('maki');
  });
});
