/**
 * Prayer calculation methods by region/country.
 * Different Muslim communities worldwide use different calculation methods.
 * @see https://github.com/batoulapps/adhan-js#calculation-parameters
 */
export type CalculationMethodId =
  | 'MuslimWorldLeague'
  | 'Egyptian'
  | 'Karachi'
  | 'UmmAlQura'
  | 'Dubai'
  | 'MoonsightingCommittee'
  | 'NorthAmerica'
  | 'Kuwait'
  | 'Qatar'
  | 'Singapore'
  | 'Tehran'
  | 'Turkey'
  | 'Jafari'
  | 'Other';

export type MadhabId = 'Shafi' | 'Hanafi';

/**
 * The broad school of Islamic jurisprudence.
 * Determines which prayer method / fiqh-aware content is shown.
 */
export type FiqhSchool = 'sunni' | 'shia';

export const CALCULATION_METHODS: {
  id: CalculationMethodId;
  label: string;
  region: string;
}[] = [
  { id: 'MuslimWorldLeague', label: 'Muslim World League', region: 'Europe, Far East, Americas' },
  { id: 'Egyptian', label: 'Egyptian', region: 'Africa, Syria, Iraq, Lebanon, Malaysia' },
  { id: 'Karachi', label: 'University of Islamic Sciences, Karachi', region: 'Pakistan, Bangladesh, India' },
  { id: 'UmmAlQura', label: 'Umm Al-Qura', region: 'Saudi Arabia' },
  { id: 'Dubai', label: 'Dubai', region: 'UAE' },
  { id: 'MoonsightingCommittee', label: 'Moonsighting Committee', region: 'North America' },
  { id: 'NorthAmerica', label: 'Islamic Society of North America', region: 'North America' },
  { id: 'Kuwait', label: 'Kuwait', region: 'Kuwait' },
  { id: 'Qatar', label: 'Qatar', region: 'Qatar' },
  { id: 'Singapore', label: 'Singapore', region: 'Singapore' },
  { id: 'Tehran', label: 'Institute of Geophysics, Tehran', region: 'Iran' },
  { id: 'Turkey', label: 'Turkey', region: 'Turkey' },
  { id: 'Jafari', label: 'Jafari / Shia (Leva Research Institute, Qum)', region: 'Global Shia communities' },
  { id: 'Other', label: 'Other', region: 'Custom' },
];

export const MADHABS: { id: MadhabId; label: string; region: string }[] = [
  { id: 'Shafi', label: 'Shafiʻi, Maliki, Hanbali', region: 'Most of Middle East, South Asia, Southeast Asia' },
  { id: 'Hanafi', label: 'Hanafi', region: 'South Asia, Central Asia, Turkey' },
];
