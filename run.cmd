@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"
REM I-SUCCESS: build and run the app with cargo, like the other Craft apps.
REM   .\run.cmd                      build (release) and run the I-SUCCESS app
REM   .\run.cmd ci                   every check: fmt, clippy, tests, names
REM   .\run.cmd coverage             line coverage with its floor (needs cargo-llvm-cov)
REM   .\run.cmd poc                  open the JavaScript proof-of-concept gallery in your browser
REM   .\run.cmd poc-open PAGE.html   open one proof-of-concept page
REM   .\run.cmd poc-build FILE.yaml  validate a proof-of-concept content file, then build its page
REM   .\run.cmd poc-verify [PAGE]    check one proof-of-concept page, or every example, in Chrome or Edge
REM   .\run.cmd poc-examples         rebuild every proof-of-concept example and its gallery data
REM   .\run.cmd poc-test             the proof-of-concept test suites
REM   .\run.cmd help                 show this list
REM Type .\run.cmd, not run.cmd: another run.cmd on PATH (nvm ships one) can win otherwise.
REM Proof-of-concept pages open from disk (file:///). No server is started.

:: The proof-of-concept scripts print symbols such as the minus sign; a Windows console fails on them otherwise.
set PYTHONUTF8=1
set "SW=%~dp0SKILLS\study-wb"
set "CMD=%~1"
if "%CMD%"=="" goto app

if /i "%CMD%"=="ci" goto ci
if /i "%CMD%"=="coverage" goto coverage
if /i "%CMD%"=="poc" goto poc
if /i "%CMD%"=="poc-open" goto poc_open
if /i "%CMD%"=="poc-build" goto poc_build
if /i "%CMD%"=="poc-verify" goto poc_verify
if /i "%CMD%"=="poc-examples" goto poc_examples
if /i "%CMD%"=="poc-test" goto poc_test
if /i "%CMD%"=="help" goto help
if /i "%CMD%"=="-h" goto help
if /i "%CMD%"=="--help" goto help
echo Unknown command: %CMD%
goto help_fail

:app
cargo run --release -p i-success
exit /b %errorlevel%

:ci
cargo xtask ci
exit /b %errorlevel%

:coverage
cargo xtask coverage
exit /b %errorlevel%

:poc
start "" "%SW%\examples\index.html"
exit /b 0

:poc_open
if "%~2"=="" (echo Usage: .\run.cmd poc-open PAGE.html & exit /b 2)
if not exist "%~2" (echo Not found: %~2 & exit /b 1)
start "" "%~f2"
exit /b 0

:poc_build
if "%~2"=="" (echo Usage: .\run.cmd poc-build FILE.yaml & exit /b 2)
python "%SW%\scripts\validate_study_data.py" "%~2" || exit /b 1
python "%SW%\scripts\build_study_aid.py" "%~2" || exit /b 1
exit /b 0

:poc_verify
if not "%~2"=="" (
  python "%SW%\scripts\verify_page.py" "%~2"
  exit /b !errorlevel!
)
set FAIL=0
for /d %%D in ("%SW%\examples\*") do (
  if exist "%%D\%%~nxD.html" (
    python "%SW%\scripts\verify_page.py" "%%D\%%~nxD.html" || set FAIL=1
  )
)
if "!FAIL!"=="1" (echo One or more pages failed. & exit /b 1)
echo All example pages passed.
exit /b 0

:poc_examples
set FAIL=0
for /d %%D in ("%SW%\examples\*") do (
  if exist "%%D\%%~nxD.yaml" (
    python "%SW%\scripts\build_study_aid.py" "%%D\%%~nxD.yaml" || set FAIL=1
  )
)
python "%SW%\scripts\build_examples_index.py" || set FAIL=1
if "!FAIL!"=="1" (echo One or more builds failed. & exit /b 1)
exit /b 0

:poc_test
set FAIL=0
node "%SW%\lib\workbench\TI-Nspire\cas.test.js" || set FAIL=1
python "%SW%\tests\test_build.py" || set FAIL=1
python "%SW%\tests\test_nspire_input.py" || set FAIL=1
python "%SW%\tests\test_study_kit_steps.py" || set FAIL=1
if "!FAIL!"=="1" (echo One or more test suites failed. & exit /b 1)
echo All test suites passed.
exit /b 0

:help
findstr /b /c:"REM " "%~f0"
exit /b 0

:help_fail
findstr /b /c:"REM " "%~f0"
exit /b 2
