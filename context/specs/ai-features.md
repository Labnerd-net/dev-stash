# Spec for ai-features

Title: AI Features with Claude Haiku
Branch: claude/feature/ai-features
Spec file: context/specs/ai-features.md

## Summary

Add four AI-powered features to DevStash using the Anthropic Claude Haiku API. Each feature is triggered on demand by the user (not automatic), with clear loading states and error handling. The goal is to reduce friction around tagging, understanding, and refining items stored in the stash.

- **Auto-tag suggestions**: suggest relevant tags based on item title, content, and type
- **AI summary**: generate a short summary for text-based items (notes, prompts)
- **Explain This Code**: explain what a snippet or command does in plain English
- **Prompt optimizer**: rewrite and improve a prompt item for clarity and effectiveness

## Functional Requirements

- All AI actions are triggered by a button click — never automatic
- The Anthropic API key is stored as a secret (`ANTHROPIC_API_KEY`) in the Worker environment
- All requests use the Claude Haiku model
- Each action has a loading state (button disabled + spinner or label change) while waiting for the response
- Each action has an error state with a user-friendly message if the API call fails
- **Auto-tag suggestions**: available on the item create and edit form for all item types that have content, title, or URL; presents a list of suggested tags the user can accept or dismiss individually; accepted tags are added to the TagSelector
- **AI summary**: available on the item detail page for note and prompt types; displays the summary inline below the content; summary is not saved to the database — it is ephemeral per page load
- **Explain This Code**: available on the item detail page for snippet and command types; displays the explanation inline below the code block; ephemeral per page load
- **Prompt optimizer**: available on the item detail page for prompt type; displays the optimized prompt inline; user can copy it to clipboard; ephemeral — does not overwrite the original

## Possible Edge Cases

- Item has no content — AI action should be disabled or skipped with a message
- API key not configured — return a clear error rather than a cryptic failure
- Haiku rate limit or timeout — surface a retry-friendly error message
- Very long content — truncate input to fit within Haiku's context window before sending
- User triggers the same action multiple times — debounce or disable button while in-flight
- Summary/explanation for very short items — result may not be useful; acceptable, no special handling needed

## Acceptance Criteria

- [ ] `ANTHROPIC_API_KEY` secret is documented as required in CLAUDE.md and wrangler.jsonc comments
- [ ] Auto-tag suggestions appear on the item create/edit form and can be added to TagSelector individually
- [ ] AI summary button appears on note and prompt item detail pages and displays result inline
- [ ] Explain This Code button appears on snippet and command item detail pages and displays result inline
- [ ] Prompt optimizer button appears on prompt item detail pages and displays result inline
- [ ] All four actions show a loading state while the API call is in progress
- [ ] All four actions show an inline error message on failure
- [ ] No AI result is persisted to the database — all outputs are ephemeral
- [ ] Content is truncated before sending to the API if it exceeds a safe limit

## Open Questions

- Should auto-tag suggestions replace the current tags or be additive? (Additive — user picks which to add)
- Should the prompt optimizer show a diff vs the original, or just the rewritten version? (Just the rewritten version with a copy button)
- What truncation limit should be used for content sent to Haiku? (Suggest ~4000 chars as a safe default)

## Testing Guidelines

No test runner is configured. Verify manually in the browser:

- Create a snippet item and confirm tag suggestions appear and can be added
- View a note item and confirm the summary renders after clicking the button
- View a snippet item and confirm the code explanation renders
- View a prompt item and confirm the optimizer output renders and can be copied
- Disconnect network or use an invalid API key and confirm error states display correctly
- Test with an item that has no content and confirm the action is handled gracefully

## Personal Opinion

These are high-value features for a developer tool — explaining code and optimizing prompts in particular. The ephemeral approach (no DB writes) keeps it simple and avoids stale data issues. Haiku is the right call over Cloudflare Workers AI for these tasks given the code understanding requirements.

One concern: auto-tagging on the create form adds complexity to an already busy form. Consider making it feel lightweight — a subtle "Suggest tags" link rather than a prominent button, so it doesn't overwhelm new users.
