/**
 * CreateFrameModal Component
 * Modal form for creating a new Knowledge Portal frame
 */
import { framesAPI } from '../services/frames-data.js';
import { auth } from '../services/auth.js';

const CATEGORIES = [
  { id: 'coding', label: 'Coding', icon: '💻' },
  { id: 'art', label: 'Art', icon: '🎨' },
  { id: 'music', label: 'Music', icon: '🎵' },
  { id: 'writing', label: 'Writing', icon: '✍️' },
  { id: 'engineering', label: 'Engineering', icon: '⚙️' },
  { id: 'photography', label: 'Photography', icon: '📷' },
  { id: 'design', label: 'Design', icon: '🖌️' },
  { id: 'science', label: 'Science', icon: '🔬' },
  { id: 'craft', label: 'Craft', icon: '🛠️' },
  { id: 'performance', label: 'Performance', icon: '🎭' },
  { id: 'film', label: 'Film', icon: '🎬' },
  { id: 'games', label: 'Games', icon: '🎮' },
  { id: 'light-art', label: 'Light Art', icon: '💡' },
  { id: 'mixed-media', label: 'Mixed Media', icon: '🧩' },
  { id: 'architecture', label: 'Architecture', icon: '🏛️' },
  { id: 'cuisine', label: 'Cuisine', icon: '🍳' },
  { id: 'language', label: 'Language', icon: '🗣️' },
  { id: 'nature', label: 'Nature', icon: '🌿' },
  { id: 'wellness', label: 'Wellness', icon: '💪' },
  { id: 'other', label: 'Other', icon: '📡' }
];

// All main category IDs and labels (lowercased) — subcategories can't duplicate these
const MAIN_CATEGORY_NAMES = new Set(
  CATEGORIES.flatMap(c => [c.id, c.label.toLowerCase()])
);

/**
 * Normalize a subcategory name for comparison:
 * lowercase, trim, strip trailing "s", strip common gerund "-ing" → noun stem
 */
function normalizeSubcategory(str) {
  let s = str.toLowerCase().trim();
  // Strip trailing 's' for plural
  if (s.length > 3 && s.endsWith('s') && !s.endsWith('ss')) {
    s = s.slice(0, -1);
  }
  // Strip '-ing' gerund → noun stem (woodworking→woodwork, dancing→danc→dance)
  if (s.length > 5 && s.endsWith('ing')) {
    s = s.slice(0, -3);
    // Handle double consonant: "running" → "runn" → "run"
    if (s.length > 2 && s[s.length - 1] === s[s.length - 2]) {
      s = s.slice(0, -1);
    }
    // Handle silent-e verbs: "danc" → "dance", "mak" → "make"
    if (s.length > 2 && /[bcdfghjklmnpqrstvwxyz]$/.test(s)) {
      s = s + 'e';
    }
  }
  return s;
}

/**
 * Validate a subcategory name and return an error message or null if valid
 */
function validateSubcategory(name) {
  const trimmed = name.trim();
  if (!trimmed) return null; // empty is fine (optional)
  if (trimmed.length < 2) return 'Subcategory must be at least 2 characters.';
  if (trimmed.length > 40) return 'Subcategory must be under 40 characters.';

  const lower = trimmed.toLowerCase();

  // Can't be a main category name
  if (MAIN_CATEGORY_NAMES.has(lower)) {
    return `"${trimmed}" is already a main category — no need to add it as a subcategory.`;
  }

  // Check for gerund form and suggest noun
  if (lower.length > 5 && lower.endsWith('ing')) {
    const stem = lower.slice(0, -3);
    // Build a suggested noun form
    let noun = stem;
    if (noun.length > 2 && noun[noun.length - 1] === noun[noun.length - 2]) {
      noun = noun.slice(0, -1);
    } else if (/[bcdfghjklmnpqrstvwxyz]$/.test(noun)) {
      noun = noun + 'e';
    }
    // Capitalize first letter
    const suggestion = noun.charAt(0).toUpperCase() + noun.slice(1);
    return `Use the noun form instead: "${suggestion}" (not "${trimmed}").`;
  }

  return null;
}

export class CreateFrameModal {
  constructor(options = {}) {
    this.onCreated = options.onCreated || (() => {});
    this.overlay = null;
    this.selectedCategory = null;
  }

