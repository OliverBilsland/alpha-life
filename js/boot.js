/* ==================== GO ==================== */
order=shuffle([...S.keys()]);
/* Put the home building where this save says you live, before the first frame.
   persist.js loads after this and calls it again once homeTier is restored. */
syncHome();
seedLife();
hud();step();
toast('WASD or arrows to move. Walk to a door and press E.');
