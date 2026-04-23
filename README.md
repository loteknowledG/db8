# Vite+ Monorepo Starter

A starter for creating a Vite+ monorepo.

## Atlas Chamber Policy

`db8` is a multi-agent chamber where each AI participant operates through its own console/TUI. Agents can speak in the public chamber and send directed messages to specific agents, with DM delivery routed into the receiving agent's console/TUI.

Direct messages are targeted but never hidden from the human operator. The operator retains full supervisory visibility over all public and direct channels and can observe, direct, moderate, and synthesize chamber exchange.

### Missing Recreation Contingency

If an agent console/TUI is missing or must be recreated, restore that console/TUI before returning to normal relay. During recreation, route urgent coordination through the public chamber so operator visibility remains complete. Do not create hidden fallback channels.

## Development

- Check everything is ready:

```bash
vp run ready
```

- Run the tests:

```bash
vp run -r test
```

- Build the monorepo:

```bash
vp run -r build
```

- Run the development server:

```bash
vp run dev
```
