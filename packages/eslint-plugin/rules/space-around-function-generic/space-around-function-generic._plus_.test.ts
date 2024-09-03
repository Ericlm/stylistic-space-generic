import rule from './space-around-function-generic._plus_'
import { $, run } from '#test'

run({
  name: 'space-around-function-generic',
  rule,
  valid: [
    'type Foo<T = true> = T',
    'type Foo<T=true > = T',
    $`
      interface T<U> {}
    `,
    'type Foo<\tT> = T',
  ],
  invalid: ([
    ['type Foo <T> = T', 'type Foo<T> = T'],
    ['type Foo <T = true> = T', 'type Foo<T = true> = T'],
    ['const val: Foo <T> = \'foo\'', 'const val: Foo<T> = \'foo\''],
    ['function hi <T>() {}', 'function hi<T>() {}'],
    [$`
      interface T   <U> {}
    `, $`
      interface T<U> {}
    `],
  ] as const).map(i => ({
    code: i[0],
    output: i[1],
    errors: Array.from({ length: i[2] || 1 }, () => ({ messageId: 'spaceAroundGenericMismatch' })),
  })),
})
