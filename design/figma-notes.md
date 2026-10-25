# Figma / design reference notes

Source file: `3dPUi3jcqvvIMNiyt8u4xM`, page "FoodieDeals — Screens".

## Status

The Figma MCP connection hit the Starter plan's tool-call rate limit on the
first request (including plain metadata reads) during Phase 1, so no
screenshots or node measurements were ever pulled directly from Figma. During
Phase 3 you supplied the actual reference instead: `design/screens/FoodieDeals
— Premium App Design.pdf` (full Home / Restaurant / Checkout / Pickup /
restaurant-tablet mockups) and seven real food photos, now wired into
`apps/customer/assets/food/`.

The PDF's layout, copy, and the worked pricing example ($28.00 subtotal,
$5.60 discount, $1.99 tax, $24.39 total, $1.22 platform fee, $23.17 to the
restaurant) line up with what was already built from the written DESIGN
section of the brief, so no rework was needed there. It also shows ratings,
review counts, prep times, and walking distances on restaurant cards — those
are mockup placeholder data with no backing field in the schema or seed, so
they were intentionally left out rather than hard-coded as fake numbers. Add
a real `rating`/`etaMinutes`/`distanceMiles` source before reintroducing them.

## Photo assets

Seven real photos are wired in `apps/customer/src/lib/foodPhotos.ts`:
`ramen.png`, `dumplings.png`, `pizza.png`, `mediterranean.png`,
`taro-tea.png`, `cheesecake.png`, `chili-noodles.png`. Each is reused across
every menu item and restaurant hero photo it visually matches (e.g.
`dumplings.png` covers Crispy Pork Gyoza, the Lotus Dumpling House hero, and
every dumpling-family item there), since the set has one photo per dish
family, not one per menu item.

Six items still render the Phase 1 solid-color placeholder, because nothing
in the supplied photo set matches them: Scallion Pancake, Hot & Sour Soup,
Garlic Knots, Spaghetti Pomodoro, Caesar Salad, Pita Bread. Add real photos
for these the same way — drop the file in `apps/customer/assets/food/` and
point the matching key in `foodPhotos.ts` at it.

## Layout

Every screen follows the written DESIGN spec in `docs/ENGINEERING.md` directly: the
radius scale (12/16/20/24/28/pill), the spacing scale (4/8/12/16/20/24/32),
the type scale, and the calmer palette override (no gradients, no yellow,
solid near-black cards, cream savings banners, single soft neutral shadow).
`design/tokens.json` is the generated source of truth; nothing in the app
code hard-codes a color, radius, or spacing value.
