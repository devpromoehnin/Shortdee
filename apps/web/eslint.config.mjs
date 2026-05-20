import next from '@clipdee/config/eslint/next'

export default [
  ...next,
  {
    ignores: ['.next/**', 'next-env.d.ts'],
  },
]
