//! The window, driven the way a person uses it: through the accessibility tree, by label.
//! No mocks; the app runs on the real built-in catalog.

use egui_kittest::Harness;
use egui_kittest::kittest::{NodeT, Queryable};
use i_success_ui_egui::{App, Screen};

fn harness() -> Harness<'static, App> {
    let mut h = Harness::builder().with_size(egui::vec2(1280.0, 900.0)).build_ui_state(|ui, app: &mut App| app.show(ui), App::new());
    h.run();
    h
}

#[test]
fn home_shows_the_brand_subjects_and_levels() {
    let h = harness();
    h.get_by_label("I-SUCCESS home");
    h.get_by_role_and_label(egui::Role::Button, "Math");
    for band in ["Early years", "Elementary", "Middle school", "High school", "Adult learners", "University"] {
        h.get_by_label(band);
    }
    // The open bands show their grade cards.
    h.get_by_label("Pre-K Math skills");
    h.get_by_label("Grade 3 Math skills");
}

#[test]
fn subjects_that_are_not_built_are_shown_but_disabled() {
    let h = harness();
    let science = h.get_by_role_and_label(egui::Role::Button, "Science");
    assert!(science.accesskit_node().is_disabled(), "Science is not built yet");
    assert!(!h.get_by_role_and_label(egui::Role::Button, "Math").accesskit_node().is_disabled());
}

#[test]
fn a_band_collapses_and_expands() {
    let mut h = harness();
    assert!(h.state().is_open("elementary"));
    assert!(h.query_by_label("Grade 3 Math skills").is_some());

    h.get_by_label("Elementary").click();
    h.run();
    assert!(!h.state().is_open("elementary"));
    assert!(h.query_by_label("Grade 3 Math skills").is_none(), "a collapsed band hides its cards");

    h.get_by_label("Elementary").click();
    h.run();
    assert!(h.state().is_open("elementary"));
    assert!(h.query_by_label("Grade 3 Math skills").is_some());
}

#[test]
fn expand_all_and_collapse_all() {
    let mut h = harness();
    h.get_by_label("Expand all").click();
    h.run();
    for band in ["early", "elementary", "middle", "high", "adult", "university"] {
        assert!(h.state().is_open(band), "{band} is open");
    }
    h.get_by_label_contains("Mechanical Engineering");
    h.get_by_label_contains("Grade 12");

    h.get_by_label("Collapse all").click();
    h.run();
    for band in ["early", "elementary", "middle", "high", "adult", "university"] {
        assert!(!h.state().is_open(band), "{band} is closed");
    }
    assert!(h.query_by_label("Grade 3 Math skills").is_none());
}

#[test]
fn a_grade_card_opens_its_skills_and_a_skill_opens_practice() {
    let mut h = harness();
    h.get_by_label("Grade 1 Math skills").click();
    h.run();
    assert_eq!(h.state().screen(), &Screen::Grade("g1".to_owned()));
    h.get_by_label("Practise C.2 Tens and ones").click();
    h.run();
    assert!(matches!(h.state().screen(), Screen::Practice(p) if p.skill_id() == "g1-tens-ones"));
    h.get_by_label_contains("Split 47 into tens and ones");

    h.get_by_label("Back to Grade 1 skills").click();
    h.run();
    assert_eq!(h.state().screen(), &Screen::Grade("g1".to_owned()));
    h.get_by_label("Back to All levels").click();
    h.run();
    assert_eq!(h.state().screen(), &Screen::Home);
}

fn open_practice(h: &mut Harness<'static, App>, grade_label: &str, skill_label: &str) {
    h.get_by_label(grade_label).click();
    h.run();
    h.get_by_label(skill_label).click();
    h.run();
}

fn type_into(h: &mut Harness<'static, App>, label: &str, text: &str) {
    h.get_by_label(label).focus();
    h.run();
    h.get_by_label(label).type_text(text);
    h.run();
}

