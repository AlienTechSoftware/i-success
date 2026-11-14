//! Pictures of the main screens, rendered offscreen with wgpu, for a person to look at.
//! Ignored by default, because it needs a GPU (or a software adapter):
//!
//!     cargo test -p i-success-ui-egui --test screens -- --ignored
//!
//! The pictures go to `target/screenshots/`. They are not compared with anything and are not
//! committed: they exist so a change to the look can be seen without opening the window.

// A test-only file: its helpers may stop the test when a picture cannot be made or saved.
#![allow(clippy::unwrap_used)]

use egui_kittest::Harness;
use egui_kittest::kittest::Queryable;
use i_success_ui_egui::App;
use std::path::PathBuf;

fn out_dir() -> PathBuf {
    let dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../target/screenshots");
    std::fs::create_dir_all(&dir).unwrap();
    dir
}

fn save(h: &mut Harness<'static, App>, name: &str) {
    let image = h.render().unwrap();
    let path = out_dir().join(format!("{name}.png"));
    image.save(&path).unwrap();
    println!("wrote {}", path.display());
}

fn harness() -> Harness<'static, App> {
    let mut h = Harness::builder().with_size(egui::vec2(1280.0, 860.0)).wgpu().build_ui_state(|ui, app: &mut App| app.show(ui), App::new());
    // Images load on the first frames; run until they are in.
    for _ in 0..10 {
        h.run();
    }
    h
}

#[test]
#[ignore = "renders with a GPU; run with --ignored"]
fn render_the_main_screens() {
    let mut h = harness();
    save(&mut h, "01-home");

    h.get_by_label("Grade 3 Math skills").click();
    h.run();
    save(&mut h, "02-grade");

    h.get_by_label("Practise E.1 Multiplication facts").click();
    h.run();
    h.get_by_label("Answer: Product").focus();
    h.run();
    h.get_by_label("Answer: Product").type_text("42");
    h.run();
    h.get_by_label("Check").click();
    h.run();
    h.get_by_label("Show a step").click();
    h.run();
    save(&mut h, "03-practice");
}
