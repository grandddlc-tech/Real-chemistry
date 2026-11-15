# ChemSpark IMAT

A study app for IMAT chemistry. Open `index.html` in a browser (or serve the folder with any static server). It has no build step and no dependencies.

## What each chapter has

- **Review**: section notes rewritten from the coursebook, "Important" boxes, IMAT tips, worked examples, book questions with model answers, flashcards and a cheat sheet.
- **Test**: IMAT-style 5-option questions drawn at random from the chapter bank. Practice mode shows the answer after each question; Exam mode is timed at IMAT pace (100 s per question). Scoring: +1.5 / −0.4 / 0.
- **Figures**: interactive redrawn figures (particle model, Boyle, Charles, syringe oven, vapour equilibrium, boiling point curve) and a pV = nRT solver.
- **Mistakes**: every wrong or skipped question with its explanation. Answer it correctly later and it moves out of the list.
- **Progress**: accuracy history, topic strengths, review checklist.

Progress is stored in the browser's `localStorage`.

## Adding a chapter

1. Copy `js/chapters/ch05-states-of-matter.js` to a new file, for example `js/chapters/ch06-enthalpy.js`, and replace the content (`id`, `number`, `sections`, `questions`, ...).
2. Add a `<script>` tag for it in `index.html`, before `js/figures.js`.
3. New interactive figures go in `js/figures.js` and are listed by id in the chapter's `figures` array.

Text markup inside chapter data: `**bold**`, `==key term==`, `*italic*`, `_{subscript}`, `^{superscript}`.

## Android app (APK)

`android/` is a small WebView app that bundles the web app for offline use. Every push that changes the app runs the **Build Android APK** GitHub Action, which builds a signed APK and publishes it as a GitHub Release.

Latest APK: https://github.com/grandddlc-tech/Real-chemistry/releases/latest/download/ChemSpark.apk

The signing keystore (`android/app/chemspark.keystore`) is committed on purpose so every new APK installs as an update over the old one and keeps your saved progress. It only signs this personal study app.
