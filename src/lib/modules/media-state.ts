/** Remembers media playback positions while posts move between live and snapshot. */
export const mediaState = new Map<string, number>();

let interacted = false;
if (typeof window !== 'undefined') {
	const mark = () => (interacted = true);
	for (const ev of ['pointerdown', 'keydown', 'touchstart']) window.addEventListener(ev, mark, { once: true, capture: true });
}
export const userHasInteracted = () => interacted;
