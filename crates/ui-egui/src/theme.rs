//! The colours of the bright theme. Every colour the UI paints comes from here or from a grade's
//! own accent in the catalog.
//!
//! Surfaces (bars, borders, badges) use the bright colours as they are. Text uses a partner chosen
//! to stay readable: dark ink on the lime bar, white on a deeper blue, darker shades of each
//! accent for titles. The contrast ratios are checked in this file's tests.

use egui::Color32;

/// The top bar.
pub const BRAND: Color32 = Color32::from_rgb(0x52, 0xb7, 0x00);
/// Text and marks drawn on the top bar and on selected pills.
pub const ON_BRAND: Color32 = Color32::from_rgb(0x14, 0x30, 0x0a);
/// A selected subject pill.
pub const PILL_ON: Color32 = Color32::from_rgb(0x52, 0xb7, 0x00);
/// A pill that is not selected.
pub const PILL_OFF: Color32 = Color32::from_rgb(0xe1, 0xff, 0xbb);
/// The page behind the cards.
pub const PAGE: Color32 = Color32::from_rgb(0xf5, 0xf5, 0xf5);
pub const CARD: Color32 = Color32::WHITE;
/// Body text.
pub const TEXT: Color32 = Color32::from_rgb(0x33, 0x33, 0x33);
/// Secondary text.
pub const MUTED: Color32 = Color32::from_rgb(0x54, 0x54, 0x54);
/// Lines inside cards.
pub const DIVIDER: Color32 = Color32::from_rgb(0xe1, 0xe1, 0xe1);
/// The edge of an answer box: a boundary a learner must find needs 3 to 1 (WCAG non-text).
pub const BOX_EDGE: Color32 = Color32::from_rgb(0x76, 0x76, 0x76);
/// Links on white.
pub const LINK: Color32 = Color32::from_rgb(0x0a, 0x6f, 0x9e);
/// The main action button.
pub const PRIMARY: Color32 = Color32::from_rgb(0x02, 0x77, 0xa8);
/// The text on the main action button.
pub const ON_PRIMARY: Color32 = Color32::WHITE;
/// A right answer.
pub const GOOD: Color32 = Color32::from_rgb(0x10, 0x7a, 0x3d);
/// A wrong answer.
pub const BAD: Color32 = Color32::from_rgb(0xb4, 0x23, 0x18);
/// Worked steps and other notes.
pub const NOTE: Color32 = Color32::from_rgb(0xff, 0xf4, 0xdc);
/// The edge of a note.
pub const NOTE_EDGE: Color32 = Color32::from_rgb(0xf3, 0x93, 0x17);

/// A grade's accent colour, from its `#rrggbb`. Falls back to body text for a bad value, which
/// the content checks already refuse.
pub fn accent(hex: &str) -> Color32 {
    i_success_model::rgb(hex).map_or(TEXT, |[r, g, b]| Color32::from_rgb(r, g, b))
}

/// The darker shade of an accent used for text on white, so a bright accent stays readable.
pub fn accent_text(accent: Color32) -> Color32 {
    let darken = |c: u8| (f32::from(c) * 0.62).round() as u8;
    Color32::from_rgb(darken(accent.r()), darken(accent.g()), darken(accent.b()))
}

/// WCAG contrast ratio between two colours, from 1 to 21.
pub fn contrast(a: Color32, b: Color32) -> f32 {
    fn luminance(c: Color32) -> f32 {
        let channel = |v: u8| {
            let v = f32::from(v) / 255.0;
            if v <= 0.039_28 { v / 12.92 } else { ((v + 0.055) / 1.055).powf(2.4) }
        };
        0.2126 * channel(c.r()) + 0.7152 * channel(c.g()) + 0.0722 * channel(c.b())
    }
    let (x, y) = (luminance(a), luminance(b));
    (x.max(y) + 0.05) / (x.min(y) + 0.05)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Normal text needs 4.5 to 1 against what it sits on (WCAG AA).
    #[test]
    fn text_colours_are_readable() {
        for (name, fg, bg) in [
            ("text on page", TEXT, PAGE),
            ("text on card", TEXT, CARD),
            ("muted on card", MUTED, CARD),
            ("muted on page", MUTED, PAGE),
            ("link on card", LINK, CARD),
            ("link on page", LINK, PAGE),
            ("button text", ON_PRIMARY, PRIMARY),
            ("ink on the top bar", ON_BRAND, BRAND),
            ("ink on a selected pill", ON_BRAND, PILL_ON),
            ("ink on a pill", ON_BRAND, PILL_OFF),
            ("right answer", GOOD, CARD),
            ("wrong answer", BAD, CARD),
            ("text on a note", TEXT, NOTE),
        ] {
            let ratio = contrast(fg, bg);
            assert!(ratio >= 4.5, "{name}: {ratio:.2} to 1");
        }
    }

    /// Every grade title is drawn in the darker shade of its accent and must stay readable.
    #[test]
    fn every_grade_title_is_readable() {
        let catalog = match i_success_content::builtin() {
            Ok(c) => c,
            Err(e) => panic!("{e}"),
        };
        for grade in &catalog.grades {
            let ratio = contrast(accent_text(accent(&grade.accent)), CARD);
            assert!(ratio >= 4.5, "{}: title {:.2} to 1", grade.id, ratio);
        }
    }

    /// The edge of an answer box must be visible against the card: 3 to 1 for non-text.
    #[test]
    fn answer_boxes_have_a_visible_edge() {
        let ratio = contrast(BOX_EDGE, CARD);
        assert!(ratio >= 3.0, "{ratio:.2} to 1");
    }

    #[test]
    fn contrast_matches_known_values() {
        assert!((contrast(Color32::BLACK, Color32::WHITE) - 21.0).abs() < 0.01);
        assert!((contrast(Color32::WHITE, Color32::WHITE) - 1.0).abs() < 0.001);
    }
}
