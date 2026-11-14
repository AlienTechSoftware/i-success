//! Repository tasks.
//!
//!     cargo xtask ci       every check below, in order; stops at the first failure
//!     cargo xtask fmt      rustfmt, check only
//!     cargo xtask clippy   clippy on every target, warnings denied
//!     cargo xtask test     the whole workspace's tests
//!     cargo xtask names    no file names a product this project must not mention
//!     cargo xtask license-check   licence texts present and unchanged, assets attributed
//!                          (`--hashes` prints the current hashes, after a re-audit)
//!     cargo xtask coverage line coverage of the library crates; fails below the floor
//!
//! `coverage` is not part of `ci` because it rebuilds everything instrumented; CI runs it as its
//! own job. It needs `cargo-llvm-cov` (installing it is the developer's decision; CI installs a
//! pinned version). The window's `main.rs` and `xtask` are left out: one only opens the window,
//! the other is tooling. The report is printed, and `target/coverage/lcov.info` is written for
//! editors and CI.
//!
//! `names` reads every text file in the repository except build output, git's own folder and
//! vendored third-party code, and fails on a whole-word, case-insensitive match. The words are
//! assembled from letters below, so this file does not trip its own check.

mod licenses;

use std::path::{Path, PathBuf};
use std::process::{Command, ExitCode};

/// Folders `names` does not read: build output, git, and vendored third-party libraries.
const SKIP_DIRS: &[&str] = &["target", ".git", "vendor", "__pycache__", "node_modules"];
/// File types that are not text.
const BINARY: &[&str] = &["png", "jpg", "jpeg", "gif", "ico", "ttf", "otf", "woff", "woff2", "pdf", "zip", "exe", "dll", "pdb"];

/// The lowest line coverage `coverage` accepts, in percent. Measured at 95.3% on 2026-11-13;
/// the floor leaves room for small changes and catches a real drop. Raise it, never lower it
/// to make a change pass.
const COVERAGE_FLOOR_LINES: u32 = 90;
/// Files `coverage` leaves out (a regex over paths, either slash).
const COVERAGE_IGNORE: &str = r"(apps[/\\]|xtask[/\\])";

fn forbidden() -> Vec<String> {
    vec![["i", "x", "l"].concat()]
}

fn main() -> ExitCode {
    let task = std::env::args().nth(1).unwrap_or_default();
    let root = repo_root();
    let ok = match task.as_str() {
        "ci" => ["fmt", "clippy", "test", "names", "license-check"].iter().all(|t| run_task(t, &root)),
        "license-check" if std::env::args().nth(2).as_deref() == Some("--hashes") => licenses::print_hashes(&root),
        "fmt" | "clippy" | "test" | "names" | "license-check" | "coverage" => run_task(&task, &root),
        _ => {
            eprintln!("usage: cargo xtask <ci | fmt | clippy | test | names | license-check [--hashes] | coverage>");
            return ExitCode::from(2);
        }
    };
    if ok {
        if task == "ci" {
            println!("ci: all checks passed");
        }
        ExitCode::SUCCESS
    } else {
        ExitCode::FAILURE
    }
}

fn repo_root() -> PathBuf {
    let here = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    here.parent().map_or(here.clone(), Path::to_path_buf)
}

fn run_task(task: &str, root: &Path) -> bool {
    println!("== {task}");
    match task {
        "fmt" => cargo(root, &["fmt", "--all", "--", "--check"]),
        "clippy" => cargo(root, &["clippy", "--workspace", "--all-targets", "--", "-D", "warnings"]),
        "test" => cargo(root, &["test", "--workspace"]),
        "names" => names(root),
        "license-check" => licenses::check(root),
        "coverage" => coverage(root),
        _ => false,
    }
}

fn coverage(root: &Path) -> bool {
    let cargo_bin = std::env::var("CARGO").unwrap_or_else(|_| "cargo".to_owned());
    let installed = Command::new(&cargo_bin).args(["llvm-cov", "--version"]).output().is_ok_and(|o| o.status.success());
    if !installed {
        eprintln!("coverage needs cargo-llvm-cov, which is not installed.");
        eprintln!("Install it (a download; your decision): cargo install cargo-llvm-cov --locked");
        return false;
    }
    let out = root.join("target").join("coverage");
    if let Err(error) = std::fs::create_dir_all(&out) {
        eprintln!("could not create {}: {error}", out.display());
        return false;
    }
    let lcov = out.join("lcov.info");
    let lcov = lcov.to_string_lossy();
    let floor = COVERAGE_FLOOR_LINES.to_string();
    // One instrumented run; the second call only reports from its data.
    cargo(root, &["llvm-cov", "--workspace", "--no-report"])
        && cargo(root, &["llvm-cov", "report", "--ignore-filename-regex", COVERAGE_IGNORE, "--lcov", "--output-path", &lcov])
        && cargo(root, &["llvm-cov", "report", "--ignore-filename-regex", COVERAGE_IGNORE, "--summary-only", "--fail-under-lines", &floor])
}

