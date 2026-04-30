import { LegalLayout } from '../components/LegalLayout';

// Platzhalter: vor Go-Live durch finalen Anbieter-Text (Impressumspflicht
// nach §5 TMG) ersetzen.
export default function ImpressumPage() {
  return (
    <LegalLayout title="Impressum">
      <p>
        Hier steht das Impressum. Vor Inbetriebnahme die vom Betreiber gestellten
        Pflichtangaben einfügen.
      </p>
    </LegalLayout>
  );
}
