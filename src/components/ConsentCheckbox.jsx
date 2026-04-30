export const ConsentCheckbox = ({ checked, onToggle, label }) => (
  <button
    type="button"
    onClick={onToggle}
    className="flex items-start gap-2.5 px-3.5 py-3 rounded-2xl cursor-pointer text-left w-full"
    style={{
      background: 'white',
      border: `1px solid ${checked ? 'var(--holi-purple)' : 'rgba(109,40,217,0.15)'}`,
    }}
  >
    <span
      className="rounded-md inline-flex items-center justify-center text-[13px] font-bold flex-shrink-0 mt-px"
      style={{
        width: 20,
        height: 20,
        border: `2px solid ${checked ? 'var(--holi-purple)' : 'rgba(109,40,217,0.3)'}`,
        background: checked ? 'var(--holi-purple)' : 'white',
        color: 'white',
      }}
    >
      {checked ? '✓' : ''}
    </span>
    <span
      className="text-[12.5px] leading-snug"
      style={{ color: 'var(--holi-ink)' }}
    >
      {label}
    </span>
  </button>
);
