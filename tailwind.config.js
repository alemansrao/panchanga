/** Tailwind config extended for CRED-inspired theme tokens */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'cred-bg': '#0A0A0A',
        'cred-surface': '#111111',
        'cred-card': '#151515',
        'cred-accent': '#FFFFFF',
        'cred-accent-2': '#A8F0FF'
      },
      borderRadius: {
        'cred': '24px',
        'btn': '16px'
      },
      boxShadow: {
        'cred-lg': '0 18px 60px rgba(0,0,0,0.7)'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      }
    }
  },
  plugins: []
}
