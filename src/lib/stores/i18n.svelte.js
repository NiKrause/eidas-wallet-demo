/**
 * i18n store with automatic browser language detection.
 *
 * Detects browser language on first load (navigator.language),
 * falls back to 'en'. Persists selection in localStorage.
 *
 * Usage:
 *   import { t, locale } from '$lib/stores/i18n.svelte.js';
 *   <p>{t('issuance.title')}</p>
 *   <button onclick={() => locale.set('de')}>DE</button>
 */

const STORAGE_KEY = 'eidas_wallet_locale';

/** Detect browser language, default 'en' */
function detectLocale() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'de' || stored === 'en') return stored;
  } catch (_) { /* ignore */ }

  const lang = (navigator.language || '').slice(0, 2);
  if (lang === 'de') return 'de';
  return 'en';
}

const translations = {
  en: {
    // App shell
    'app.title': 'EUDI Wallet Demo',
    'app.badge': 'eIDAS 2.0',
    'app.loading': 'Loading…',

    // Navigation
    'nav.issuance': 'Issuance',
    'nav.wallet': 'Wallet',
    'nav.present': 'Present',
    'nav.verify': 'Verify',
    'nav.history': 'History',
    'nav.authority': 'Authority',

    // Issuance page
    'issuance.title': 'Issue Credential',
    'issuance.desc': 'Simulate the issuance of digital identity credentials into your EUDI Wallet. Select a credential type, fill in the attributes, and store it securely.',
    'issuance.select': 'Select the type of credential you want to issue:',
    'issuance.back': '← Back',
    'issuance.submit': 'Issue Credential',
    'issuance.submitting': 'Issuing…',
    'issuance.success.title': 'Credential Issued!',
    'issuance.success.desc': 'The credential has been successfully issued and stored in your wallet.',
    'issuance.success.view': 'View in Wallet',
    'issuance.success.again': 'Issue Another',
    'issuance.select_yes': '✓ Yes / True',
    'issuance.select_no': '✗ No / False',
    'issuance.select_placeholder': '— Select —',

    // Wallet page
    'wallet.title': 'My Wallet',
    'wallet.desc': 'Your digital identity credentials — issued and ready to present.',
    'wallet.total': 'Total',
    'wallet.empty.title': 'Wallet is empty',
    'wallet.empty.desc': 'No credentials yet. Issue your first credential to get started.',
    'wallet.empty.cta': '🪪 Issue Credential',
    'wallet.detail.title': 'Attributes',
    'wallet.detail.issuer': 'Issuer',
    'wallet.detail.issuedAt': 'Issued At',
    'wallet.detail.id': 'Credential ID',
    'wallet.detail.remove': '🗑️ Remove Credential',
    'wallet.detail.close': 'Close',
    'wallet.delete_confirm': 'Remove "{label}" from your wallet?',

    // Present page
    'present.title': 'Present Credential',
    'present.desc': 'Select which attributes to share and generate a QR code for a verifier.',
    'present.empty.title': 'No credentials to present',
    'present.empty.desc': 'Issue a credential first before you can present it.',
    'present.select_credential': 'Choose a credential to present:',
    'present.select_attrs': 'Choose which attributes to share:',
    'present.select_all': 'Select All',
    'present.deselect_all': 'Deselect All',
    'present.selected': '{count} attribute(s) selected',
    'present.select_hint': 'Select at least one attribute',
    'present.generate': '📲 Generate QR Code',
    'present.qr_title': 'Presentation QR Code',
    'present.qr_subtitle': 'Show this to the Verifier to share your selected attributes',
    'present.qr_shared': '{count} of {total} attributes shared',
    'present.qr_hint': 'The encoded data can be read by any compatible verifier',
    'present.qr_view': 'View raw JSON payload',
    'present.verify_hint': 'Same-browser test:',
    'present.verify_open': '✅ Open Verifier',
    'present.present_another': '← Present Another',
    'present.edit_selection': '← Edit Selection',

    // Verify page
    'verify.title': '🔍 Verifier',
    'verify.desc': 'Paste a presentation QR data to verify the attributes.',
    'verify.placeholder': 'Paste the JSON data from the QR code here…',
    'verify.btn': '✅ Verify',
    'verify.clear': 'Clear',
    'verify.sample': '📋 Load Sample Data',
    'verify.error.empty': 'Please enter or paste the JSON data.',
    'verify.error.format': 'Invalid format: missing "format" or "attributes" field.',
    'verify.error.unknown': 'Unknown format: "{format}". Expected "eidas-wallet-demo-v1".',
    'verify.error.json': 'Invalid JSON: {error}',
    'verify.success.title': 'Verification Successful',
    'verify.success.subtitle': 'Presentation data validated successfully',
    'verify.result.credential': 'Credential',
    'verify.result.type': 'Type',
    'verify.result.issuer': 'Issuer',
    'verify.result.issued': 'Issued',
    'verify.result.presented': 'Presented',
    'verify.result.attributes': 'Attributes',
    'verify.result.shared': '{count} of {total} shared',
    'verify.result.received': '📋 Received Attributes',
    'verify.another': '← Verify Another',

    // History page
    'history.title': 'History',
    'history.desc': 'Chronological log of all credential presentations and verifications.',
    'history.empty.title': 'No presentations yet',
    'history.empty.desc': 'When you present credentials to a verifier, the activity will be logged here.',
    'history.export': '📥 Export',
    'history.clear': '🗑️ Clear',
    'history.confirm': 'Confirm Clear All',
    'history.cancel': 'Cancel',
    'history.detail.title': 'Presentation Details',
    'history.detail.status': 'Status',
    'history.detail.success': '✅ Successful',
    'history.detail.presented': 'Presented At',
    'history.detail.verifier': 'Verifier',
    'history.detail.shared': '📋 Shared Attributes',
    'history.detail.count': '{count} attribute(s)',
    'history.detail.no_attrs': 'No attribute details available.',
    'history.detail.raw': 'View raw entry data',
    'history.detail.close': 'Close',

    // Authority / Revocation
    'authority.title': '🏛️ Authority Dashboard',
    'authority.desc': 'Simulated issuing authority. View all issued credentials and revoke or reinstate them to demonstrate the revocation lifecycle.',
    'authority.active': 'Active',
    'authority.revoked': 'Revoked',
    'authority.empty.title': 'No credentials issued',
    'authority.empty.desc': 'Issue credentials from the Issuance page first, then manage them here.',
    'authority.revoke_btn': '🔴 Revoke',
    'authority.reinstate_btn': '✅ Reinstate',
    'authority.revoked_badge': '🔴 REVOKED',
    'authority.revoke_modal.title': 'Revoke Credential',
    'authority.revoke_modal.desc': 'Select a reason for revoking this credential. Once revoked, it will fail verification when presented.',
    'authority.revoke_modal.reason': 'Reason for revocation:',
    'authority.reinstate_modal.title': 'Reinstate Credential',
    'authority.reinstate_modal.desc': 'This will restore the credential to active status. It will pass verification again.',
    'revocation.stolen': 'Device reported stolen',
    'revocation.lost': 'Device or eID card lost',
    'revocation.identity_change': 'Identity data changed (name, nationality, etc.)',
    'revocation.expired': 'Credential expired',
    'revocation.administrative': 'Administrative revocation (authority decision)',
    'revocation.fraud': 'Fraud or misuse detected',

    // Verification – revoked state
    'verify.result.revoked': '🔴 Credential Revoked',
    'verify.result.revoked_subtitle': 'This credential was revoked by the issuing authority and is no longer valid.',
    'verify.result.revoked_reason': 'Revocation Reason',
    'verify.result.revoked_at': 'Revoked At',
    'verify.result.revoked_by': 'Revoked By',
    'verify.result.revoked_shared_attr': 'Attributes presented before revocation',

    // Wallet – revoked status
    'wallet.revoked_badge': 'REVOKED',
    'wallet.revoked_detail': 'This credential has been revoked by the issuing authority.',
    'wallet.revoked_present_blocked': 'Cannot present revoked credentials',

    // Present – revocation block
    'present.revoked_warning': '🔴 This credential has been revoked and cannot be presented.',
    'present.revoked_verifier': '🔴 Credential is revoked — presentation rejected',

    // Language
    'lang.en': 'English',
    'lang.de': 'Deutsch',
  },

  de: {
    // App shell
    'app.title': 'EUDI Wallet Demo',
    'app.badge': 'eIDAS 2.0',
    'app.loading': 'Lade…',

    // Navigation
    'nav.issuance': 'Ausstellen',
    'nav.wallet': 'Wallet',
    'nav.present': 'Teilen',
    'nav.verify': 'Prüfen',
    'nav.history': 'Verlauf',
    'nav.authority': 'Behörde',

    // Issuance page
    'issuance.title': 'Credential ausstellen',
    'issuance.desc': 'Simuliere die Ausstellung digitaler Identitätsdaten in deine EUDI Wallet. Wähle einen Credential-Typ, fülle die Attribute aus und speichere sie sicher.',
    'issuance.select': 'Wähle den Typ des auszustellenden Credentials:',
    'issuance.back': '← Zurück',
    'issuance.submit': 'Credential ausstellen',
    'issuance.submitting': 'Stelle aus…',
    'issuance.success.title': 'Credential ausgestellt!',
    'issuance.success.desc': 'Das Credential wurde erfolgreich ausgestellt und in deiner Wallet gespeichert.',
    'issuance.success.view': 'In Wallet anzeigen',
    'issuance.success.again': 'Weiteres ausstellen',
    'issuance.select_yes': '✓ Ja / Wahr',
    'issuance.select_no': '✗ Nein / Falsch',
    'issuance.select_placeholder': '— Auswählen —',

    // Wallet page
    'wallet.title': 'Meine Wallet',
    'wallet.desc': 'Deine digitalen Identitätsdaten – ausgestellt und bereit zum Teilen.',
    'wallet.total': 'Gesamt',
    'wallet.empty.title': 'Wallet ist leer',
    'wallet.empty.desc': 'Noch keine Credentials. Stelle dein erstes Credential aus.',
    'wallet.empty.cta': '🪪 Credential ausstellen',
    'wallet.detail.title': 'Attribute',
    'wallet.detail.issuer': 'Aussteller',
    'wallet.detail.issuedAt': 'Ausgestellt am',
    'wallet.detail.id': 'Credential-ID',
    'wallet.detail.remove': '🗑️ Credential entfernen',
    'wallet.detail.close': 'Schließen',
    'wallet.delete_confirm': '"{label}" aus deiner Wallet entfernen?',

    // Present page
    'present.title': 'Credential teilen',
    'present.desc': 'Wähle aus, welche Attribute geteilt werden sollen, und generiere einen QR-Code für einen Verifier.',
    'present.empty.title': 'Keine Credentials zum Teilen',
    'present.empty.desc': 'Stelle zuerst ein Credential aus, bevor du es teilen kannst.',
    'present.select_credential': 'Wähle ein Credential zum Teilen:',
    'present.select_attrs': 'Wähle die zu teilenden Attribute:',
    'present.select_all': 'Alle auswählen',
    'present.deselect_all': 'Alle abwählen',
    'present.selected': '{count} Attribut(e) ausgewählt',
    'present.select_hint': 'Wähle mindestens ein Attribut',
    'present.generate': '📲 QR-Code generieren',
    'present.qr_title': 'Präsentations-QR-Code',
    'present.qr_subtitle': 'Zeige diesen Code dem Verifier, um deine ausgewählten Attribute zu teilen',
    'present.qr_shared': '{count} von {total} Attributen geteilt',
    'present.qr_hint': 'Die kodierten Daten können von jedem kompatiblen Verifier gelesen werden',
    'present.qr_view': 'Rohdaten als JSON anzeigen',
    'present.verify_hint': 'Test im selben Browser:',
    'present.verify_open': '✅ Verifier öffnen',
    'present.present_another': '← Weiteres teilen',
    'present.edit_selection': '← Auswahl bearbeiten',

    // Verify page
    'verify.title': '🔍 Verifier',
    'verify.desc': 'Füge die JSON-Daten eines Präsentations-QR-Codes ein, um die Attribute zu prüfen.',
    'verify.placeholder': 'JSON-Daten aus dem QR-Code hier einfügen…',
    'verify.btn': '✅ Prüfen',
    'verify.clear': 'Löschen',
    'verify.sample': '📋 Beispieldaten laden',
    'verify.error.empty': 'Bitte JSON-Daten eingeben oder einfügen.',
    'verify.error.format': 'Ungültiges Format: "format" oder "attributes" fehlt.',
    'verify.error.unknown': 'Unbekanntes Format: "{format}". Erwartet "eidas-wallet-demo-v1".',
    'verify.error.json': 'Ungültiges JSON: {error}',
    'verify.success.title': 'Prüfung erfolgreich',
    'verify.success.subtitle': 'Präsentationsdaten erfolgreich validiert',
    'verify.result.credential': 'Credential',
    'verify.result.type': 'Typ',
    'verify.result.issuer': 'Aussteller',
    'verify.result.issued': 'Ausgestellt',
    'verify.result.presented': 'Präsentiert',
    'verify.result.attributes': 'Attribute',
    'verify.result.shared': '{count} von {total} geteilt',
    'verify.result.received': '📋 Erhaltene Attribute',
    'verify.another': '← Weitere Prüfung',

    // History page
    'history.title': 'Verlauf',
    'history.desc': 'Chronologischer Verlauf aller Präsentationen und Prüfungen.',
    'history.empty.title': 'Noch keine Präsentationen',
    'history.empty.desc': 'Wenn du Credentials an einen Verifier weitergibst, wird die Aktivität hier protokolliert.',
    'history.export': '📥 Exportieren',
    'history.clear': '🗑️ Löschen',
    'history.confirm': 'Wirklich alle löschen?',
    'history.cancel': 'Abbrechen',
    'history.detail.title': 'Präsentationsdetails',
    'history.detail.status': 'Status',
    'history.detail.success': '✅ Erfolgreich',
    'history.detail.presented': 'Präsentiert am',
    'history.detail.verifier': 'Verifier',
    'history.detail.shared': '📋 Geteilte Attribute',
    'history.detail.count': '{count} Attribut(e)',
    'history.detail.no_attrs': 'Keine Attributdetails verfügbar.',
    'history.detail.raw': 'Rohdaten anzeigen',
    'history.detail.close': 'Schließen',

    // Authority / Revocation (DE)
    'authority.title': '🏛️ Behörden-Dashboard',
    'authority.desc': 'Simulierte Ausstellungsbehörde. Alle ausgestellten Credentials anzeigen, widerrufen oder wiederherstellen.',
    'authority.active': 'Aktiv',
    'authority.revoked': 'Widerrufen',
    'authority.empty.title': 'Keine Credentials ausgestellt',
    'authority.empty.desc': 'Stelle zuerst Credentials auf der Ausstellungsseite aus.',
    'authority.revoke_btn': '🔴 Widerrufen',
    'authority.reinstate_btn': '✅ Wiederherstellen',
    'authority.revoked_badge': '🔴 WIDERRUFEN',
    'authority.revoke_modal.title': 'Credential widerrufen',
    'authority.revoke_modal.desc': 'Wähle einen Grund für den Widerruf. Nach dem Widerruf schlägt die Prüfung fehl.',
    'authority.revoke_modal.reason': 'Grund des Widerrufs:',
    'authority.reinstate_modal.title': 'Credential wiederherstellen',
    'authority.reinstate_modal.desc': 'Das Credential wird wieder als aktiv markiert und kann erneut geprüft werden.',
    'revocation.stolen': 'Gerät als gestohlen gemeldet',
    'revocation.lost': 'Gerät oder eID-Karte verloren',
    'revocation.identity_change': 'Identitätsdaten geändert (Name, Nationalität, etc.)',
    'revocation.expired': 'Credential abgelaufen',
    'revocation.administrative': 'Administrativer Widerruf (Behördenentscheidung)',
    'revocation.fraud': 'Betrug oder Missbrauch festgestellt',

    // Verification – revoked state (DE)
    'verify.result.revoked': '🔴 Credential widerrufen',
    'verify.result.revoked_subtitle': 'Dieses Credential wurde von der ausstellenden Behörde widerrufen und ist nicht mehr gültig.',
    'verify.result.revoked_reason': 'Widerrufsgrund',
    'verify.result.revoked_at': 'Widerrufen am',
    'verify.result.revoked_by': 'Widerrufen von',
    'verify.result.revoked_shared_attr': 'Vor dem Widerruf geteilte Attribute',

    // Wallet – revoked status (DE)
    'wallet.revoked_badge': 'WIDERRUFEN',
    'wallet.revoked_detail': 'Dieses Credential wurde von der ausstellenden Behörde widerrufen.',
    'wallet.revoked_present_blocked': 'Widerrufene Credentials können nicht geteilt werden',

    // Present – revocation block (DE)
    'present.revoked_warning': '🔴 Dieses Credential wurde widerrufen und kann nicht geteilt werden.',
    'present.revoked_verifier': '🔴 Credential ist widerrufen — Präsentation abgelehnt',

    // Language
    'lang.en': 'English',
    'lang.de': 'Deutsch',
  },
};

function createI18nStore() {
  let _locale = $state(detectLocale());

  /**
   * Translate a key, optionally with interpolation values.
   * Interpolation: t('key', { count: 5 }) replaces {count} with 5
   */
  function t(key, vars = {}) {
    let text = translations[_locale]?.[key] || translations.en?.[key] || key;
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
    return text;
  }

  function setLocale(loc) {
    if (loc === 'de' || loc === 'en') {
      _locale = loc;
      try { localStorage.setItem(STORAGE_KEY, loc); } catch (_) { /* ignore */ }
    }
  }

  return {
    get locale() { return _locale; },
    t,
    setLocale,
  };
}

export const i18n = createI18nStore();
