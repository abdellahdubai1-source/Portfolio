/**
 * Wires up the public contact form (added to the Contact CTA section of
 * index.html) to Supabase. Degrades gracefully: if Supabase isn't configured
 * yet, the form tells the visitor to use WhatsApp/email instead rather than
 * failing silently.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    var form = document.getElementById('contact-form');
    if (!form) return;

    var submitBtn = form.querySelector('[type="submit"]');
    var statusEl = document.getElementById('contact-form-status');
    var defaultBtnText = submitBtn ? submitBtn.textContent : 'Send Message';

    function setStatus(message, type) {
      if (!statusEl) return;
      statusEl.textContent = message || '';
      statusEl.className = 'form-status' + (type ? ' form-status--' + type : '');
    }

    function setLoading(isLoading) {
      if (!submitBtn) return;
      submitBtn.disabled = isLoading;
      submitBtn.classList.toggle('is-loading', isLoading);
      submitBtn.textContent = isLoading ? 'Sending…' : defaultBtnText;
    }

    function isValidEmail(value) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      setStatus('', null);

      var name = (form.elements['name'] ? form.elements['name'].value : '').trim();
      var email = (form.elements['email'] ? form.elements['email'].value : '').trim();
      var phone = (form.elements['phone'] ? form.elements['phone'].value : '').trim();
      var subject = (form.elements['subject'] ? form.elements['subject'].value : '').trim();
      var message = (form.elements['message'] ? form.elements['message'].value : '').trim();
      // Honeypot: real visitors never see or fill this field (hidden via CSS).
      // If it has a value, the submission came from a bot — pretend it worked.
      var honeypot = (form.elements['website'] ? form.elements['website'].value : '').trim();

      if (!name || !email || !message) {
        setStatus('Please fill in your name, email, and message.', 'error');
        return;
      }
      if (!isValidEmail(email)) {
        setStatus('Please enter a valid email address.', 'error');
        return;
      }

      if (honeypot) {
        // Silently "succeed" for bots without touching the database.
        form.reset();
        setStatus('Thanks! Your message has been sent.', 'success');
        return;
      }

      if (!window.sb) {
        setStatus('Sorry, the contact form isn’t connected yet. Please reach out on WhatsApp or email below instead.', 'error');
        if (window.showToast) window.showToast('Contact form is not connected to Supabase yet.', 'error');
        return;
      }

      setLoading(true);

      window.sb.from('messages').insert([{
        name: name,
        email: email,
        phone: phone || null,
        subject: subject || null,
        message: message
      }]).then(function (result) {
        setLoading(false);
        if (result.error) {
          console.error('[contact-form] insert failed:', result.error);
          setStatus('Something went wrong sending your message. Please try WhatsApp or email below.', 'error');
          if (window.showToast) window.showToast('Could not send your message. Please try again.', 'error');
          return;
        }
        form.reset();
        setStatus('Thanks! Your message has been sent — I’ll get back to you soon.', 'success');
        if (window.showToast) window.showToast('Message sent successfully!', 'success');
      }).catch(function (err) {
        setLoading(false);
        console.error('[contact-form] unexpected error:', err);
        setStatus('Something went wrong sending your message. Please try WhatsApp or email below.', 'error');
        if (window.showToast) window.showToast('Could not send your message. Please try again.', 'error');
      });
    });
  }
})();
