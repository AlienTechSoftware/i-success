//! `cargo xtask license-check`: the licence and attribution texts this repository ships are all
//! present, unchanged since they were audited, and cover what they claim to cover.
//!
//! Modelled on PdfCraft's source licensing self-check (see `NOTICE`, Source provenance). It reads
//! `licenses.toml` and fails on:
//!
//! - a listed text that is missing, empty, not UTF-8, or whose SHA-256 differs from the audited one;
//! - a listed text, or a file it covers, whose path is absolute, climbs out with `..`, or is missing;
//! - the same text listed twice;
//! - `LICENSE-MIT`, `LICENSE-APACHE` or `NOTICE` not listed;
//! - a vendored script in `SKILLS/study-wb/lib/vendor/` that no listed text covers;
//! - a file under `assets/` that `ATTRIBUTION.md` does not name;
//! - a house-rules block in `AGENTS.md` whose text no longer matches the SHA-256 in its marker.
//!
//! It does not judge whether a licence is sufficient; a person does that when auditing a text.
//! `cargo xtask license-check --hashes` prints the current SHA-256 of every listed text, for
//! after a re-audit. Never update a hash only to make the check pass.

use serde::Deserialize;
use sha2::{Digest, Sha256};
use std::collections::BTreeSet;
use std::path::{Component, Path};

