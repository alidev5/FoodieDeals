# Socket.IO events

The event names, room helpers, and payload schemas are all defined once in
`packages/shared/src/realtime.ts` (`SOCKET_EVENTS`, `orderRoom`,
`restaurantRoom`) and imported by both the API and the two Expo apps, so the
client and server can never disagree about a payload shape.

Clients connect with `transports: ['websocket']` (set in
`packages/ui-native/src/socket/SocketProvider.tsx`) so React Native never
falls back to HTTP long-polling.

## Rooms

| Room | Who can join | How |
| --- | --- | --- |
| `restaurants` | anyone | automatic, on connect |
| `order:{orderId}` | the customer who placed that order | emit `join:order` with `{ orderId, deviceId }`; the gateway checks `deviceId` against the order's customer before joining |
| `restaurant:{restaurantId}` | that restaurant's tablet | emit `join:restaurant` with `{ restaurantId, demoKey }`; the gateway checks `demoKey` against the restaurant before joining |

Both join events return an acknowledgement `{ ok: true }` or
`{ ok: false, error: string }` via the Socket.IO callback — clients should
await it rather than assuming the join succeeded.

## Client -> server events

### `join:order`

```ts
{ orderId: string; deviceId: string }
```

### `join:restaurant`

```ts
{ restaurantId: string; demoKey: string }
```

## Server -> client events

### `order:created`

Emitted to `restaurant:{restaurantId}` and to `order:{orderId}` right after
the webhook creates the order (after the database transaction commits).

```ts
{ orderId: string; restaurantId: string; orderNumber: number; status: "WAITING" }
```

### `order:status-changed`

Emitted to both `order:{orderId}` and `restaurant:{restaurantId}` whenever a
restaurant advances an order (`PATCH /orders/:id/actions`).

```ts
{ orderId: string; restaurantId: string; status: "WAITING" | "ACCEPTED" | "READY" | "PICKED_UP" }
```

### `restaurant:availability-changed`

Emitted to the public `restaurants` room whenever a restaurant toggles
Open/Paused (`PATCH /restaurants/:id/availability`).

```ts
{ restaurantId: string; isOpen: boolean }
```

## Reconnection and refetch

Both apps treat socket events as a signal to refetch via TanStack Query
rather than as the source of truth themselves — on `order:status-changed` the
customer app invalidates the `['order', orderId]` query instead of patching
fields in place. This means a missed event (a brief disconnect) self-heals on
the next successful fetch rather than leaving stale state. Both apps also
rejoin their rooms and refetch on socket `connect` (covers initial connect and
every reconnect) and on `AppState` turning `active` (covers the app coming to
the foreground).
