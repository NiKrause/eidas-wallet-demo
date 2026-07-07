## 🧪 E2E Test Results

✅ **All Tests Complete**

| Status | Count |
|--------|-------|
| 🎯 **Total** | **13** |
| ✅ **Passed** | **13** |
| ⏱ **Duration** | **31.2s** |

### ✅ `e2e.spec.js`

| Ergebnis | Test | Dauer | Screenshots |
|:--------:|------|:-----:|:-----------:|
| ✅ | Test 1: Issuance – Issue a PID credential          |      0ms | <a href="test-results/screenshots/test1-credential-issued.png">📸 Credential Issued</a><br><a href="test-results/screenshots/test1-form-filled.png">📸 Form Filled</a><br><a href="test-results/screenshots/test1-start-issuance-form.png">📸 Start Issuance Form</a> |
| ✅ | Test 2: Issuance – Issue a QEAA (Age Verification) |      0ms | <a href="test-results/screenshots/test2-credential-issued.png">📸 Credential Issued</a><br><a href="test-results/screenshots/test2-form-filled.png">📸 Form Filled</a><br><a href="test-results/screenshots/test2-start-issuance.png">📸 Start Issuance</a> |
| ✅ | Test 3: Wallet – Display credentials and show de.. |      0ms | <a href="test-results/screenshots/test3-credential-detail.png">📸 Credential Detail</a><br><a href="test-results/screenshots/test3-wallet-overview.png">📸 Wallet Overview</a> |
| ✅ | Test 4: Wallet – Delete a credential               |      0ms | <a href="test-results/screenshots/test4-wallet-before-delete.png">📸 Wallet Before Delete</a><br><a href="test-results/screenshots/test4-wallet-empty.png">📸 Wallet Empty</a> |
| ✅ | Test 5: Presentation – Select attributes and gen.. |      0ms | <a href="test-results/screenshots/test5-attributes-selected.png">📸 Attributes Selected</a><br><a href="test-results/screenshots/test5-credential-selection.png">📸 Credential Selection</a><br><a href="test-results/screenshots/test5-qr-code.png">📸 Qr Code</a> |
| ✅ | Test 6: Verifier – Validate JSON payload           |      0ms | <a href="test-results/screenshots/test6-sample-loaded.png">📸 Sample Loaded</a><br><a href="test-results/screenshots/test6-verification-result.png">📸 Verification Result</a><br><a href="test-results/screenshots/test6-verifier-empty.png">📸 Verifier Empty</a> |
| ✅ | Test 7: History – Check entry and clear all        |      0ms | <a href="test-results/screenshots/test7-history-detail.png">📸 History Detail</a><br><a href="test-results/screenshots/test7-history-empty.png">📸 History Empty</a><br><a href="test-results/screenshots/test7-history-overview.png">📸 History Overview</a> |
| ✅ | Test 8: Full Flow – Complete lifecycle simulation  |      0ms | <a href="test-results/screenshots/test8-step1-issuance-start.png">📸 Step1 Issuance Start</a><br><a href="test-results/screenshots/test8-step1-pid-issued.png">📸 Step1 Pid Issued</a><br><a href="test-results/screenshots/test8-step2-qeaa-issued.png">📸 Step2 Qeaa Issued</a><br><a href="test-results/screenshots/test8-step3-wallet.png">📸 Step3 Wallet</a><br><a href="test-results/screenshots/test8-step4-qr.png">📸 Step4 Qr</a><br><a href="test-results/screenshots/test8-step5-verify.png">📸 Step5 Verify</a> |

### ✅ `revocation.spec.js`

| Ergebnis | Test | Dauer | Screenshots |
|:--------:|------|:-----:|:-----------:|
| ✅ | R1: Revoke a credential via Authority Dashboard    |      0ms | <a href="test-results/screenshots/r1-authority-overview.png">📸 Authority Overview</a><br><a href="test-results/screenshots/r1-pid-issued.png">📸 Pid Issued</a><br><a href="test-results/screenshots/r1-revoke-modal.png">📸 Revoke Modal</a><br><a href="test-results/screenshots/r1-revoked.png">📸 Revoked</a> |
| ✅ | R2: Wallet shows REVOKED status                    |      0ms | <a href="test-results/screenshots/r2-revoked-detail.png">📸 Revoked Detail</a><br><a href="test-results/screenshots/r2-wallet-revoked.png">📸 Wallet Revoked</a> |
| ✅ | R3: Present blocks revoked credentials             |      0ms | <a href="test-results/screenshots/r3-present-revoked-list.png">📸 Present Revoked List</a><br><a href="test-results/screenshots/r3-revoked-warning.png">📸 Revoked Warning</a> |
| ✅ | R4: Verify shows revoked credential status         |      0ms | <a href="test-results/screenshots/r4-revoked-verify.png">📸 Revoked Verify</a><br><a href="test-results/screenshots/r4-verify-empty.png">📸 Verify Empty</a> |
| ✅ | R5: Full Revocation Lifecycle                      |      0ms | <a href="test-results/screenshots/r5-step1-pid-issued.png">📸 Step1 Pid Issued</a><br><a href="test-results/screenshots/r5-step2-qeaa-issued.png">📸 Step2 Qeaa Issued</a><br><a href="test-results/screenshots/r5-step3-authority-2-creds.png">📸 Step3 Authority 2 Creds</a><br><a href="test-results/screenshots/r5-step4-one-revoked.png">📸 Step4 One Revoked</a><br><a href="test-results/screenshots/r5-step5-wallet-mixed.png">📸 Step5 Wallet Mixed</a><br><a href="test-results/screenshots/r5-step6-reinstate-modal.png">📸 Step6 Reinstate Modal</a> |

### 💡 Screenshots

Screenshots werden als **GitHub Actions Artefakte** gespeichert.
Lade das Artefakt **test-screenshots** herunter, um alle Bilder zu sehen.

---
*🧪 Playwright • Chromium • 13 tests • 31.2s*