const MANIFEST: &str = "licenses.toml";
const REQUIRED: &[&str] = &["LICENSE-MIT", "LICENSE-APACHE", "NOTICE"];
const VENDOR_DIR: &str = "SKILLS/study-wb/lib/vendor";
const ASSETS_DIR: &str = "assets";
const ATTRIBUTION: &str = "ATTRIBUTION.md";
const AGENTS: &str = "AGENTS.md";
const RULES_START: &str = "<!-- craft-house-rules:start ";
const RULES_END: &str = "<!-- craft-house-rules:end -->";

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct Manifest {
    #[serde(rename = "text", default)]
    texts: Vec<Text>,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct Text {
    /// The licence or notice file, relative to the repository root.
    path: String,
    /// What the text applies to: repository-relative files or folders, or "." for the project.
    covers: Vec<String>,
    /// Where the audited text came from.
    source: String,
    /// SHA-256 of the file's bytes as audited, lowercase hex.
    sha256: String,
}

/// Runs the check and prints its findings. `true` when the repository passes.
pub fn check(root: &Path) -> bool {
    let problems = problems(root);
    if problems.is_empty() {
        println!("license-check: every licence text present and unchanged, every asset attributed");
        true
    } else {
        eprintln!("license-check: {} problem(s):", problems.len());
        for problem in &problems {
            eprintln!("  {problem}");
        }
        false
    }
}

/// Prints the current SHA-256 of every listed text, for a person to copy after re-auditing it.
pub fn print_hashes(root: &Path) -> bool {
    let manifest = match read_manifest(root) {
        Ok(m) => m,
        Err(problem) => {
            eprintln!("{problem}");
            return false;
        }
    };
    for text in &manifest.texts {
        match std::fs::read(root.join(&text.path)) {
            Ok(bytes) => println!("{}  {}", sha256_hex(&bytes), text.path),
            Err(error) => println!("(missing: {error})  {}", text.path),
        }
    }
    true
}

/// Every problem found, one message each. Empty when the repository passes.
fn problems(root: &Path) -> Vec<String> {
    let mut problems = Vec::new();
    let manifest = match read_manifest(root) {
        Ok(m) => m,
        Err(problem) => return vec![problem],
    };

    let mut seen = BTreeSet::new();
    for text in &manifest.texts {
        if !seen.insert(text.path.as_str()) {
            problems.push(format!("{MANIFEST}: {} is listed more than once", text.path));
        }
        if !safe(&text.path) {
            problems.push(format!("{MANIFEST}: {} is not a plain path inside the repository", text.path));
            continue;
        }
        if text.source.trim().is_empty() {
            problems.push(format!("{MANIFEST}: {} does not say where its text came from", text.path));
        }
        if text.covers.is_empty() {
            problems.push(format!("{MANIFEST}: {} covers nothing", text.path));
        }
        for covered in &text.covers {
            if !safe(covered) {
                problems.push(format!("{MANIFEST}: {} covers {covered}, which is not a plain path inside the repository", text.path));
            } else if !root.join(covered).exists() {
                problems.push(format!("{MANIFEST}: {} covers {covered}, which does not exist", text.path));
            }
        }
        match std::fs::read(root.join(&text.path)) {
            Err(_) => problems.push(format!("{}: missing", text.path)),
            Ok(bytes) if bytes.iter().all(u8::is_ascii_whitespace) => problems.push(format!("{}: empty", text.path)),
            Ok(bytes) if std::str::from_utf8(&bytes).is_err() => problems.push(format!("{}: not UTF-8 text", text.path)),
            Ok(bytes) => {
                let actual = sha256_hex(&bytes);
                if actual != text.sha256.to_ascii_lowercase() {
                    problems.push(format!("{}: changed since it was audited (sha256 {actual}, recorded {})", text.path, text.sha256));
                }
            }
        }
    }

    for required in REQUIRED {
        if !manifest.texts.iter().any(|t| t.path == *required) {
            problems.push(format!("{MANIFEST}: {required} is not listed"));
        }
    }

    for script in files(&root.join(VENDOR_DIR), false).iter().filter(|p| p.extension().is_some_and(|e| e == "js")) {
        let rel = relative(root, script);
        if !manifest.texts.iter().any(|t| t.covers.contains(&rel)) {
            problems.push(format!("{rel}: no licence text in {MANIFEST} covers it"));
        }
    }

    let attribution = std::fs::read_to_string(root.join(ATTRIBUTION)).unwrap_or_default();
    for asset in files(&root.join(ASSETS_DIR), true) {
        let rel = relative(root, &asset);
        if !attribution.contains(&format!("`{rel}`")) {
            problems.push(format!("{rel}: no row in {ATTRIBUTION}"));
        }
    }

    match std::fs::read_to_string(root.join(AGENTS)) {
        Ok(agents) => problems.extend(house_rules(&agents)),
        Err(_) => problems.push(format!("{AGENTS}: missing")),
    }
    problems
}

fn read_manifest(root: &Path) -> Result<Manifest, String> {
    let text = std::fs::read_to_string(root.join(MANIFEST)).map_err(|e| format!("{MANIFEST}: cannot be read: {e}"))?;
    toml::from_str(&text).map_err(|e| format!("{MANIFEST}: {e}"))
}

/// Checks each house-rules block in AGENTS.md against the SHA-256 in its start marker.
fn house_rules(agents: &str) -> Vec<String> {
    let mut problems = Vec::new();
    let mut blocks = 0;
    let mut rest = agents;
    while let Some(start) = rest.find(RULES_START) {
        blocks += 1;
        let after = rest.get(start..).unwrap_or_default();
        let Some(line_end) = after.find('\n') else {
            problems.push(format!("{AGENTS}: a house-rules start marker has nothing after it"));
            break;
        };
        let marker = after.get(..line_end).unwrap_or_default();
        let body_and_more = after.get(line_end + 1..).unwrap_or_default();
        let Some(end) = body_and_more.find(RULES_END) else {
            problems.push(format!("{AGENTS}: a house-rules block has no end marker"));
            break;
        };
        let body = body_and_more.get(..end).unwrap_or_default();
        let kind = marker.split_whitespace().nth(2).unwrap_or("?");
        match marker.split_whitespace().find_map(|w| w.strip_prefix("sha256=")) {
            Some(recorded) if recorded == sha256_hex(body.as_bytes()) => {}
            Some(_) => problems.push(format!("{AGENTS}: the {kind} house-rules block was edited; copy it again from its source")),
            None => problems.push(format!("{AGENTS}: the {kind} house-rules marker has no sha256")),
        }
        rest = body_and_more.get(end + RULES_END.len()..).unwrap_or_default();
    }
    if blocks == 0 {
        problems.push(format!("{AGENTS}: has no house-rules block"));
    }
    problems
}

/// A relative path that stays inside the repository: no root, no drive, no `..`.
fn safe(path: &str) -> bool {
    !path.is_empty() && Path::new(path).components().all(|c| matches!(c, Component::Normal(_) | Component::CurDir))
}

fn files(dir: &Path, recursive: bool) -> Vec<std::path::PathBuf> {
    let mut out = Vec::new();
    let Ok(entries) = std::fs::read_dir(dir) else { return out };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            if recursive {
                out.extend(files(&path, true));
            }
        } else {
            out.push(path);
        }
    }
    out.sort();
    out
}

fn relative(root: &Path, path: &Path) -> String {
    path.strip_prefix(root).unwrap_or(path).to_string_lossy().replace('\\', "/")
}

