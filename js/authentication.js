(function () {
    'use strict';
    const API_BASE = window.location.origin;
    const ADMIN_MASTER = '1234'; // contraseña maestra para crear administrador

    // Jerarquía eliminada: no se crea ni actualiza hechicero; solo se valida existencia

    async function fetchJSON(url, options) {
        const resp = await fetch(url, options);
        let data; try { data = await resp.json(); } catch { data = {}; }
        if (!resp.ok) {
            const msg = data && (data.message || data.details) || ('Error ' + resp.status);
            throw new Error(msg);
        }
        return data;
    }

    async function findSorcererByName(nombre) {
        try { return await fetchJSON(`${API_BASE}/sorcerer/name/${encodeURIComponent(nombre)}`); }
        catch (err) { if (/no encontrado/i.test(err.message)) return null; throw err; }
    }

    // Ya no se crea el hechicero si no existe; se exige existencia previa

    async function createAdministrator(nombre, contrasenna) {
        const payload = { nombre, contrasenna };
        return await fetchJSON(`${API_BASE}/admin`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
    }

    function ready() {
        const form = document.querySelector('form.signup-box');
        if (!form) return;
        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            const nameEl = document.getElementById('name');
            const passEl = document.getElementById('password');
            const adminPassEl = document.getElementById('admin-password');

            const nombre = nameEl?.value?.trim() || '';
            const userPass = passEl?.value || '';
            const adminPass = adminPassEl?.value || '';

            if (!nombre) { alert('El nombre es obligatorio'); return; }
            if (!userPass) { alert('La contraseña es obligatoria'); return; }


            // Feedback visual simple
            form.querySelector('button[type="submit"]').disabled = true;

            try {
                const sorcerer = await findSorcererByName(nombre);
                if (!sorcerer) {
                    alert('El hechicero no existe. Prueba con otro nombre ya registrado.');
                    return;
                }
                // Decide si crear administrador
                let adminCreated = null;
                if (adminPass === ADMIN_MASTER) {
                    adminCreated = await createAdministrator(nombre, userPass);
                }
                const msg = `Hechicero listo (ID: ${sorcerer.id || sorcerer?.sorcerer?.id || 'N/A'})` + (adminCreated ? ' y administrador creado.' : '.');
                alert(msg);
                window.location.href = '/index.html';
            } catch (err) {
                console.error('[authentication] Error:', err);
                alert('Error: ' + err.message);
            } finally {
                form.querySelector('button[type="submit"]').disabled = false;
            }
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
})();
