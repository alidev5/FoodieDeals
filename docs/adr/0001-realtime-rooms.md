# 0001: Realtime fan-out via per-order and per-restaurant Socket.IO rooms

## Status

Accepted.

## Context

Order status changes need to reach exactly two audiences: the customer who
placed that one order, and the restaurant that owns it. Restaurant
Open/Paused changes need to reach every browsing customer. A broadcast-to-all
approach would leak one customer's order details to every other connected
client; a per-user websocket with no grouping would mean iterating every
connection on every event.

## Decision

Use Socket.IO rooms as the only fan-out mechanism, with three kinds of room:

- `order:{orderId}` — joined only after the gateway checks that the joining
  socket's `deviceId` matches the order's customer. One customer, one order,
  one room.
- `restaurant:{restaurantId}` — joined only after the gateway checks the
  socket's `demoKey` against that restaurant. One tablet (or more, in
  principle), one room.
- `restaurants` — joined automatically by every socket on connect, no auth,
  since Open/Paused status is public information already shown on the
  unauthenticated `GET /restaurants` endpoint.

Room names and the join/emit event contracts live once in
`packages/shared/src/realtime.ts`, imported by the gateway and both Expo
apps, so a typo can't silently create two different room names on client and
server.

## Consequences

- Join requests are an auth check, not just a subscription — rejecting a
  join is how a customer is kept out of another customer's order room. This
  is covered by `realtime.e2e-spec.ts`.
- The event publisher (`EventsPublisher`) never needs to know which socket
  ids are interested in an event — it emits to a room name derived from the
  domain event's payload, so adding a new listener is just another `.on()`
  on the client, not a server change.
- A customer with multiple devices, or a restaurant with multiple tablets,
  naturally all receive the same events, since rooms aren't tied to a single
  socket connection.