fn sha256_hex(bytes: &[u8]) -> String {
    Sha256::digest(bytes).iter().map(|b| format!("{b:02x}")).collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;

    /// A small repository that passes, in a fresh temporary folder.
    fn fixture(name: &str) -> PathBuf {
        let root = std::env::temp_dir().join(format!("xtask-licences-{name}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&root);
        fs::create_dir_all(root.join(VENDOR_DIR).join("licenses")).unwrap();
        fs::create_dir_all(root.join(ASSETS_DIR).join("brand")).unwrap();
        fs::write(root.join("LICENSE-MIT"), "MIT text").unwrap();
        fs::write(root.join("LICENSE-APACHE"), "Apache text").unwrap();
        fs::write(root.join("NOTICE"), "Notice text").unwrap();
        fs::write(root.join(VENDOR_DIR).join("lib.min.js"), "var x;").unwrap();
        fs::write(root.join(VENDOR_DIR).join("licenses").join("lib.LICENSE.txt"), "Lib licence").unwrap();
        fs::write(root.join(ASSETS_DIR).join("brand").join("logo.png"), [0u8, 1, 2]).unwrap();
        fs::write(root.join(ATTRIBUTION), "| `assets/brand/logo.png` | logo |").unwrap();
        let rules = "## House rules\n1. Be kind.\n";
        fs::write(
            root.join(AGENTS),
            format!("{RULES_START}core source=abc sha256={} -->\n{rules}{RULES_END}\n# Rest\n", sha256_hex(rules.as_bytes())),
        )
        .unwrap();
        let entry = |path: &str, covers: &str, text: &str| {
            format!("[[text]]\npath = \"{path}\"\ncovers = [\"{covers}\"]\nsource = \"test\"\nsha256 = \"{}\"\n\n", sha256_hex(text.as_bytes()))
        };
        let manifest = [
            entry("LICENSE-MIT", ".", "MIT text"),
            entry("LICENSE-APACHE", ".", "Apache text"),
            entry("NOTICE", ".", "Notice text"),
            entry(&format!("{VENDOR_DIR}/licenses/lib.LICENSE.txt"), &format!("{VENDOR_DIR}/lib.min.js"), "Lib licence"),
        ]
        .concat();
        fs::write(root.join(MANIFEST), manifest).unwrap();
        root
    }

    fn found(root: &Path, expected: &str) {
        let all = problems(root).join("\n");
        assert!(all.contains(expected), "expected {expected:?} in:\n{all}");
    }

    #[test]
    fn a_sound_repository_passes() {
        let root = fixture("sound");
        assert_eq!(problems(&root), Vec::<String>::new());
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn a_changed_licence_text_fails() {
        let root = fixture("changed");
        fs::write(root.join("LICENSE-MIT"), "MIT text, edited").unwrap();
        found(&root, "LICENSE-MIT: changed since it was audited");
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn a_missing_or_empty_text_fails() {
        let root = fixture("missing");
        fs::remove_file(root.join("NOTICE")).unwrap();
        fs::write(root.join("LICENSE-APACHE"), " \n").unwrap();
        found(&root, "NOTICE: missing");
        found(&root, "LICENSE-APACHE: empty");
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn a_vendored_script_without_a_licence_fails() {
        let root = fixture("vendor");
        fs::write(root.join(VENDOR_DIR).join("other.min.js"), "var y;").unwrap();
        found(&root, "lib/vendor/other.min.js: no licence text");
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn an_asset_without_attribution_fails() {
        let root = fixture("asset");
        fs::write(root.join(ASSETS_DIR).join("brand").join("new.png"), [9u8]).unwrap();
        found(&root, "assets/brand/new.png: no row in ATTRIBUTION.md");
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn an_edited_house_rules_block_fails() {
        let root = fixture("rules");
        let agents = fs::read_to_string(root.join(AGENTS)).unwrap().replace("Be kind.", "Be quick.");
        fs::write(root.join(AGENTS), agents).unwrap();
        found(&root, "the core house-rules block was edited");
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn unsafe_duplicate_or_unknown_entries_fail() {
        let root = fixture("unsafe");
        let mut manifest = fs::read_to_string(root.join(MANIFEST)).unwrap();
        manifest.push_str("[[text]]\npath = \"../outside.txt\"\ncovers = [\".\"]\nsource = \"x\"\nsha256 = \"00\"\n\n");
        manifest.push_str(&format!("[[text]]\npath = \"NOTICE\"\ncovers = [\".\"]\nsource = \"x\"\nsha256 = \"{}\"\n", sha256_hex(b"Notice text")));
        fs::write(root.join(MANIFEST), &manifest).unwrap();
        found(&root, "../outside.txt is not a plain path");
        found(&root, "NOTICE is listed more than once");
        fs::write(root.join(MANIFEST), manifest.replace("source = \"x\"", "source = \"x\"\ncolour = \"red\"")).unwrap();
        found(&root, "unknown field");
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn a_required_project_text_must_be_listed() {
        let root = fixture("required");
        let manifest = fs::read_to_string(root.join(MANIFEST)).unwrap();
        let without = manifest.split("\n\n").filter(|e| !e.contains("path = \"NOTICE\"")).collect::<Vec<_>>().join("\n\n");
        fs::write(root.join(MANIFEST), without).unwrap();
        found(&root, "NOTICE is not listed");
        let _ = fs::remove_dir_all(&root);
    }
}
