/** @typedef {'PID'|'QEAA'} CredentialType */
/** @typedef {'active'|'revoked'} CredentialStatus */

/** @typedef {Object} AttributeDef
 * @property {string} id
 * @property {string} label
 * @property {string} type
 * @property {string[]} [options]
 * @property {string} [placeholder]
 * @property {boolean} [required]
 */

/** @typedef {Object} CredentialTemplate
 * @property {CredentialType} type
 * @property {string} label
 * @property {string} icon
 * @property {string} description
 * @property {AttributeDef[]} attributes
 * @property {string} issuerLabel
 */

/** @typedef {Object} Credential
 * @property {string} id
 * @property {CredentialType} type
 * @property {string} label
 * @property {string} icon
 * @property {string} issuerLabel
 * @property {string} issuer
 * @property {string} issuedAt
 * @property {CredentialStatus} status
 * @property {string|null} revokedAt
 * @property {string|null} revocationReason
 * @property {Record<string, any>} attributes
 */

export const REVOCATION_REASONS = [
  { id: 'stolen',          label: 'Device reported stolen' },
  { id: 'lost',            label: 'Device or eID card lost' },
  { id: 'identity_change', label: 'Identity data changed (name, nationality, etc.)' },
  { id: 'expired',         label: 'Credential expired' },
  { id: 'administrative',  label: 'Administrative revocation (authority decision)' },
  { id: 'fraud',           label: 'Fraud or misuse detected' },
];

export const PID_TEMPLATE = {
  type: 'PID',
  label: 'Personal Identification Data',
  icon: '🆔',
  description: 'Your core identity data, equivalent to a national ID card',
  issuerLabel: 'National Identity Authority',
  attributes: [
    { id: 'given_name',       label: 'Given Name',       type: 'text', placeholder: 'Max', required: true },
    { id: 'family_name',      label: 'Family Name',      type: 'text', placeholder: 'Mustermann', required: true },
    { id: 'birth_date',       label: 'Date of Birth',    type: 'date', required: true },
    { id: 'nationality',      label: 'Nationality',      type: 'text', placeholder: 'DE', required: true },
    { id: 'birth_place',      label: 'Place of Birth',   type: 'text', placeholder: 'Berlin', required: false },
    { id: 'resident_address', label: 'Resident Address',  type: 'text', placeholder: 'Musterstr. 1, 10115 Berlin', required: false },
    { id: 'gender',           label: 'Gender',           type: 'select', options: ['', 'female', 'male', 'diverse', 'not specified'], required: false },
  ],
};

export const QEAA_TEMPLATES = [
  {
    type: 'QEAA',
    label: 'Age Verification',
    icon: '🔞',
    description: 'Verified age-related attributes for age-restricted services',
    issuerLabel: 'Federal Identity Authority',
    attributes: [
      { id: 'age_over_18',  label: 'Age ≥ 18',  type: 'boolean', required: true },
      { id: 'age_over_21',  label: 'Age ≥ 21',  type: 'boolean', required: true },
      { id: 'age_over_65',  label: 'Age ≥ 65',  type: 'boolean', required: false },
      { id: 'birth_date',   label: 'Date of Birth', type: 'date', required: true },
    ],
  },
  {
    type: 'QEAA',
    label: 'Professional License',
    icon: '💼',
    description: 'Verified professional qualifications and licenses',
    issuerLabel: 'Chamber of Commerce',
    attributes: [
      { id: 'profession',    label: 'Profession',    type: 'text', placeholder: 'Software Engineer', required: true },
      { id: 'license_id',    label: 'License ID',    type: 'text', placeholder: 'DE-12345-X', required: true },
      { id: 'issued_by',     label: 'Issued By',     type: 'text', placeholder: 'Berlin Chamber', required: true },
      { id: 'valid_until',   label: 'Valid Until',   type: 'date', required: true },
    ],
  },
  {
    type: 'QEAA',
    label: 'Educational Attestation',
    icon: '🎓',
    description: 'Verified educational degrees and certificates',
    issuerLabel: 'Ministry of Education',
    attributes: [
      { id: 'degree',        label: 'Degree',        type: 'text', placeholder: 'M.Sc. Computer Science', required: true },
      { id: 'institution',   label: 'Institution',   type: 'text', placeholder: 'TU Berlin', required: true },
      { id: 'graduation_date', label: 'Graduation Date', type: 'date', required: true },
      { id: 'degree_id',     label: 'Degree ID',     type: 'text', placeholder: 'DE-TUB-2024-001', required: false },
    ],
  },
];

export const ALL_TEMPLATES = [PID_TEMPLATE, ...QEAA_TEMPLATES];

export function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() :
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

export function createCredential(template, attributes, issuerName) {
  return {
    id: generateId(),
    type: template.type,
    label: template.label,
    icon: template.icon,
    issuerLabel: template.issuerLabel,
    issuer: issuerName || template.issuerLabel,
    issuedAt: new Date().toISOString(),
    status: 'active',
    revokedAt: null,
    revocationReason: null,
    attributes: { ...attributes },
  };
}
