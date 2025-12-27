import Anthropic from '@anthropic-ai/sdk'

let claudeClient: Anthropic | null = null

/**
 * Get Anthropic Claude client instance (singleton)
 */
export function getClaudeClient(): Anthropic {
  if (!claudeClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set')
    }

    claudeClient = new Anthropic({
      apiKey,
    })
  }

  return claudeClient
}

/**
 * Check if Claude is configured
 */
export function isClaudeConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY
}

/**
 * Default model for RCA and narrative generation
 */
export const CLAUDE_MODEL = 'claude-sonnet-4-20250514'
