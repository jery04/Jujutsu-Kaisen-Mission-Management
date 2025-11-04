document.addEventListener('DOMContentLoaded', () => {
  const signupBtn = document.getElementById('open-signup');
  const addBtn = document.getElementById('open-add');

  if (signupBtn) {
    signupBtn.addEventListener('click', () => {
      // Navigate to the signup page (relative to index.html)
      window.location.href = 'html/signup.html';
    });
  }

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      // Navigate to the add page (relative to index.html)
      window.location.href = 'html/add.html';
    });
  }
});
