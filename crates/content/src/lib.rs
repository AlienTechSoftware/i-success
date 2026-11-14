//! Reads an I-SUCCESS catalog from TOML and checks it.
//!
//! The built-in catalog is `content/catalog.toml` at the repository root, embedded at build time
//! so the app runs with no files beside it. [`builtin`] reads and checks it; [`parse`] and
//! [`check`] do the same for any text, which is what the tests use.

use i_success_model::{Catalog, rgb};
use std::collections::BTreeSet;
use std::fmt;

/// The built-in catalog's text.
pub const CATALOG_TOML: &str = include_str!("../../../content/catalog.toml");

/// Why a catalog could not be used.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ContentError {
    /// The text is not valid TOML, or does not have the catalog's shape.
    Parse(String),
    /// The text parsed, but these references or rules do not hold. One message each.
    Invalid(Vec<String>),
}

impl fmt::Display for ContentError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ContentError::Parse(message) => write!(f, "the catalog could not be read: {message}"),
            ContentError::Invalid(problems) => {
                write!(f, "the catalog has {} problem(s):", problems.len())?;
                for problem in problems {
                    write!(f, "\n  {problem}")?;
                }
                Ok(())
            }
        }
    }
}

impl std::error::Error for ContentError {}

/// Reads and checks the built-in catalog.
pub fn builtin() -> Result<Catalog, ContentError> {
    load(CATALOG_TOML)
}

/// Reads and checks a catalog.
pub fn load(text: &str) -> Result<Catalog, ContentError> {
    let catalog = parse(text)?;
    let problems = check(&catalog);
    if problems.is_empty() { Ok(catalog) } else { Err(ContentError::Invalid(problems)) }
}

/// Reads a catalog without checking its references.
pub fn parse(text: &str) -> Result<Catalog, ContentError> {
    toml::from_str(text).map_err(|e| ContentError::Parse(e.to_string()))
}

/// Every broken reference or rule in a catalog, one message each. Empty when it is sound.
pub fn check(catalog: &Catalog) -> Vec<String> {
    let mut problems = Vec::new();
    duplicates("subject", catalog.subjects.iter().map(|s| s.id.as_str()), &mut problems);
    duplicates("band", catalog.bands.iter().map(|b| b.id.as_str()), &mut problems);
    duplicates("grade", catalog.grades.iter().map(|g| g.id.as_str()), &mut problems);
    duplicates("skill", catalog.skills.iter().map(|s| s.id.as_str()), &mut problems);

    if catalog.subjects.is_empty() {
        problems.push("there is no subject".to_owned());
    }
    let mut banded = BTreeSet::new();
    for band in &catalog.bands {
        if band.grades.is_empty() && band.note.is_none() {
            problems.push(format!("band {}: no grades and no note saying why", band.id));
        }
        for grade in &band.grades {
            if catalog.grade(grade).is_none() {
                problems.push(format!("band {}: grade {grade} does not exist", band.id));
            }
            if !banded.insert(grade.as_str()) {
                problems.push(format!("band {}: grade {grade} is already in another band", band.id));
            }
        }
    }
    for grade in &catalog.grades {
        if rgb(&grade.accent).is_none() {
            problems.push(format!("grade {}: accent {:?} is not #rrggbb", grade.id, grade.accent));
        }
        if !banded.contains(grade.id.as_str()) {
            problems.push(format!("grade {}: not in any band, so it would never be shown", grade.id));
        }
    }
    for skill in &catalog.skills {
        let at = format!("skill {}", skill.id);
        if catalog.subject(&skill.subject).is_none() {
            problems.push(format!("{at}: subject {} does not exist", skill.subject));
        }
        if catalog.grade(&skill.grade).is_none() {
            problems.push(format!("{at}: grade {} does not exist", skill.grade));
        }
        if skill.problems.is_empty() {
            problems.push(format!("{at}: has no problems"));
        }
        for (p, problem) in skill.problems.iter().enumerate() {
            let at = format!("{at} problem {}", p + 1);
            if problem.answers.is_empty() {
                problems.push(format!("{at}: has no answer boxes"));
            }
            duplicates(&format!("{at} answer"), problem.answers.iter().map(|a| a.name.as_str()), &mut problems);
            let mut filled = BTreeSet::new();
            for (s, step) in problem.steps.iter().enumerate() {
                for name in step.fill.keys() {
                    if !problem.answers.iter().any(|a| &a.name == name) {
                        problems.push(format!("{at} step {}: fills {name}, which is not an answer box", s + 1));
                    }
                    filled.insert(name.as_str());
                }
            }
            for answer in &problem.answers {
                if answer.tol < 0.0 || !answer.tol.is_finite() {
                    problems.push(format!("{at}: answer {} has a tolerance of {}", answer.name, answer.tol));
                }
                if answer.answer.trim().is_empty() {
                    problems.push(format!("{at}: answer {} is empty", answer.name));
                }
                if !filled.contains(answer.name.as_str()) {
                    problems.push(format!("{at}: no step fills answer {}, so the worked steps never finish", answer.name));
                }
            }
        }
    }
    problems
}

