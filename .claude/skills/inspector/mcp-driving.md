# Driving the Browser via Playwright MCP

The Playwright MCP server exposes the browser as a set of tool calls. This file is a quick reference for the tools you'll use during an audit, the patterns for common probes, and the pitfalls specific to MCP-driven testing.

## Tool catalogue (typical Playwright MCP surface)

Tool names vary slightly across MCP server versions. The list below uses the names from the official `@playwright/mcp` package. If `tool_search` shows differently-named tools, map by description, not exact name.

| Tool | What it does | Use when |
|---|---|---|
| `browser_navigate` | Go to a URL | Starting a flow; switching pages |
| `browser_snapshot` | Capture accessibility tree of the current page | **Default observation.** Use after every navigation and after most interactions. |
| `browser_take_screenshot` | Capture a PNG | Evidence for the report; visual issues (contrast, layout, responsive) |
| `browser_click` | Click an element by ref/role/name | Advancing through a flow |
| `browser_type` | Type into an input | Filling forms |
| `browser_press_key` | Press a keyboard key | Tab navigation, Enter to submit, Escape to close modals |
| `browser_hover` | Hover over an element | Revealing tooltips, hover-only menus |
| `browser_select_option` | Pick from a `<select>` | Form dropdowns |
| `browser_resize` | Change viewport size | Responsive testing |
| `browser_wait_for` | Wait for text/element to appear | After actions that trigger async work |
| `browser_evaluate` | Run JS in the page | Reading computed styles, contrast ratios, etc. when snapshot isn't enough |
| `browser_console_messages` | Read console output | Surfacing JS errors, hydration warnings |
| `browser_network_requests` | List recent network activity | Finding failed requests after an action |
| `browser_close` | Close the browser context | Cleanup at end of audit |

## The basic loop

For each step of each flow, the rhythm is:

```
1. browser_snapshot          → see what's on screen
2. (reason about the snapshot — does it match the PRD?)
3. browser_take_screenshot   → save evidence
4. browser_click / type / …  → take the next action
5. browser_wait_for          → settle if the action is async
```

Save each screenshot with a name like `<flow>-<viewport>-<step>.png` and each snapshot JSON with a matching name in `a11y/`. Consistent naming makes the report easier to assemble.

## Snapshot discipline

`browser_snapshot` is your primary sense of what's on screen, but the output can be huge — a content-heavy page can produce thousands of lines of accessibility tree. A few habits keep this manageable:

- **Don't snapshot every action.** Snapshot when you arrive at a new page or after a state change you care about. After typing into a field, you usually don't need a fresh snapshot before pressing Enter.
- **Save snapshots as files, don't carry them in the conversation.** Write each one to `audit-workspace/a11y/<name>.json` immediately. You can re-read the file if you need to refer back, but you don't need the full tree in active context.
- **For massive pages, scope or summarize.** If a snapshot returns a wall of content, focus on the region you care about — note the relevant section in your reasoning rather than the whole tree.

## Probe patterns

### Keyboard navigation

Pressing Tab repeatedly and snapshotting after each press tells you the focus order and whether each focused element has visible focus.

```
browser_navigate(url="http://localhost:3000")
for i in range(20):
    browser_press_key(key="Tab")
    snap = browser_snapshot()
    # In the snapshot, find the focused element. Record its role, name,
    # and whether it has any visible focus indicator. Watch for:
    #   - elements with no accessible name (a11y issue)
    #   - the same element being focused twice (focus trap)
    #   - interactive elements that Tab skips
    #   - elements where outline is removed and not replaced
```

Save the sequence as `audit-workspace/a11y/tab-order.json` so you can reference it in findings.

### Form validation

```
browser_navigate(url=".../signup")
browser_take_screenshot()                    # empty state
browser_click(<submit button>)               # submit with nothing filled
browser_take_screenshot()                    # what happened?
snap = browser_snapshot()
# Look for: aria-invalid on fields, live regions with error text,
# focus moving to the first invalid field, plain-language error messages.
# Note what's missing.
```

### Loading state / feedback timing

After a click that triggers async work, the user should see feedback within ~100ms.

