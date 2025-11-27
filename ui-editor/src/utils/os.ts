export function getOS(): string {
  if (typeof window === 'undefined') return 'Unknown'; // Prevents SSR issues
  return detectOS();
}

function detectOS(): string {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const platform = window.navigator.platform.toLowerCase();

  if (platform.includes('mac')) return 'MacOS';
  if (platform.includes('win')) return 'Windows';
  if (platform.includes('linux')) return 'Linux';
  if (userAgent.includes('android')) return 'Android';
  if (/iphone|ipad|ipod/.test(userAgent)) return 'iOS';

  return 'Unknown';
}
