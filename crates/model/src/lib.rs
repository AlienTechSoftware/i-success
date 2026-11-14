//! The shared vocabulary of I-SUCCESS: what a catalog of practice holds.
//!
//! A [`Catalog`] has subjects (Math first), level bands (Early years, Elementary, ...), the grades
//! inside each band, and skills. A skill belongs to one subject and one grade and carries its
//! practice [`Problem`]s. Every problem has answer boxes ([`AnswerSpec`]) and worked [`Step`]s
//! that fill those boxes.
//!
//! This crate only describes; loading and checking a catalog is `i-success-content`, and
//! checking a learner's answers is `i-success-engine`.

use serde::Deserialize;
use std::collections::BTreeMap;

/// Everything the app can show: subjects, bands, grades and skills.
#[derive(Debug, Clone, Default, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct Catalog {
    #[serde(rename = "subject", default)]
    pub subjects: Vec<Subject>,
    #[serde(rename = "band", default)]
    pub bands: Vec<Band>,
    #[serde(rename = "grade", default)]
    pub grades: Vec<Grade>,
    #[serde(rename = "skill", default)]
    pub skills: Vec<Skill>,
}

/// A subject, shown as a pill at the top of the home screen.
#[derive(Debug, Clone, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct Subject {
    pub id: String,
    pub name: String,
    /// Whether the subject can be opened yet. A subject that is not ready is shown, disabled,
    /// with a note, rather than hidden.
    #[serde(default)]
    pub ready: bool,
}

/// A group of grades that collapses and expands together, such as "Elementary".
#[derive(Debug, Clone, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct Band {
    pub id: String,
    pub name: String,
    /// A short description of what the band covers, such as "Grades 1 to 5".
    pub range: String,
    /// Grade ids, in display order. Empty for a band that is not built yet.
    #[serde(default)]
    pub grades: Vec<String>,
    /// Shown inside the band instead of grade cards, when the band has none.
    #[serde(default)]
    pub note: Option<String>,
}

/// One grade, shown as a card.
#[derive(Debug, Clone, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct Grade {
    pub id: String,
    /// The short mark in the card's badge: "P", "K", "1".
    pub badge: String,
    pub name: String,
    pub summary: String,
    /// The card's colour, as `#rrggbb`.
    pub accent: String,
}

/// A skill to practise: one subject, one grade, a code and a title.
#[derive(Debug, Clone, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct Skill {
    pub id: String,
    pub subject: String,
    pub grade: String,
    /// A short code shown before the title, such as "C.2".
    pub code: String,
    pub title: String,
    #[serde(rename = "problem", default)]
    pub problems: Vec<Problem>,
}

/// Where a problem's answer comes from (the study-wb labelling rule).
#[derive(Debug, Clone, Copy, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Label {
    /// An official answer key exists.
    Graded,
    /// Worked out, with no key to compare against.
    Calculated,
    /// An invented drill written for this project.
    Generated,
}

/// One practice problem.
#[derive(Debug, Clone, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct Problem {
    pub label: Label,
    pub prompt: String,
    #[serde(rename = "answer")]
    pub answers: Vec<AnswerSpec>,
    #[serde(rename = "step", default)]
    pub steps: Vec<Step>,
}

/// One answer box and what it accepts.
#[derive(Debug, Clone, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct AnswerSpec {
    /// Unique within the problem; steps fill boxes by this name.
    pub name: String,
    /// Shown before the box.
    pub label: String,
    /// The expected answer. A number is compared numerically, within `tol`; anything else is
    /// compared as text, ignoring case and surrounding spaces.
    pub answer: String,
    /// How far a numeric answer may be from `answer` and still count. Zero means exact.
    #[serde(default)]
    pub tol: f64,
    #[serde(default)]
    pub prefix: Option<String>,
    #[serde(default)]
    pub suffix: Option<String>,
}

/// One worked step: what to say, and which boxes it fills with which values.
#[derive(Debug, Clone, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct Step {
    pub say: String,
    #[serde(default)]
    pub fill: BTreeMap<String, String>,
}

impl Catalog {
    pub fn subject(&self, id: &str) -> Option<&Subject> {
        self.subjects.iter().find(|s| s.id == id)
    }

    pub fn grade(&self, id: &str) -> Option<&Grade> {
        self.grades.iter().find(|g| g.id == id)
    }

    pub fn skill(&self, id: &str) -> Option<&Skill> {
        self.skills.iter().find(|s| s.id == id)
    }

    /// The skills of one subject in one grade, in catalog order.
    pub fn skills_for<'a>(&'a self, subject: &'a str, grade: &'a str) -> impl Iterator<Item = &'a Skill> + 'a {
        self.skills.iter().filter(move |s| s.subject == subject && s.grade == grade)
    }

    /// The grades of a band that exist in the catalog, in the band's order.
    pub fn band_grades<'a>(&'a self, band: &'a Band) -> impl Iterator<Item = &'a Grade> + 'a {
        band.grades.iter().filter_map(move |id| self.grade(id))
    }
}

/// Reads `#rrggbb` into its three channels. `None` for anything else.
pub fn rgb(hex: &str) -> Option<[u8; 3]> {
    let digits = hex.strip_prefix('#')?;
    if digits.len() != 6 || !digits.chars().all(|c| c.is_ascii_hexdigit()) {
        return None;
    }
    let channel = |i: usize| u8::from_str_radix(digits.get(i..i + 2)?, 16).ok();
    Some([channel(0)?, channel(2)?, channel(4)?])
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rgb_reads_hex_colours() {
        assert_eq!(rgb("#52b700"), Some([0x52, 0xb7, 0x00]));
        assert_eq!(rgb("#FFCA05"), Some([0xff, 0xca, 0x05]));
    }

    #[test]
    fn rgb_refuses_anything_else() {
        for bad in ["52b700", "#52b70", "#52b7000", "#52b70g", "", "#"] {
            assert_eq!(rgb(bad), None, "{bad:?}");
        }
    }

    #[test]
    fn lookups_find_by_id_and_keep_order() {
        let band = Band { id: "b".into(), name: "B".into(), range: "r".into(), grades: vec!["g2".into(), "missing".into(), "g1".into()], note: None };
        let grade = |id: &str| Grade { id: id.into(), badge: id.into(), name: id.into(), summary: String::new(), accent: "#000000".into() };
        let skill = |id: &str, grade: &str| Skill {
            id: id.into(),
            subject: "math".into(),
            grade: grade.into(),
            code: "A.1".into(),
            title: id.into(),
            problems: Vec::new(),
        };
        let catalog = Catalog {
            subjects: vec![Subject { id: "math".into(), name: "Math".into(), ready: true }],
            bands: vec![band.clone()],
            grades: vec![grade("g1"), grade("g2")],
            skills: vec![skill("a", "g1"), skill("b", "g2"), skill("c", "g1")],
        };
        let ids: Vec<&str> = catalog.band_grades(&band).map(|g| g.id.as_str()).collect();
        assert_eq!(ids, ["g2", "g1"], "band order is kept and a missing grade is skipped");
        let skills: Vec<&str> = catalog.skills_for("math", "g1").map(|s| s.id.as_str()).collect();
        assert_eq!(skills, ["a", "c"]);
        assert!(catalog.subject("math").is_some_and(|s| s.ready));
        assert!(catalog.skill("b").is_some());
        assert!(catalog.grade("nope").is_none());
    }
}
