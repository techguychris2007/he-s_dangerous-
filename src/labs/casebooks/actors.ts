/** Season 1 threat actors. Like a real intelligence picture, each actor reuses infrastructure and habits
 *  across episodes, so an indicator found in one case is a valid pivot in another. All infrastructure is
 *  fictional: `.example` domains and RFC 5737 documentation addresses. */

export const ASHEN_TIDE = {
  name: 'Ashen Tide',
  motive: 'Financially motivated intrusion and extortion crew',
  domains: {
    lure: 'clearance-docs.example',
    payload: 'cdn-updateservice.example',
    pay: 'freightpay-secure.example',
    exfil: 'storage-sync.example',
  },
  ips: { lure: '203.0.113.41', payload: '203.0.113.66', c2: '203.0.113.67', exfil: '203.0.113.90' },
  loader: 'tidesync.dll',
  userAgent: 'Mozilla/5.0 (compatible; TideSync/2.1)',
  ransomNote: 'RESTORE-HALCYON.txt',
} as const;

export const GLASS_HERON = {
  name: 'Glass Heron',
  motive: 'Long-dwell espionage focused on shipping manifests and customs data',
  domains: {
    phish: 'secure-login-portal.example',
    c2: 'heron-analytics.example',
    staging: 'cloudsync-backup.example',
  },
  ips: { phish: '198.51.100.23', c2: '198.51.100.24', staging: '198.51.100.140', operator: '198.51.100.77' },
  implant: 'heronsvc.exe',
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) HeronAgent/4.0',
} as const;

/** Commodity credential-stuffing infrastructure — many addresses, no tradecraft. */
export const stuffingIp = (n: number) => `198.51.100.${200 + (n % 50)}`;
