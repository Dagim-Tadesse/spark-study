# HCI Design Principles - Spark Study

This document maps the features of Spark Study to core Human-Computer Interaction (HCI) principles and the six specific project goals.

## 1. Safety
**Goal**: Prevent accidental data loss and allow for easy recovery.
- **Auto-save**: Every edit in the flashcard editor is saved locally and synced to Supabase instantly.
- **Recovery Bin**: Deleted cards are moved to a 30-day "Safety" bin rather than being permanently erased.
- **Version History**: The app keeps snapshots of previous card states, allowing users to undo complex changes.

## 2. Utility
**Goal**: Provide real value for academic coursework.
- **Rich Editor**: Support for equations (Sigma), lists, and formatting specifically for STEM and Humanities students.
- **Templates**: Pre-defined structures for Definitions, Formulas, and Q&A speed up the "Capture" phase of learning.

## 3. Efficiency
**Goal**: Minimize interaction cost and setup time.
- **Keyboard Shortcuts**:
    - `F`: Flip card (Study mode)
    - `K` or `N`: Mark as "Known" (Study mode)
    - `R`: Mark for "Review" (Study mode)
    - `Ctrl + C`: New card (Editor mode)
- **One-Click Creation**: Creating a new card automatically opens the editor with the last used template.

## 4. Usability
**Goal**: Ensure the interface is intuitive and accessible.
- **Tabbed Architecture**: Clear separation between Dashboard, Editor, Study, and Safety modes reduces cognitive load.
- **ARIA Labels**: All interactive elements (buttons, inputs) are tagged for screen readers.
- **Consistent Feedback**: Visual cues (pulses, toasts) confirm user actions like saving or deleting.

## 5. Effectiveness
**Goal**: Map directly to psychological recall research.
- **Spaced Repetition Logic**: The "Flip + Recall" loop mimics active recall testing.
- **Streak Tracking**: Gamification elements encourage consistent daily sessions, which is vital for long-term retention.

## 6. Appeal
**Goal**: Create an inviting and calm study environment.
- **Calm UI**: Uses soft gradients, glassmorphism (backdrop-blur), and a curated color palette to reduce "study anxiety."
- **Motion Design**: Subtle animations (fade-ins, drifts) guide the user's eye without being distracting.

---
*Developed for the Human-Computer Interaction Course.*