  open() {
    const user = auth.getUser();
    if (!user) {
      auth.login();
      return;
    }

    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.innerHTML = `
      <div class="modal-panel frame-create-modal">
        <div class="modal-panel__header">
          <h2>Create a Frame</h2>
          <button class="modal-close" id="modalClose">×</button>
        </div>
        <div class="modal-panel__body">
          <div class="form-group">
            <label class="form-label">Title</label>
            <input type="text" class="form-input" id="frameTitle" placeholder="e.g. Rust for Embedded Systems" maxlength="100">
            <span class="form-hint">3-100 characters</span>
          </div>
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea class="form-input form-textarea" id="frameDesc" placeholder="What is this frame about? What will people find here?" maxlength="500" rows="3"></textarea>
            <span class="form-hint">10-500 characters</span>
          </div>
          <div class="form-group">
            <label class="form-label">Category</label>
            <div class="category-grid" id="categoryGrid">
              ${CATEGORIES.map(c => `
                <button class="category-chip" data-cat="${c.id}">
                  <span>${c.icon}</span>
                  <span>${c.label}</span>
                </button>
              `).join('')}
            </div>
          </div>
          <div class="form-group" id="subcategoryGroup" style="display: none;">
            <label class="form-label">Subcategory <span class="form-hint-inline">(optional — refine within the main category)</span></label>
            <input type="text" class="form-input" id="frameSubcategory" placeholder="e.g. Embedded, Watercolor, Jazz Theory" maxlength="40">
            <span class="form-hint" id="subHint">Use a noun — e.g. "Woodwork" not "Woodworking"</span>
            <span class="form-hint" id="subError" style="color: #ff6b6b; display: none;"></span>
          </div>
          <div class="form-group">
            <label class="form-label">Tags <span class="form-hint-inline">(optional, up to 5)</span></label>
            <input type="text" class="form-input" id="frameTags" placeholder="rust, embedded, hardware (comma-separated)">
          </div>
          <div class="form-group">
            <label class="form-label">Icon <span class="form-hint-inline">(optional emoji)</span></label>
            <input type="text" class="form-input form-input--sm" id="frameIcon" placeholder="🦀" maxlength="4" style="width: 80px;">
          </div>
          <div id="createError" class="form-error" style="display: none;"></div>
        </div>
        <div class="modal-panel__footer">
          <button class="btn btn--outline" id="modalCancel">Cancel</button>
          <button class="btn btn--primary" id="modalCreate">Create Frame</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.overlay);
    this.bindEvents();

    // Focus title
    requestAnimationFrame(() => {
      this.overlay.querySelector('#frameTitle')?.focus();
    });
  }

  close() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }

  bindEvents() {
    // Close
    this.overlay.querySelector('#modalClose').onclick = () => this.close();
    this.overlay.querySelector('#modalCancel').onclick = () => this.close();
    this.overlay.onclick = (e) => {
      if (e.target === this.overlay) this.close();
    };

    // Category selection — reveal subcategory field on pick
    this.overlay.querySelectorAll('.category-chip').forEach(chip => {
      chip.onclick = () => {
        this.overlay.querySelectorAll('.category-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.selectedCategory = chip.dataset.cat;
        const subGroup = this.overlay.querySelector('#subcategoryGroup');
        if (subGroup) subGroup.style.display = 'block';
      };
    });

    // Live subcategory validation
    const subInput = this.overlay.querySelector('#frameSubcategory');
    const subError = this.overlay.querySelector('#subError');
    if (subInput && subError) {
      subInput.addEventListener('input', () => {
        const err = validateSubcategory(subInput.value);
        if (err) {
          subError.textContent = err;
          subError.style.display = 'block';
        } else {
          subError.style.display = 'none';
        }
      });
    }

    // Create
    this.overlay.querySelector('#modalCreate').onclick = () => this.handleCreate();

    // Enter on title
    this.overlay.querySelector('#frameTitle').onkeydown = (e) => {
      if (e.key === 'Enter') this.handleCreate();
    };
  }

  async handleCreate() {
    const title = this.overlay.querySelector('#frameTitle').value.trim();
    const description = this.overlay.querySelector('#frameDesc').value.trim();
    const category = this.selectedCategory;
    const subcategory = this.overlay.querySelector('#frameSubcategory').value.trim();
    const tagsRaw = this.overlay.querySelector('#frameTags').value.trim();
    const icon = this.overlay.querySelector('#frameIcon').value.trim();
    const errorEl = this.overlay.querySelector('#createError');

    // Validate
    if (!title || title.length < 3) {
      errorEl.textContent = 'Title must be at least 3 characters.';
      errorEl.style.display = 'block';
      return;
    }
    if (!description || description.length < 10) {
      errorEl.textContent = 'Description must be at least 10 characters.';
      errorEl.style.display = 'block';
      return;
    }
    if (!category) {
      errorEl.textContent = 'Please select a category.';
      errorEl.style.display = 'block';
      return;
    }

    // Subcategory validation
    if (subcategory) {
      const subErr = validateSubcategory(subcategory);
      if (subErr) {
        errorEl.textContent = subErr;
        errorEl.style.display = 'block';
        return;
      }
    }

    errorEl.style.display = 'none';

    const tags = tagsRaw
      ? tagsRaw.split(',').map(t => t.trim().toLowerCase()).filter(Boolean).slice(0, 5)
      : [];

    const createBtn = this.overlay.querySelector('#modalCreate');
    createBtn.disabled = true;
    createBtn.textContent = 'Creating...';

    try {
      const result = await framesAPI.create({ title, description, category, subcategory: subcategory || undefined, tags, icon: icon || undefined });
      this.close();
      this.onCreated(result);
    } catch (error) {
      errorEl.textContent = error.message;
      errorEl.style.display = 'block';
      createBtn.disabled = false;
      createBtn.textContent = 'Create Frame';
    }
  }
}