#[test]
fn checking_a_wrong_then_a_right_answer() {
    let mut h = harness();
    open_practice(&mut h, "Grade 3 Math skills", "Practise E.1 Multiplication facts");
    h.get_by_label_contains("6 \u{d7} 7");

    type_into(&mut h, "Answer: Product", "41");
    h.get_by_label("Check").click();
    h.run();
    h.get_by_label("Not yet");
    assert!(h.query_by_label("Correct").is_none());

    // Clear the box and type the right answer.
    h.get_by_label("Answer: Product").focus();
    h.run();
    for _ in 0..2 {
        h.key_press(egui::Key::Backspace);
        h.run();
    }
    h.get_by_label("Answer: Product").type_text("42");
    h.run();
    assert!(h.query_by_label("Not yet").is_none(), "typing clears the old result");
    h.get_by_label("Check").click();
    h.run();
    h.get_by_label("Correct");
    h.get_by_label("Well done! That is right.");
    h.get_by_label_contains("1 correct of 1 tried");
}

#[test]
fn worked_steps_fill_the_boxes_one_step_at_a_time() {
    let mut h = harness();
    open_practice(&mut h, "Grade 1 Math skills", "Practise C.2 Tens and ones");
    h.get_by_label("Show a step").click();
    h.run();
    h.get_by_label("Worked steps");
    h.get_by_label_contains("4 tens make 40");
    assert!(h.query_by_label_contains("7 ones").is_none(), "only the first step shows");

    h.get_by_label("Show a step").click();
    h.run();
    h.get_by_label_contains("7 ones");
    assert!(h.get_by_label("Show a step").accesskit_node().is_disabled(), "no steps are left");

    h.get_by_label("Check").click();
    h.run();
    assert_eq!(h.get_all_by_label("Correct").count(), 2, "both boxes were filled by the steps");
    h.get_by_label_contains("0 correct of 1 tried");
}

#[test]
fn next_problem_starts_with_empty_boxes() {
    let mut h = harness();
    open_practice(&mut h, "Pre-K Math skills", "Practise A.1 Count up to 5");
    h.get_by_label_contains("Problem 1 of 2");
    h.get_by_label("Next problem").click();
    h.run();
    h.get_by_label_contains("Problem 2 of 2");
    h.get_by_label_contains("\u{2022} \u{2022} \u{2022} \u{2022} \u{2022}");
}

/// Draws every problem of every skill with all its worked steps showing and a check made.
/// egui panics on a character none of its fonts can draw, so this catches content that would
/// crash the window (a star from an icon font did, once).
#[test]
fn every_problem_and_step_in_the_catalog_can_be_drawn() {
    let catalog = match i_success_content::builtin() {
        Ok(c) => c,
        Err(e) => panic!("{e}"),
    };
    let mut drawn = 0;
    for skill in &catalog.skills {
        for index in 0..skill.problems.len() {
            let mut practice = i_success_engine::Practice::new(skill);
            for _ in 0..index {
                practice.next(skill);
            }
            while practice.show_step(skill) {}
            practice.check(skill);
            let mut app = App::new();
            app.set_screen(Screen::Practice(practice));
            let mut h = Harness::builder().with_size(egui::vec2(1280.0, 900.0)).build_ui_state(|ui, app: &mut App| app.show(ui), app);
            h.run();
            h.get_by_label("Worked steps");
            drawn += 1;
        }
    }
    assert!(drawn > 20, "drew {drawn} problems");
}

#[test]
fn the_wordmark_goes_home() {
    let mut h = harness();
    open_practice(&mut h, "Kindergarten Math skills", "Practise B.1 Add within 5");
    h.get_by_label("I-SUCCESS home").click();
    h.run();
    assert_eq!(h.state().screen(), &Screen::Home);
}

#[test]
fn a_broken_catalog_is_explained_not_shown_empty() {
    let mut h = Harness::builder()
        .with_size(egui::vec2(900.0, 600.0))
        .build_ui_state(|ui, app: &mut App| app.show(ui), App::with_catalog(Err("grade k does not exist".to_owned())));
    h.run();
    h.get_by_label("The practice catalog could not be loaded");
    h.get_by_label("grade k does not exist");
}
