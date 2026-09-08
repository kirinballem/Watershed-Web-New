/**
 * Formspree AJAX handler for Project Watershed forms.
 * Handles all forms marked with [data-interest-form] or [data-signup-form].
 * Submits via fetch() so the page never reloads, and reveals each form's
 * existing [data-form-success] message on success.
 *
 * Include this file with a <script> tag AFTER the DOM (or use `defer`):
 *   <script src="js/formspree-handler.js" defer></script>
 */

document.addEventListener('DOMContentLoaded', () => {
  const forms = document.querySelectorAll('[data-interest-form], [data-signup-form]');

  forms.forEach((form) => {
    form.addEventListener('submit', handleFormspreeSubmit);
  });
});

async function handleFormspreeSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const successMsg = form.querySelector('[data-form-success]');
  const formData = new FormData(form);

  // Clear any previous error state
  clearFormError(form);

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.dataset.originalText = submitBtn.dataset.originalText || submitBtn.textContent;
    submitBtn.textContent = 'Sending…';
  }

  try {
    const response = await fetch(form.action, {
      method: 'POST',
      body: formData,
      headers: { Accept: 'application/json' },
    });

    if (response.ok) {
      form.reset();

      // Hide all direct-child elements except the success message, then show it
      Array.from(form.children).forEach((child) => {
        if (child !== successMsg) {
          child.style.display = 'none';
        }
      });

      if (successMsg) {
        successMsg.hidden = false;
      }
    } else {
      const data = await response.json().catch(() => null);
      const message =
        data && Array.isArray(data.errors) && data.errors.length
          ? data.errors.map((err) => err.message).join(', ')
          : 'Something went wrong. Please try again.';

      showFormError(form, message);

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtn.dataset.originalText;
      }
    }
  } catch (err) {
    showFormError(form, 'Network error — please check your connection and try again.');

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = submitBtn.dataset.originalText;
    }
  }
}

function showFormError(form, message) {
  let errorEl = form.querySelector('[data-form-error]');

  if (!errorEl) {
    errorEl = document.createElement('p');
    errorEl.setAttribute('data-form-error', '');
    errorEl.className = 'form-error';
    errorEl.style.color = '#b3261e';
    errorEl.style.fontSize = '0.9rem';
    errorEl.style.marginTop = '10px';
    form.appendChild(errorEl);
  }

  errorEl.textContent = message;
  errorEl.hidden = false;
}

function clearFormError(form) {
  const errorEl = form.querySelector('[data-form-error]');
  if (errorEl) {
    errorEl.hidden = true;
    errorEl.textContent = '';
  }
}
