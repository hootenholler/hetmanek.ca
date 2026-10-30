// Direction of the page transition (see "page transitions" in styles.css): "back" when the destination is Home,
// "fwd" otherwise. The outgoing page sets it on pageswap, the incoming page on pagereveal.
// Loaded as a blocking script in <head>, because pagereveal fires before the first frame and a deferred script can miss it.
// Browsers without cross-document view transitions never fire these events with a transition, and just navigate.
const direction = (url) => (new URL(url).pathname === '/' ? 'back' : 'fwd');

addEventListener('pageswap', (e) => {
  if (e.viewTransition && e.activation) document.documentElement.dataset.tx = direction(e.activation.entry.url);
});
addEventListener('pagereveal', (e) => {
  if (e.viewTransition) document.documentElement.dataset.tx = direction(location.href);
});
