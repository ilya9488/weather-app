/**
 * Ukrainian → Latin transliteration by the official rules (Cabinet of Ministers
 * resolution No. 55, 2010) — the same rules geographic databases use for
 * Ukrainian place names. A few Russian letters are covered too.
 */

// Letters with a different form at the beginning of a word
const WORD_START = { є: 'ye', ї: 'yi', й: 'y', ю: 'yu', я: 'ya' }

const LETTERS = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'h',
  ґ: 'g',
  д: 'd',
  е: 'e',
  є: 'ie',
  ж: 'zh',
  з: 'z',
  и: 'y',
  і: 'i',
  ї: 'i',
  й: 'i',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ь: '',
  ю: 'iu',
  я: 'ia',
  "'": '',
  '’': '',
  ʼ: '',
  // Russian
  ы: 'y',
  э: 'e',
  ё: 'io',
  ъ: '',
}

const CYRILLIC = /[а-яёіїєґ]/i

export function hasCyrillic(text = '') {
  return CYRILLIC.test(text)
}

export function transliterate(text) {
  const chars = [...text]
  return chars
    .map((char, index) => {
      const lower = char.toLowerCase()
      if (!(lower in LETTERS)) return char

      const prev = chars[index - 1]?.toLowerCase()
      const isWordStart = !prev || !/[a-zа-яёіїєґ'’ʼ]/i.test(prev)
      // "зг" is written "zgh" to tell it apart from "ж" (zh)
      const latin =
        lower === 'г' && prev === 'з'
          ? 'gh'
          : isWordStart && lower in WORD_START
            ? WORD_START[lower]
            : LETTERS[lower]

      return char !== lower && latin ? latin[0].toUpperCase() + latin.slice(1) : latin
    })
    .join('')
}
