# Bike Flip Fix Redux v1.0

CLEO Redux port/remaster of **Bike Flip Fix** for **GTA San Andreas Classic 1.0**.

## Credits

- Original Bike Flip Fix: **nadalao**
- Original crash fix / assistance: **Junior_Djjr**
- CLEO Redux port/remaster: **Flaqko**

## What it does

While CJ is airborne on a bike, the normal forward/back bike control produces clean frontflips and backflips. While the flip input is held, the script controls pitch rotation and suppresses the unwanted sideways rotational component that can turn a flip into a corkscrew.

## Remaster improvements

- Rewritten in JavaScript for CLEO Redux.
- FPS-independent flip control; no old 40+ FPS limitation.
- Uses the proven **6.25** maximum pitch rotation rate from the tested build.
- Revalidates CJ and the current bike so deleted or replaced mission bikes do not leave a stale vehicle reference.
- Removes the original low-FPS `SET_CAR_STATUS` workaround.
- Optimized polling: slower checks while CJ is on foot or grounded, with per-frame work only while actually airborne.
- Debug logging is disabled in the release build.
- No `[mem]` or `[fs]` permission is required.

## Installation

Copy `BikeFlipFixRedux.js` into your GTA San Andreas `CLEO` folder.

Requires **GTA San Andreas Classic 1.0** and **CLEO Redux**.

## Usage

Take a jump on a motorcycle, BMX, or other bike recognized by GTA. While airborne, use the normal bike forward/back control to rotate into a frontflip or backflip.

The script leaves normal airborne physics alone when no flip input is being held.

## Version

**v1.0** — Initial stable CLEO Redux release.
