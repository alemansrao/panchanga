import CredHero from './components/cred/CredHero';
import CredButton from './components/cred/CredButton';
import CredCard from './components/cred/CredCard';

export default function CredDemo() {
  return (
    <div className="min-h-screen px-6 py-10 bg-cred-surface">
      <CredHero title="Panchanga — CRED UI Demo" subtitle="Premium theme, motion and components" />

      <div className="max-w-5xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <CredCard title="Tithi Card">
          <div className="text-lg font-semibold">Tithi: Shukla Paksha</div>
          <div className="text-xs cred-subtle mt-2">A premium variant of the default card with tilt and glow.</div>
        </CredCard>

        <div className="flex items-center justify-center">
          <CredButton className="cred-cta">Magnetic CTA</CredButton>
        </div>

        <CredCard title="Nakshatra">
          <div className="text-lg font-semibold">Nakshatra: Rohini</div>
          <div className="text-xs cred-subtle mt-2">Example content to show card spacing and gradients.</div>
        </CredCard>
      </div>
    </div>
  );
}
