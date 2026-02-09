/**
 * ConfirmModal.js
 * A promise-based, theme-compliant modal replacement for confirm()
 */

export const ConfirmModal = {
  show({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', theme = 'copper' }) {
    return new Promise((resolve) => {
      // Remove existing if any (singleton pattern)
      const existing = document.querySelector('.confirm-modal-overlay');
      if (existing) existing.remove();

      // Create Overlay
      const overlay = document.createElement('div');
      overlay.className = 'confirm-modal-overlay';
      
      // Create Modal
      const modal = document.createElement('div');
      modal.className = `confirm-modal confirm-modal--${theme}`;
      
      modal.innerHTML = `
        <div class="confirm-modal__header">
          <h3 class="confirm-modal__title">${title}</h3>
        </div>
        <div class="confirm-modal__body">
          <p>${message}</p>
        </div>
        <div class="confirm-modal__footer">
          <button class="btn btn--ghost" id="confirmCancel">${cancelText}</button>
          <button class="btn btn--${theme === 'moss' ? 'secondary' : 'primary'}" id="confirmProbceed">${confirmText}</button>
        </div>
      `;
      
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      
      // Focus confirm for safety/speed? No, focus cancel for safety.
      const cancelBtn = modal.querySelector('#confirmCancel');
      const proceedBtn = modal.querySelector('#confirmProbceed');
      
      cancelBtn.focus();
      
      // Handlers
      const cleanup = () => {
        overlay.classList.add('confirm-modal-overlay--out');
        modal.classList.add('confirm-modal--out');
        setTimeout(() => overlay.remove(), 200);
      };
      
      cancelBtn.onclick = () => {
        cleanup();
        resolve(false);
      };
      
      proceedBtn.onclick = () => {
        cleanup();
        resolve(true);
      };
      
      // Prevent click-away (Blocking)
      overlay.onclick = (e) => {
        if (e.target === overlay) {
            // Pulse effect to show it's blocking?
            modal.style.transform = 'scale(1.02)';
            setTimeout(() => modal.style.transform = '', 100);
        }
      };
      
      // Escape key
      const keyHandler = (e) => {
        if (e.key === 'Escape') {
          document.removeEventListener('keydown', keyHandler);
          cleanup();
          resolve(false);
        }
      };
      document.addEventListener('keydown', keyHandler);
    });
  }
};
