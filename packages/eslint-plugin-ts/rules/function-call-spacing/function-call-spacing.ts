import type { Tree } from '@shared/types'

import {
  LINEBREAK_MATCHER,
  isNotOptionalChainPunctuator,
  isOpeningParenToken,
  isOptionalCallExpression,
} from '@typescript-eslint/utils/ast-utils'
import { createRule } from '../../../utils/create-rule'
import type { MessageIds, RuleOptions } from './types'

export default createRule<RuleOptions, MessageIds>({
  name: 'function-call-spacing',
  package: 'ts',
  meta: {
    type: 'layout',
    docs: {
      description:
        'Require or disallow spacing between function identifiers and their invocations',
    },
    fixable: 'whitespace',
    schema: {
      anyOf: [
        {
          type: 'array',
          items: [
            {
              type: 'string',
              enum: ['never'],
            },
          ],
          minItems: 0,
          maxItems: 1,
        },
        {
          type: 'array',
          items: [
            {
              type: 'string',
              enum: ['always'],
            },
            {
              type: 'object',
              properties: {
                allowNewlines: {
                  type: 'boolean',
                },
              },
              additionalProperties: false,
            },
          ],
          minItems: 0,
          maxItems: 2,
        },
      ],
    },

    messages: {
      unexpectedWhitespace:
        'Unexpected whitespace between function name and paren.',
      unexpectedNewline: 'Unexpected newline between function name and paren.',
      missing: 'Missing space between function name and paren.',
    },
  },
  defaultOptions: ['never', {}] as unknown as RuleOptions,
  create(context, [option, config]) {
    const sourceCode = context.sourceCode
    const text = sourceCode.getText()

    /**
     * Check if open space is present in a function name
     * @param node node to evaluate
     * @private
     */
    function checkSpacing(
      node: Tree.CallExpression | Tree.NewExpression,
    ): void {
      const isOptionalCall = isOptionalCallExpression(node)

      const closingParenToken = sourceCode.getLastToken(node)!
      const lastCalleeTokenWithoutPossibleParens = sourceCode.getLastToken(
        node.typeArguments ?? node.callee,
      )!
      const openingParenToken = sourceCode.getFirstTokenBetween(
        lastCalleeTokenWithoutPossibleParens,
        closingParenToken,
        isOpeningParenToken,
      )
      if (!openingParenToken || openingParenToken.range[1] >= node.range[1]) {
        // new expression with no parens...
        return
      }
      const lastCalleeToken = sourceCode.getTokenBefore(
        openingParenToken,
        isNotOptionalChainPunctuator,
      )!

      const textBetweenTokens = text
        .slice(lastCalleeToken.range[1], openingParenToken.range[0])
        .replace(/\/\*.*?\*\//gu, '')
      const hasWhitespace = /\s/u.test(textBetweenTokens)
      const hasNewline
        = hasWhitespace && LINEBREAK_MATCHER.test(textBetweenTokens)

      if (option === 'never') {
        if (hasWhitespace) {
          return context.report({
            node,
            loc: lastCalleeToken.loc.start,
            messageId: 'unexpectedWhitespace',
            fix(fixer) {
              /**
               * Only autofix if there is no newline
               * https://github.com/eslint/eslint/issues/7787
               */
              if (
                !hasNewline
                // don't fix optional calls
                && !isOptionalCall
              ) {
                return fixer.removeRange([
                  lastCalleeToken.range[1],
                  openingParenToken.range[0],
                ])
              }

              return null
            },
          })
        }
      }
      else if (isOptionalCall) {
        // disallow:
        // foo?. ();
        // foo ?.();
        // foo ?. ();
        if (hasWhitespace || hasNewline) {
          context.report({
            node,
            loc: lastCalleeToken.loc.start,
            messageId: 'unexpectedWhitespace',
          })
        }
      }
      else {
        if (!hasWhitespace) {
          context.report({
            node,
            loc: lastCalleeToken.loc.start,
            messageId: 'missing',
            fix(fixer) {
              return fixer.insertTextBefore(openingParenToken, ' ')
            },
          })
        }
        else if (!config!.allowNewlines && hasNewline) {
          context.report({
            node,
            loc: lastCalleeToken.loc.start,
            messageId: 'unexpectedNewline',
            fix(fixer) {
              return fixer.replaceTextRange(
                [lastCalleeToken.range[1], openingParenToken.range[0]],
                ' ',
              )
            },
          })
        }
      }
    }

    return {
      CallExpression: checkSpacing,
      NewExpression: checkSpacing,
    }
  },
})
