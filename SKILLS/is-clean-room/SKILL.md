---
name: is-clean-room
description: The I-SUCCESS clean-room procedure. Use before building any feature, screen, look or piece of practice content that resembles an existing product, before opening a reference product or its material, and whenever a source's origin or licence is unclear. Says what may be used, what may never be consulted, the record to keep, and what to do when something is not clean.
license: MIT
metadata:
  version: "0.1.20261113"
  related_skills: [is-code, is-content, is-ui]
  adapted_from: "storytold/craft-libs docs/clean-room.md (MIT OR Apache-2.0), see NOTICE"
---

# is-clean-room - building it ourselves

## Job to be done

Make every line, word, picture and problem in this repository ours, and let a reviewer check
that claim. I-SUCCESS does what other learning products do; it must not contain any of them.

The Craft apps follow the same rule (house rules: Rust 2, clean room). This skill is adapted from
the craft-libs clean-room standard, which was written for file formats, to an app that
re-creates a product's behaviour, look and practice.

## What may be used

- **The owner's requirements**, stated in their own words.
- **Behaviour seen as a user**: what a screen shows and what happens on a click, observed in the
  reference product and described in our own words. A description of a layout ("a card per
  grade, with a badge, a title, a summary and a skill count") is fine; the card's text is not.
- **Colours measured from the owner's own screenshots**, when the owner has decided the look
  follows a reference. Colours alone are nobody's; logos, icons and illustrations are.
- **Published standards and specifications**, read as documents: curriculum standards,
  accessibility guidelines, file-format specifications. Their ideas, not their wording.
- **Openly licensed material** on the licence allowlist at the top of `AGENTS.md`, with its
  licence and source recorded in `ATTRIBUTION.md` in the same change.
- **Common knowledge**: what a grade learns, how a method works, how a sum is set out.

## Never consulted, in any form

- The reference product's code: its page source, scripts, stylesheets, bundles or network
  responses, including excerpts quoted in forums, blog posts or AI answers.
- Its content: questions, explanations, hints, skill lists and skill names, wording of any
  kind, its numbering of skills.
- Its assets: logos, marks, icons, illustrations, characters, fonts, sounds, videos.
- **Captures and replicas of it.** A folder that saved its pages, screenshots, page text or
  tokens, or a replica built from them, may exist privately. Nothing from it enters this
  repository: no file, no code, no text, no number. If you have read such a capture for a
  task, say so before writing anything for that task here.
- Material whose licence is unclear, or that forbids reuse.

## The record

A piece of work that follows a reference product (a screen modelled on its layout, a skill
area matching its scope) keeps a record **outside this repository**, in the owner's private
planning notes, because the record names the reference and this repository never does. The
public change says only what it built and that it followed this procedure.

1. **Starting assumptions**, written before looking, each marked unverified. Never edited later;
   a reviewer compares them with the result.
2. **A plan**: which sources will be used (the owner's screenshots, which standards), what is
   being decided, and what is the owner's call.
3. **A source log**: every page, screenshot, document and search consulted, in order, with what
   was looked for and what was taken. If a source showed something that was not asked for
   (text, code, a skill list), the log says so.
4. **The work, written fresh** from the plan and the log, in our own words and our own design.
   Practice content follows `is-content`: original, labelled, with worked steps.
5. **A check** before merging: `cargo xtask names` passes, `cargo xtask license-check` passes,
   no asset without an `ATTRIBUTION.md` row, and a reread of the change against the never list.

## When something is not clean

Stop. Record what was seen and where, in the source log, and tell the owner. Work written
afterwards by the same person for the same feature is suspect; the owner decides whether it is
redone by someone who did not see the source, kept with its licence recorded, or dropped. Never
quietly continue, and never "rephrase" copied content to make it look original.
