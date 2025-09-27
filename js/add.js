/* add.js - extracted from add.html
   Handles switching visible form fieldsets and submission/reset behavior
*/
(function(){
    const entitySelect = document.getElementById('entitySelect');
    const form = document.getElementById('registroForm');
    const fieldsets = Array.from(form.querySelectorAll('fieldset'));
    const resultEl = document.getElementById('result');
    const resetBtn = document.getElementById('resetBtn');

    function showFor(value){
        fieldsets.forEach(fs => {
            if (fs.getAttribute('data-for') === value) {
                fs.style.display = '';
            } else {
                fs.style.display = 'none';
            }
        });
        resultEl.style.display = 'none';
    }

    entitySelect.addEventListener('change', e => showFor(e.target.value));

    // initial
    showFor(entitySelect.value);

    form.addEventListener('submit', e => {
        e.preventDefault();
        // collect only visible fields
        const activeFs = fieldsets.find(fs => fs.style.display !== 'none');
        const inputs = Array.from(activeFs.querySelectorAll('input, select, textarea'));
        const data = {};
        inputs.forEach(i => {
            if (i.name) data[i.name] = i.value;
        });
        data._type = activeFs.getAttribute('data-for');

        // show result as JSON below (you can replace this with an AJAX call later)
        resultEl.textContent = JSON.stringify(data, null, 2);
        resultEl.style.display = '';
        console.log('Registro:', data);
        // optional: reset only the active fields
        // form.reset();
    });

    resetBtn.addEventListener('click', () => {
        form.reset();
        showFor(entitySelect.value);
        resultEl.style.display = 'none';
    });
})();