fn duplicates<'a>(what: &str, ids: impl Iterator<Item = &'a str>, problems: &mut Vec<String>) {
    let mut seen = BTreeSet::new();
    for id in ids {
        if !seen.insert(id) {
            problems.push(format!("{what} {id} appears more than once"));
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const SMALL: &str = r##"
[[subject]]
id = "math"
name = "Math"
ready = true

[[band]]
id = "early"
name = "Early years"
range = "Pre-K"
grades = ["prek"]

[[grade]]
id = "prek"
badge = "P"
name = "Pre-K"
summary = "Counting."
accent = "#10a0b6"

[[skill]]
id = "count"
subject = "math"
grade = "prek"
code = "A.1"
title = "Count"

[[skill.problem]]
label = "generated"
prompt = "1 + 1"
answer = [{ name = "n", label = "Sum", answer = "2" }]
step = [{ say = "Two.", fill = { n = "2" } }]
"##;

    #[test]
    fn the_builtin_catalog_is_sound() {
        let catalog = match builtin() {
            Ok(catalog) => catalog,
            Err(e) => panic!("{e}"),
        };
        assert_eq!(catalog.subjects.first().map(|s| s.id.as_str()), Some("math"), "math is the first subject");
        assert!(catalog.subject("math").is_some_and(|s| s.ready));
        assert!(catalog.skills.iter().all(|s| s.subject == "math"), "only math has skills in the first release");
        for grade in ["prek", "k", "g1", "g2", "g3", "g4"] {
            assert!(catalog.skills_for("math", grade).count() > 0, "grade {grade} has math skills");
        }
    }

    #[test]
    fn a_small_sound_catalog_loads() {
        let catalog = load(SMALL);
        assert!(catalog.is_ok(), "{catalog:?}");
    }

    #[test]
    fn broken_toml_is_a_parse_error() {
        assert!(matches!(load("[[subject]\nid ="), Err(ContentError::Parse(_))));
    }

    #[test]
    fn an_unknown_field_is_a_parse_error_not_silently_ignored() {
        let text = SMALL.replace("ready = true", "ready = true\ncolour = \"red\"");
        assert!(matches!(load(&text), Err(ContentError::Parse(_))));
    }

    #[test]
    fn every_broken_reference_is_named() {
        let text = SMALL
            .replace("grades = [\"prek\"]", "grades = [\"prek\", \"k\"]")
            .replace("subject = \"math\"\ngrade", "subject = \"art\"\ngrade")
            .replace("accent = \"#10a0b6\"", "accent = \"teal\"")
            .replace("fill = { n = \"2\" }", "fill = { m = \"2\" }");
        let Err(ContentError::Invalid(problems)) = load(&text) else { panic!("expected Invalid") };
        let all = problems.join("\n");
        for expected in [
            "grade k does not exist",
            "subject art does not exist",
            "is not #rrggbb",
            "fills m, which is not an answer box",
            "no step fills answer n",
        ] {
            assert!(all.contains(expected), "missing {expected:?} in:\n{all}");
        }
    }

    #[test]
    fn a_grade_outside_every_band_is_reported() {
        let text = SMALL.replace("grades = [\"prek\"]", "grades = []\nnote = \"later\"");
        let Err(ContentError::Invalid(problems)) = load(&text) else { panic!("expected Invalid") };
        assert!(problems.iter().any(|p| p.contains("not in any band")), "{problems:?}");
    }
}
