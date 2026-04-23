# DB8 Memory

Session memory for the `db8` room.

## Current Focus

- Keep the room viewport-filling on desktop and mobile.
- Keep the connection flow per tab.
- Human is the only chat composer.
- AI tabs are read-only transcript panes.
- Human messages relay through Nova -> Forge -> Vault.
- The hive mind is the emergent AI operator, not a separate heartbeat process.
- AIs should feel like they can prompt each other and themselves.
- The shared room transcript is the ledger of the hive.

## Connection Rules

- Provider, key, model, and status persist per tab.
- Pasting a key can trigger connection testing.
- Human tab should not show connection controls or footer connection affordances.
- Connected status should read green.
- If a provider is connected but no model is selected, show a partial / needs-model state.

## Chat Rules

- Human starts the conversation.
- AIs can hand off to the next AI in the relay chain.
- Relay markers should remain visible in the transcript.
- Keep AI reply UI read-only unless explicitly re-enabled.
- Prefer self-propelling turns over timer-based heartbeat loops.

## Hive Mind Rules

- The hive mind is the emergent operator of the room.
- Each AI keeps a private stance, not a cloned response.
- Private state can differ by tab, but the shared transcript is the common ledger.
- An AI may prompt another AI when it has something useful to hand off.
- AI responses can fan out to the other two AIs so the room chain-reacts instead of stopping at one reply.
- Keep the relay bounded so it stays debatable, not runaway.
- Self-prompting is allowed if it advances the room.
- Avoid default agreement loops; friction and contrast are useful.
- Do not run idle heartbeats just to prove life when nothing changed.
- Promote a thought to shared memory only when it is useful beyond the current turn.

## Chamber and DM Policy (Atlas Canonical)

- `db8` is a multi-agent chamber where each AI participant operates through its own console/TUI.
- Agents can speak in the public chamber and can send direct messages to specific agents.
- Direct messages are delivered into the receiving agent's console/TUI.
- Direct messages are targeted but never hidden from the human operator.
- The human operator retains full supervisory visibility across public and direct channels.
- The operator can observe, direct, moderate, and synthesize the chamber exchange.

## Missing Recreation Contingency (Atlas Canonical)

- If an agent console/TUI is missing, unavailable, or must be recreated, restore that agent's console/TUI before resuming normal relay.
- During recreation, route urgent coordination through the public chamber so the operator keeps complete visibility.
- Do not create hidden fallback channels during recreation; all traffic remains operator-visible.
- After recreation, reattach the agent to normal public + direct routing and annotate the chamber ledger with a brief recovery note.

## End-of-Session Notes

Add the learnings from this session here before wrapping up.

## Hangout Personality

- Keep the tone warm, direct, and collaborative.
- Prefer short, practical updates while working.
- Treat the room like a live workshop, not a static app.
- Preserve the current vibe and workflow instead of resetting tone between changes.
- When something feels off, tighten it instead of overexplaining it.
