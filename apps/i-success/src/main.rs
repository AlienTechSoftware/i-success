// A GUI app on Windows in every profile: no console window beside it.
#![cfg_attr(target_os = "windows", windows_subsystem = "windows")]
//! I-SUCCESS desktop app: a native window over the practice catalog.
//!
//! Usage: `i-success`. Everything it shows is built in; it reads and writes no files yet.

use i_success_ui_egui::{App, ORANGUTAN_PNG};
use std::process::ExitCode;

struct Shell {
    app: App,
}

impl eframe::App for Shell {
    fn ui(&mut self, ui: &mut egui::Ui, _frame: &mut eframe::Frame) {
        self.app.show(ui);
    }
}

/// The window icon, decoded from the embedded orangutan. `None` if it cannot be decoded; the
/// window then opens with the system's default icon.
fn icon() -> Option<egui::IconData> {
    let img = image::load_from_memory(ORANGUTAN_PNG).ok()?.into_rgba8();
    let (width, height) = img.dimensions();
    Some(egui::IconData { rgba: img.into_raw(), width, height })
}

fn main() -> ExitCode {
    let mut viewport = egui::ViewportBuilder::default().with_inner_size([1280.0, 860.0]).with_min_inner_size([720.0, 520.0]).with_title("I-SUCCESS");
    if let Some(icon) = icon() {
        viewport = viewport.with_icon(icon);
    }
    let options = eframe::NativeOptions { viewport, ..Default::default() };
    let result = eframe::run_native(
        "I-SUCCESS",
        options,
        // The app installs egui's image loaders itself on its first frame.
        Box::new(|_cc| Ok(Box::new(Shell { app: App::new() }))),
    );
    match result {
        Ok(()) => ExitCode::SUCCESS,
        Err(error) => {
            // No console in a Windows release build; run from a terminal to see this.
            eprintln!("I-SUCCESS could not open its window: {error}");
            ExitCode::FAILURE
        }
    }
}