fn cargo(root: &Path, args: &[&str]) -> bool {
    let cargo = std::env::var("CARGO").unwrap_or_else(|_| "cargo".to_owned());
    match Command::new(cargo).args(args).current_dir(root).status() {
        Ok(status) => status.success(),
        Err(error) => {
            eprintln!("could not run cargo {}: {error}", args.join(" "));
            false
        }
    }
}

fn names(root: &Path) -> bool {
    let words = forbidden();
    let mut files = Vec::new();
    collect(root, &mut files);
    let mut hits = Vec::new();
    for file in &files {
        let Ok(text) = std::fs::read_to_string(file) else { continue };
        for (n, line) in text.lines().enumerate() {
            if words.iter().any(|w| contains_word(line, w)) {
                let shown = file.strip_prefix(root).unwrap_or(file);
                hits.push(format!("{}:{}", shown.display(), n + 1));
            }
        }
    }
    if hits.is_empty() {
        println!("names: {} text files, no forbidden name", files.len());
        true
    } else {
        eprintln!("names: a forbidden name appears in {} line(s):", hits.len());
        for hit in hits {
            eprintln!("  {hit}");
        }
        false
    }
}

fn collect(dir: &Path, out: &mut Vec<PathBuf>) {
    let Ok(entries) = std::fs::read_dir(dir) else { return };
    for entry in entries.flatten() {
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().into_owned();
        if path.is_dir() {
            if !SKIP_DIRS.contains(&name.as_str()) {
                collect(&path, out);
            }
        } else {
            let ext = path.extension().map(|e| e.to_string_lossy().to_lowercase()).unwrap_or_default();
            if !BINARY.contains(&ext.as_str()) {
                out.push(path);
            }
        }
    }
}

/// Whether `word` appears in `line` as a whole word, ignoring ASCII case. A word boundary is
/// anything that is not a letter or a digit.
fn contains_word(line: &str, word: &str) -> bool {
    let line = line.to_ascii_lowercase();
    let word = word.to_ascii_lowercase();
    let mut from = 0;
    while let Some(found) = line.get(from..).and_then(|rest| rest.find(&word)) {
        let start = from + found;
        let end = start + word.len();
        let before = line.get(..start).and_then(|s| s.chars().next_back());
        let after = line.get(end..).and_then(|s| s.chars().next());
        let edge = |c: Option<char>| c.is_none_or(|c| !c.is_alphanumeric());
        if edge(before) && edge(after) {
            return true;
        }
        from = start + word.len().max(1);
    }
    false
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn whole_words_only() {
        let w = forbidden().remove(0);
        let up = w.to_uppercase();
        assert!(contains_word(&format!("a clone of {up}."), &w));
        assert!(contains_word(&format!("({w})"), &w));
        assert!(contains_word(&format!("no-{w}"), &w), "a hyphen is a boundary");
        assert!(contains_word(&w, &w));
        assert!(!contains_word(&format!("pre{w}post"), &w), "inside a longer word");
        assert!(!contains_word(&format!("{w}2"), &w), "a digit continues the word");
        assert!(!contains_word("nothing here", &w));
    }

    #[test]
    fn the_scan_finds_a_planted_name_and_skips_vendor_and_binaries() {
        let dir = std::env::temp_dir().join(format!("xtask-names-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(dir.join("vendor")).unwrap();
        let w = forbidden().remove(0);
        std::fs::write(dir.join("clean.md"), "nothing to see").unwrap();
        std::fs::write(dir.join("vendor").join("lib.js"), format!("var {w} = 1;")).unwrap();
        std::fs::write(dir.join("logo.png"), w.as_str()).unwrap();
        assert!(names(&dir), "vendor and binary files are not read");
        std::fs::write(dir.join("readme.md"), format!("Like {w}, but open.")).unwrap();
        assert!(!names(&dir), "a planted name is found");
        let _ = std::fs::remove_dir_all(&dir);
    }
}
