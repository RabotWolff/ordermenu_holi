// HOLI-Wortmarke als CSS-Schrift (kein Logo-Asset, kein Markenzeichen verwendet).
export const HoliWordmark = ({ height = 38, withTagline = true }) => (
  <span className="inline-flex flex-col items-center leading-none">
    <span
      className="font-CaveatBrush"
      style={{
        color: 'var(--holi-purple)',
        fontSize: height,
        letterSpacing: '0.02em',
        transform: 'rotate(-2deg)',
      }}
    >
      HOLI
    </span>
    {withTagline && (
      <span
        className="font-CaveatBrush"
        style={{
          color: 'var(--holi-saffron)',
          fontSize: height * 0.32,
          marginTop: 2,
          letterSpacing: '0.04em',
        }}
      >
        brunch · currys · sweets
      </span>
    )}
  </span>
);
