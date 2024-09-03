import type { TSESLint, TSESTree } from '@typescript-eslint/utils'
import type { MessageIds, RuleOptions } from './types'
import { createRule } from '#utils/create-rule'

function reportSpacing(
  context: TSESLint.RuleContext<MessageIds, RuleOptions>,
  node: TSESTree.Node,
  range: TSESTree.Range,
): void {
  context.report({
    node,
    messageId: 'spaceAroundGenericMismatch',
    fix: fixer => fixer.removeRange(range),
  })
}

export default createRule<RuleOptions, MessageIds>({
  name: 'space-around-function-generic',
  package: 'plus',
  meta: {
    type: 'layout',
    docs: {
      description: 'Removes any whitespace before TypeScript type generics',
    },
    fixable: 'whitespace',
    schema: [],
    messages: {
      spaceAroundGenericMismatch: 'Unexpected whitespace before generic type',
    },
  },
  defaultOptions: [],
  create: (context) => {
    const sourceCode = context.sourceCode

    function checkAndReportSpacing(node: TSESTree.Node): void {
      const openingBracket = sourceCode.getFirstToken(node, {
        filter: token => token.value === '<',
      })
      if (!openingBracket)
        return

      const tokenBefore = sourceCode.getTokenBefore(openingBracket)
      if (!tokenBefore)
        return

      const spaceBetween = sourceCode.text.slice(tokenBefore.range[1], openingBracket.range[0])
      if (spaceBetween.length > 0) {
        reportSpacing(context, node, [tokenBefore.range[1], openingBracket.range[0]])
      }
    }

    return {
      TSTypeParameterDeclaration: checkAndReportSpacing,
      TSTypeAnnotation: checkAndReportSpacing,
    }
  },
})
