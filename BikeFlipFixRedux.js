/// <reference path=".config/sa.d.ts" />

// Bike Flip Fix Redux v1.0
// Classic GTA San Andreas 1.0 + CLEO Redux
//
// Independent JavaScript port/remaster of the supplied classic CLEO script.
// Original mod: Bike Flip Fix by nadalao
// Original crash fix / assistance: Junior_Djjr
// Redux port/remaster: Flaq project build
//
// Purpose:
// - Lets the normal bike forward/back control produce clean front/back flips
//   while the bike is airborne.
// - Suppresses the unwanted sideways rotational component while the player is
//   actively commanding a flip.
// - Uses direct angular velocity instead of the original FPS-banded timed math,
//   so the effect is intended to be consistent across frame rates.
//
// No CLEO Redux permissions are required.

const MOD = "BikeFlipFixRedux";
const VERSION = "v1.0";
const PLAYER_ID = 0;

// Full-stick pitch angular velocity in radians/second-ish game units.
// 6.25 is close to one full revolution per second at maximum input.
const MAX_PITCH_ROTATION = 6.25;

// Original script reacted to any non-zero vertical input. Keep that behavior
// for the release build. Raise this (for example to 5 or 8) if a controller
// has noticeable stick drift.
const INPUT_DEADZONE = 0;

// Preserve the original activation test exactly:
// quaternion X > 0.02 OR quaternion Y < -0.02.
const QUATERNION_TRIGGER = 0.02;

// Release build: debug logging disabled.
const DEBUG_LOG = false;

let flipControlArmed = false;
let trackedBike = 0;
let nextWait = 100;

function dbg(message) {
    if (DEBUG_LOG) {
        log("[" + MOD + " " + VERSION + "] " + message);
    }
}

function finiteNumber(value, fallback) {
    return (typeof value === "number" && Number.isFinite(value))
        ? value
        : fallback;
}

function outputNumber(result, keys, index, fallback) {
    if (typeof result === "number" && Number.isFinite(result)) {
        return result;
    }

    if (Array.isArray(result)) {
        return finiteNumber(result[index], fallback);
    }

    if (result && typeof result === "object") {
        for (const key of keys) {
            if (typeof result[key] === "number" && Number.isFinite(result[key])) {
                return result[key];
            }
        }
    }

    return fallback;
}

function getQuaternion(car) {
    const q = native("GET_VEHICLE_QUATERNION", car);

    return {
        x: outputNumber(q, ["x", "quatX", "qX"], 0, 0.0),
        y: outputNumber(q, ["y", "quatY", "qY"], 1, 0.0),
        z: outputNumber(q, ["z", "quatZ", "qZ"], 2, 0.0),
        w: outputNumber(q, ["w", "quatW", "qW"], 3, 1.0)
    };
}

function getVerticalBikeInput() {
    const sticks = native("GET_POSITION_OF_ANALOGUE_STICKS", PLAYER_ID);

    // Opcode 0494 output order:
    // leftStickX, leftStickY, rightStickX, rightStickY
    return outputNumber(
        sticks,
        ["leftStickY", "leftY", "lY", "ly"],
        1,
        0
    );
}

function resetFlipState(reason) {
    if (flipControlArmed) {
        dbg("air control ended" + (reason ? " - " + reason : ""));
    }

    flipControlArmed = false;
    trackedBike = 0;
}

function validVehicle(car) {
    return !!car && !!native("DOES_VEHICLE_EXIST", car);
}

function canArmFromQuaternion(car) {
    const q = getQuaternion(car);
    return q.x > QUATERNION_TRIGGER || q.y < -QUATERNION_TRIGGER;
}

dbg("loaded. FPS-independent airborne pitch control active; max pitch=" + MAX_PITCH_ROTATION.toFixed(2));

while (true) {
    wait(nextWait);
    nextWait = 20;

    if (!native("IS_PLAYER_PLAYING", PLAYER_ID)) {
        resetFlipState("player unavailable");
        nextWait = 250;
        continue;
    }

    const cj = native("GET_PLAYER_CHAR", PLAYER_ID);

    if (!cj || !native("DOES_CHAR_EXIST", cj)) {
        resetFlipState("CJ handle unavailable");
        nextWait = 100;
        continue;
    }

    if (!native("IS_CHAR_ON_ANY_BIKE", cj)) {
        resetFlipState("not on a bike");
        nextWait = 50;
        continue;
    }

    const bike = native("STORE_CAR_CHAR_IS_IN_NO_SAVE", cj);

    if (!validVehicle(bike)) {
        resetFlipState("bike handle invalid");
        nextWait = 50;
        continue;
    }

    if (!native("IS_CAR_IN_AIR_PROPER", bike)) {
        resetFlipState("landed");
        nextWait = 10;
        continue;
    }

    // Airborne: run every game tick only while it matters.
    nextWait = 0;

    // If a mission or another script swapped/deleted the bike, do not carry an
    // armed state to the replacement handle.
    if (trackedBike !== 0 && trackedBike !== bike) {
        resetFlipState("bike changed");
    }

    if (!flipControlArmed) {
        if (!canArmFromQuaternion(bike)) {
            continue;
        }

        flipControlArmed = true;
        trackedBike = bike;
        dbg("air control armed");
    }

    // Revalidate after arming, mirroring the crash-fixed classic script's
    // repeated existence checks.
    if (!validVehicle(bike)) {
        resetFlipState("bike deleted while airborne");
        continue;
    }

    const inputY = getVerticalBikeInput();

    if (Math.abs(inputY) <= INPUT_DEADZONE) {
        // Preserve natural airborne physics whenever the player is not asking
        // for a front/back flip.
        continue;
    }

    // Normalize the classic -127..127-ish pad value. Clamp protects against
    // unusual controller values without changing ordinary keyboard/gamepad use.
    const normalized = Math.max(-1.0, Math.min(1.0, inputY / 127.0));
    const pitchVelocity = normalized * MAX_PITCH_ROTATION;

    // Critical behavior from the original fix:
    // X = wanted front/back pitch; Y/Z = zero to stop the bike twisting to a
    // side while a flip input is being held.
    native(
        "SET_CAR_ROTATION_VELOCITY",
        bike,
        pitchVelocity,
        0.0,
        0.0
    );
}