```
browser_click(<button that submits>)
# Within 100ms, ideally there's: a loading spinner, a disabled button,
# or the result of the action. Wait a beat, then check what's on screen.
browser_take_screenshot()
# Then wait for completion:
browser_wait_for(text="Saved" OR text="Welcome back" OR ...)
```

If `browser_wait_for` returns nothing visible changed for several seconds and the screenshot still looks like the pre-click state, that's a "visibility of system status" finding.

### Console / hydration errors

```
browser_navigate(url="http://localhost:3000")
msgs = browser_console_messages()
# Filter for errors and warnings. Hydration mismatches show up here
# as warnings like "Hydration failed because the initial UI does
# not match what was rendered on the server."
```

Capture these once per page visited.

### Responsive sweep

```
for vp in [(375, 667), (1440, 900)]:
    browser_resize(width=vp[0], height=vp[1])
    browser_navigate(url="http://localhost:3000")
    browser_take_screenshot()  # save with viewport in the name
    snap = browser_snapshot()
    # Walk the key flows again at this viewport.
    # Look for: horizontal scrollbars (check via browser_evaluate for
    # document.documentElement.scrollWidth > clientWidth),
    # tap targets < 44×44 on mobile, clipped modals, overlapping text.
```

### Contrast / computed style spot-checks

Snapshots don't include computed styles. When you want to verify color contrast or font sizes:

```
browser_evaluate(script="""
  const el = document.querySelector('your-selector');
  const cs = getComputedStyle(el);
  return {
    color: cs.color,
    background: cs.backgroundColor,
    fontSize: cs.fontSize,
    outline: cs.outlineStyle
  };
""")
```

Compute contrast against background by feeding the colors into the standard WCAG formula (it's short — you can inline it in another `browser_evaluate` call). Spot-check only suspicious-looking text; don't try to audit every element this way.

## Common pitfalls

- **Snapshots aren't screenshots.** Don't confuse the two. Snapshot = accessibility tree (the *structure* of the page). Screenshot = pixels (the *appearance*). You usually want both, for different parts of a finding.
- **`browser_wait_for` can hang.** If you wait for text that never appears (because the action silently failed), you'll burn time. Pair it with a reasonable timeout and have a "no feedback seen" fallback that itself becomes a finding.
- **Modals and overlays can hide the rest of the page.** If a snapshot looks empty or sparse, check whether there's a modal/dialog covering things. Dismiss it (Escape, click outside, or click an explicit close button) and snapshot again — but note whether the dismissal mechanism was obvious.
- **Cookie banners and consent dialogs.** Many apps gate the real UI behind one. Accept/dismiss as a real user would and continue, but record the banner as part of the first-run experience.
- **Auth-gated flows.** If the PRD describes flows that require login, ask the user for test credentials before starting. Don't try to create an account in their database silently.
- **Animations cause inconsistent screenshots.** If a page animates content in, screenshots can capture mid-animation frames. Either wait a moment after navigation/state changes, or instruct the browser to reduce motion: `browser_evaluate(script="document.documentElement.style.setProperty('--motion-duration', '0s')")` or via `prefers-reduced-motion` if the app respects it.
- **MCP browser state persists across calls.** If you navigate to page A, fill a form, navigate to page B, then back to A — the form may or may not still be filled depending on the app. Be deliberate about resetting state (close the browser context, reopen) when a flow needs a clean slate.
- **`browser_close` at the end matters.** A lingering browser context will hold onto memory and ports. Always close it as part of cleanup, even on errors.

## When MCP isn't enough

A few audit checks can't be done well through MCP and are worth flagging as limitations rather than faking:

- **True keyboard-only navigation by a screen reader user.** MCP simulates Tab/Enter, but real screen readers (NVDA, VoiceOver, JAWS) interpret content differently. The accessibility snapshot is a strong proxy, but not the same thing.
- **Cross-browser quirks.** Playwright MCP uses one browser at a time; if the user needs Safari- or Firefox-specific issues, note it and recommend a manual pass there.
- **Subjective aesthetic judgment.** Whether the visual hierarchy "feels right" is partly a human call. The skill can flag obvious problems (three competing primary buttons, no clear focal point) but shouldn't pretend to have taste.

When you hit one of these, say so in the report's executive summary so the user knows where the audit's coverage ends.
