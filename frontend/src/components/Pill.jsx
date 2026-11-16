// Warna label per status / priority
const COLORS = {
  'status:Todo': 'bg-pill-gray text-pill-gray-ink',
  'status:In Progress': 'bg-pill-blue text-pill-blue-ink',
  'status:Done': 'bg-pill-green text-pill-green-ink',
  'priority:Low': 'bg-pill-green text-pill-green-ink',
  'priority:Medium': 'bg-pill-yellow text-pill-yellow-ink',
  'priority:High': 'bg-pill-red text-pill-red-ink',
}

const base = 'inline-block whitespace-nowrap rounded px-[7px] text-[12.5px] leading-5'

/** Label berwarna untuk status / priority. */
export function Pill({ kind, value }) {
  return <span className={`${base} ${COLORS[`${kind}:${value}`]}`}>{value}</span>
}

/** Dropdown yang tampil seperti label, dipakai untuk ubah status / priority. */
export function PillSelect({ kind, value, options, onChange, disabled, label }) {
  return (
    <select
      className={`${base} ${COLORS[`${kind}:${value}`]} cursor-pointer appearance-none border-0 outline-none hover:brightness-95`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      disabled={disabled}
      aria-label={label}
    >
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  )
}
