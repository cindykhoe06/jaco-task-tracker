// Kumpulan class Tailwind yang dipakai berulang, supaya tidak ditulis ulang di tiap komponen.

export const btnPrimary =
  'rounded-md bg-[#2f2f2d] px-3 py-[5px] font-medium text-white hover:bg-black disabled:opacity-50'

export const btnGhost =
  'rounded-md border border-line bg-white px-3 py-[5px] font-medium hover:bg-hover'

export const addRow =
  'w-full rounded-md px-2 py-1.5 text-left text-faint hover:bg-hover hover:text-muted'

// Tombol yang muncul saat hover (selalu tampil di layar sentuh)
export const revealOnHover =
  'opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 [@media(hover:none)]:opacity-100'
