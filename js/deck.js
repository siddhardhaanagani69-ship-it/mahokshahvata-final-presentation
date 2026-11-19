/* Slide table in speaking order. steps = clicks inside the slide (1 = no fragments).
   frame defaults to id; frames are laid out on the sheet in this order by js/engine.js.
   cam (optional) = [dx, dy, zoom] relative to the frame centre, or one entry per step.
   opts (optional) = extra fields, e.g. { print: 1 }: the step the PDF export prints for this slide
   (default: the last step). */
(function () {
  const S = (id, part, steps, cam, opts) => ({ id, part, steps, cam, ...opts });
  window.DECK = [
    S("title", "", 1),
    S("problem", "I · The problem", 3),
    S("path", "II · Migration", 2),
    S("arch", "III · Architecture", 3),
    S("resil", "III · Architecture", 2),
    S("ship", "IV · Automation", 3),
    S("watch", "IV · Automation", 2),
    S("code", "IV · Automation", 2),
    S("prod", "V · Production", 4),
    S("demo", "VI · Live demo", 1),
    S("close", "VII · Close", 2),
    S("whatif", "Appendix", 1, null, { appendix: true }),
    S("decisions", "Appendix", 1, null, { appendix: true }),
  ];
})();
