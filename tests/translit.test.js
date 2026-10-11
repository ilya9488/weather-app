import { describe, expect, it } from 'vitest'
import { hasCyrillic, transliterate } from '@/utils/translit'

describe('transliterate', () => {
  it.each([
    ['Крюківщ', 'Kriukivshch'],
    ['Крюківщина', 'Kriukivshchyna'],
    ['Київ', 'Kyiv'],
    ['Харків', 'Kharkiv'],
    ['Згурівка', 'Zghurivka'],
    ['Яготин', 'Yahotyn'],
    ['Біла Церква', 'Bila Tserkva'],
    ['Юрівка', 'Yurivka'],
    ['Їжаківка', 'Yizhakivka'],
    ["Кам'янець-Подільський", 'Kamianets-Podilskyi'],
  ])('%s → %s', (input, expected) => {
    expect(transliterate(input)).toBe(expected)
  })

  it('keeps Latin text as is', () => {
    expect(transliterate('London')).toBe('London')
  })
})

describe('hasCyrillic', () => {
  it('detects Cyrillic letters', () => {
    expect(hasCyrillic('Київ')).toBe(true)
    expect(hasCyrillic('Kyiv')).toBe(false)
    expect(hasCyrillic(undefined)).toBe(false)
  })
})
